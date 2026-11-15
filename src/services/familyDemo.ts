/**
 * Modo local (sem Firebase): responsáveis e crianças guardados neste navegador (localStorage).
 * O progresso de cada criança fica em src/lib/store (adapter local), também no localStorage.
 * Serve para testar o fluxo; NÃO é seguro (qualquer um com acesso ao aparelho vê os dados).
 * Com Firebase, tudo isso vem do servidor (ver functions/ e firebase/firestore.rules).
 */
import { readJSON, writeJSON } from '../lib/storage';
import type { AgeGroup } from '../types';

const KEY = 'minelearn_demo_family';

export interface DemoGuardian {
  id: string;
  name: string;
  email: string;
  /** Hash da senha (contas antigas, sem senha, ganham a do 1º login). Sem ela: conta de Google simulado. */
  passwordHash?: string;
  created_at: string;
}

export interface DemoChild {
  id: string;
  guardianId: string;
  name: string;
  username: string;
  ageGroup: AgeGroup;
  passwordHash: string;
  created_at: string;
}

interface DemoFamily {
  guardians: DemoGuardian[];
  children: DemoChild[];
}

export function readFamily(): DemoFamily {
  const saved = readJSON<Partial<DemoFamily>>(KEY, {});
  return {
    guardians: Array.isArray(saved.guardians) ? saved.guardians : [],
    children: Array.isArray(saved.children) ? saved.children : [],
  };
}

export function writeFamily(family: DemoFamily): void {
  writeJSON(KEY, family);
}

/** Hash da senha da demonstração (evita guardar a senha em texto puro). */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Acha o responsável pelo e-mail. */
export function findGuardian(email: string): DemoGuardian | null {
  const normalized = email.trim().toLowerCase();
  return readFamily().guardians.find((g) => g.email === normalized) ?? null;
}

/** Cria o responsável com senha. Erro se o e-mail já tem conta. */
export async function createGuardian(email: string, name: string, password: string): Promise<DemoGuardian> {
  if (findGuardian(email)) throw new Error('User already registered');
  const guardian = findOrCreateGuardian(email, name);
  return setGuardianPassword(guardian, password);
}

/** Confere a senha do responsável; conta antiga sem senha passa a usar esta. */
export async function checkGuardianPassword(guardian: DemoGuardian, password: string): Promise<boolean> {
  if (!guardian.passwordHash) {
    await setGuardianPassword(guardian, password);
    return true;
  }
  return guardian.passwordHash === (await hashPassword(password, guardian.id));
}

async function setGuardianPassword(guardian: DemoGuardian, password: string): Promise<DemoGuardian> {
  const updated = { ...guardian, passwordHash: await hashPassword(password, guardian.id) };
  const family = readFamily();
  writeFamily({ ...family, guardians: family.guardians.map((g) => (g.id === guardian.id ? updated : g)) });
  return updated;
}

/** Acha ou cria o responsável da demonstração pelo e-mail. */
export function findOrCreateGuardian(email: string, name: string): DemoGuardian {
  const family = readFamily();
  const normalized = email.trim().toLowerCase();
  const found = family.guardians.find((g) => g.email === normalized);
  if (found) return found;
  const guardian: DemoGuardian = {
    id: crypto.randomUUID(),
    name: name.trim() || normalized.split('@')[0] || 'Responsável',
    email: normalized,
    created_at: new Date().toISOString(),
  };
  writeFamily({ ...family, guardians: [...family.guardians, guardian] });
  return guardian;
}
