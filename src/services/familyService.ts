/**
 * Área dos Pais: crianças do responsável logado, cadastro, "liberar tudo" e "zerar".
 * Com Supabase, o servidor confere o vínculo responsável → criança (RLS, RPC e Edge Function);
 * sem Supabase (demonstração), os dados ficam neste navegador.
 */
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { emptyDoc, isAccountDoc, type AccountDoc } from '../lib/store/progressStore';
import { createLocalAdapter } from '../lib/store/adapters';
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

async function requireGuardian(): Promise<string> {
  const user = await authService.getCurrentUser();
  if (!user || user.role === 'student') throw new Error('Entre na conta do responsável.');
  return user.id;
}

/** Mensagem de erro da Edge Function (vem no corpo da resposta). */
async function functionError(error: unknown): Promise<Error> {
  const context = (error as { context?: Response })?.context;
  try {
    const body = context ? await context.json() : null;
    if (body?.error) return new Error(String(body.error));
  } catch {
    /* corpo sem JSON */
  }
  return new Error('Não deu certo. Tente de novo.');
}

export const familyService = {
  async listChildren(): Promise<ChildAccount[]> {
    const guardianId = await requireGuardian();

    if (!isSupabaseConfigured()) {
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

    const { data: children, error } = await supabase
      .from('children')
      .select('id, name, username, age_group')
      .eq('guardian_id', guardianId)
      .order('created_at');
    if (error) throw error;
    const ids = (children ?? []).map((c) => c.id);
    const { data: states, error: stateError } = ids.length
      ? await supabase.from('child_state').select('child_id, state').in('child_id', ids)
      : { data: [], error: null };
    if (stateError) throw stateError;
    const byId = new Map((states ?? []).map((s) => [s.child_id as string, s.state as unknown]));
    return (children ?? []).map((c) => {
      const state = byId.get(c.id);
      return {
        id: c.id,
        name: c.name,
        username: c.username,
        ageGroup: c.age_group as AgeGroup,
        summary: summarizeDoc(isAccountDoc(state) ? state : null),
      };
    });
  },

  async createChild(input: ChildInput): Promise<void> {
    const problem = validateChildInput(input);
    if (problem) throw new Error(problem);
    const guardianId = await requireGuardian();
    const username = normalizeUsername(input.username);

    if (!isSupabaseConfigured()) {
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

    const { error } = await supabase.functions.invoke('create-child', {
      body: { name: input.name.trim(), username, password: input.password, age_group: input.ageGroup },
    });
    if (error) throw await functionError(error);
  },

  /** Zera (irreversível) as crianças escolhidas. Devolve quantas foram zeradas. */
  async resetChildren(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const guardianId = await requireGuardian();

    if (!isSupabaseConfigured()) {
      const mine = new Set(readFamily().children.filter((c) => c.guardianId === guardianId).map((c) => c.id));
      const targets = ids.filter((id) => mine.has(id));
      await Promise.all(targets.map((id) => localDocs.save(id, emptyDoc())));
      return targets.length;
    }

    const { data, error } = await supabase.rpc('reset_children', { child_ids: ids });
    if (error) throw error;
    return Number(data) || 0;
  },

  /** Muda ajustes da criança: liberar todos os mundos e/ou a meta do dia (1 a 10 fases). */
  async setChildSettings(id: string, patch: ChildSettings): Promise<void> {
    const guardianId = await requireGuardian();
    if (patch.dailyGoal !== undefined && !(patch.dailyGoal >= 1 && patch.dailyGoal <= 10)) throw new Error('Meta inválida.');
    if (patch.screenTimeMin !== undefined && !(patch.screenTimeMin >= 0 && patch.screenTimeMin <= 600)) throw new Error('Tempo inválido.');

    if (!isSupabaseConfigured()) {
      if (!readFamily().children.some((c) => c.id === id && c.guardianId === guardianId)) throw new Error('Criança não encontrada.');
      const doc: AccountDoc = (await localDocs.load(id)) ?? emptyDoc();
      const settings = { ...((doc.slices.settings as object) ?? {}), ...patch };
      await localDocs.save(id, { ...doc, slices: { ...doc.slices, settings }, updatedAt: new Date().toISOString() });
      return;
    }

    const { data, error } = await supabase.rpc('set_child_settings', { child: id, patch });
    if (error) throw error;
    if (!data) throw new Error('Criança não encontrada.');
  },

  setUnlockAll(id: string, unlocked: boolean): Promise<void> {
    return this.setChildSettings(id, { unlockAll: unlocked });
  },
};
