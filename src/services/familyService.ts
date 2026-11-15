/**
 * Área dos Pais: crianças do responsável logado, cadastro, "liberar tudo" e "zerar".
 * Com Firebase (plano Spark, sem Cloud Functions), o firebase/firestore.rules confere o vínculo responsável → criança:
 * a ficha children/{id} (gravada pela própria conta da criança) aponta o responsável, e o responsável
 * confirma a criança em guardians/{id}.childIds (no máximo 2). Só vale quem está nos dois lugares.
 * Sem Firebase (demonstração), os dados ficam neste navegador.
 */
import { createUserWithEmailAndPassword, deleteUser, updateProfile } from 'firebase/auth';
import { arrayUnion, doc, getDoc, runTransaction, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { activeDb, childEmail, createTempAccount, isFirebaseConfigured, readChildRecord } from '../lib/firebase';
import { emptyDoc, type AccountDoc } from '../lib/store/progressStore';

import { createLocalAdapter, docFromRecord, type ChildStateRecord } from '../lib/store/adapters';
import { normalizeUsername, summarizeDoc, validateChildInput, MAX_CHILDREN, type ChildInput, type ChildSummary } from '../lib/family';
import type { AgeGroup } from '../types';
import { authService } from './authService';
import { hashPassword, readFamily, writeFamily, type DemoChild } from './familyDemo';

export interface ChildSettings {
  unlockAll?: boolean;
  dailyGoal?: number;
  /** Tempo de tela por dia em minutos (0 = sem limite) */
  screenTimeMin?: number;
}

export interface ChildAccount {
  id: string;
  name: string;
  username: string;
  ageGroup: AgeGroup;
  summary: ChildSummary;
}

const localDocs = createLocalAdapter();

/** Crianças confirmadas pelo responsável (guardians/{id}.childIds). */
async function confirmedChildIds(guardianId: string): Promise<string[]> {
  const snap = await getDoc(doc(activeDb(), 'guardians', guardianId));
  const ids = snap.exists() ? (snap.data() as { childIds?: unknown }).childIds : [];
  return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
}

/** Erros do Firebase em português (cadastro da criança). */
function childCreateError(err: unknown): Error {
  const code = (err as { code?: string })?.code ?? '';
  if (code === 'auth/email-already-in-use') return new Error('Esse login já existe, escolha outro.');
  if (code === 'auth/weak-password') return new Error('A senha precisa ter pelo menos 6 caracteres.');
  if (code === 'auth/network-request-failed') return new Error('Sem internet. Confira a conexão e tente de novo.');
  if (code === 'permission-denied') return new Error(`Limite de ${MAX_CHILDREN} crianças por responsável.`);
  return err instanceof Error && !code ? err : new Error('Não foi possível criar a conta. Tente de novo.');
}

/** Grava no progresso da criança (como responsável): revisão + 1, para o aparelho dela recarregar. */
async function updateChildState(childId: string, change: (current: Record<string, unknown>) => Record<string, unknown>): Promise<boolean> {
  const db = activeDb();
  const ref = doc(db, 'childState', childId);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return false;
    const current = snap.data() as Record<string, unknown>;
    tx.update(ref, { ...change(current), revision: (Number(current.revision) || 0) + 1, updatedAt: serverTimestamp() });
    return true;
  });
}

async function requireGuardian(): Promise<string> {
  const user = await authService.getCurrentUser();
  if (!user || user.role === 'student') throw new Error('Entre na conta do responsável.');
  return user.id;
}

export const familyService = {
  async listChildren(): Promise<ChildAccount[]> {
    const guardianId = await requireGuardian();

    if (!isFirebaseConfigured()) {
      const children = readFamily().children.filter((c) => c.guardianId === guardianId);
      return Promise.all(
        children.map(async (c) => ({
          id: c.id,
          name: c.name,
          username: c.username,
          ageGroup: c.ageGroup,
          summary: summarizeDoc(await localDocs.load(c.id)),
        }))
      );
    }

    const db = activeDb();
    const ids = await confirmedChildIds(guardianId);
    const rows = await Promise.all(
      ids.map(async (id) => {
        const [record, state] = await Promise.all([
          readChildRecord(db, id).catch(() => null),
          getDoc(doc(db, 'childState', id)).catch(() => null),
        ]);
        if (!record || record.guardianId !== guardianId) return null;
        return {
          id,
          name: record.name,
          username: record.username,
          ageGroup: record.ageGroup as AgeGroup,
          summary: summarizeDoc(docFromRecord(state?.data() as ChildStateRecord | undefined)),
        };
      })
    );
    return rows.filter((r): r is ChildAccount => r !== null);
  },

  async createChild(input: ChildInput): Promise<void> {
    const problem = validateChildInput(input);
    if (problem) throw new Error(problem);
    const guardianId = await requireGuardian();
    const username = normalizeUsername(input.username);

    if (!isFirebaseConfigured()) {
      const family = readFamily();
      if (family.children.filter((c) => c.guardianId === guardianId).length >= MAX_CHILDREN)
        throw new Error(`Limite de ${MAX_CHILDREN} crianças por responsável.`);
      if (family.children.some((c) => c.username === username)) throw new Error('Esse login já existe, escolha outro.');
      const id = crypto.randomUUID();
      const child: DemoChild = {
        id,
        guardianId,
        name: input.name.trim(),
        username,
        ageGroup: input.ageGroup as AgeGroup,
        passwordHash: await hashPassword(input.password, id),
        created_at: new Date().toISOString(),
      };
      writeFamily({ ...family, children: [...family.children, child] });
      return;
    }

    const db = activeDb();
    const confirmed = await confirmedChildIds(guardianId);
    if (confirmed.length >= MAX_CHILDREN) throw new Error(`Limite de ${MAX_CHILDREN} crianças por responsável.`);

    // A conta da criança nasce numa instância descartável: o responsável continua logado
    const temp = createTempAccount();
    try {
      let created;
      try {
        created = await createUserWithEmailAndPassword(temp.auth, childEmail(username), input.password);
      } catch (err) {
        throw childCreateError(err);
      }
      const childId = created.user.uid;
      try {
        await updateProfile(created.user, { displayName: input.name.trim() });
        // A própria conta da criança grava a ficha (apontando o responsável) e o progresso vazio
        const batch = writeBatch(temp.db);
        batch.set(doc(temp.db, 'children', childId), {
          guardianId,
          name: input.name.trim(),
          username,
          ageGroup: input.ageGroup,
          createdAt: serverTimestamp(),
        });
        batch.set(doc(temp.db, 'childState', childId), {
          state: JSON.stringify(emptyDoc()),
          revision: 0,
          updatedAt: serverTimestamp(),
        });
        await batch.commit();
        // O responsável confirma a criança (as regras limitam a MAX_CHILDREN)
        await setDoc(doc(db, 'guardians', guardianId), { childIds: arrayUnion(childId) }, { merge: true });
      } catch (err) {
        await deleteUser(created.user).catch(() => {}); // desfaz para não sobrar conta solta
        throw childCreateError(err);
      }
    } finally {
      await temp.dispose();
    }
  },

  /** Zera (irreversível) as crianças escolhidas. Devolve quantas foram zeradas. */
  async resetChildren(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const guardianId = await requireGuardian();

    if (!isFirebaseConfigured()) {
      const mine = new Set(readFamily().children.filter((c) => c.guardianId === guardianId).map((c) => c.id));
      const targets = ids.filter((id) => mine.has(id));
      await Promise.all(targets.map((id) => localDocs.save(id, emptyDoc())));
      return targets.length;
    }

    const mine = new Set(await confirmedChildIds(guardianId));
    let count = 0;
    for (const id of new Set(ids)) {
      if (!mine.has(id)) continue;
      if (await updateChildState(id, () => ({ state: JSON.stringify(emptyDoc()), settings: {} }))) count++;
    }
    return count;
  },

  /** Muda ajustes da criança: liberar todos os mundos e/ou a meta do dia (1 a 10 fases). */
  async setChildSettings(id: string, patch: ChildSettings): Promise<void> {
    const guardianId = await requireGuardian();
    if (patch.dailyGoal !== undefined && !(patch.dailyGoal >= 1 && patch.dailyGoal <= 10)) throw new Error('Meta inválida.');
    if (patch.screenTimeMin !== undefined && !(patch.screenTimeMin >= 0 && patch.screenTimeMin <= 600)) throw new Error('Tempo inválido.');

    if (!isFirebaseConfigured()) {
      if (!readFamily().children.some((c) => c.id === id && c.guardianId === guardianId)) throw new Error('Criança não encontrada.');
      const doc: AccountDoc = (await localDocs.load(id)) ?? emptyDoc();
      const settings = { ...((doc.slices.settings as object) ?? {}), ...patch };
      await localDocs.save(id, { ...doc, slices: { ...doc.slices, settings }, updatedAt: new Date().toISOString() });
      return;
    }

    const clean: ChildSettings = {};
    if (patch.unlockAll !== undefined) clean.unlockAll = Boolean(patch.unlockAll);
    if (patch.dailyGoal !== undefined) clean.dailyGoal = Math.round(patch.dailyGoal);
    if (patch.screenTimeMin !== undefined) clean.screenTimeMin = Math.round(patch.screenTimeMin);
    const done = await updateChildState(id, (current) => ({
      settings: { ...((current.settings as ChildSettings | undefined) ?? {}), ...clean },
    }));
    if (!done) throw new Error('Criança não encontrada.');
  },

  setUnlockAll(id: string, unlocked: boolean): Promise<void> {
    return this.setChildSettings(id, { unlockAll: unlocked });
  },
};
