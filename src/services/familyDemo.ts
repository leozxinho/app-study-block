/**
 * Modo demonstração (sem Supabase): responsáveis e crianças guardados neste navegador.
 * Serve para testar o fluxo; NÃO é seguro (qualquer um com acesso ao aparelho vê os dados).
 * Com Supabase, tudo isso vem do servidor (ver supabase/).
 */
import { readJSON, writeJSON } from '../lib/storage';
import type { AgeGroup } from '../types';

const KEY = 'minelearn_demo_family';

export interface DemoGuardian {
  id: string;
  name: string;
  email: string;
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
