/**
 * Perfis de criança lembrados neste aparelho: depois do 1º login, a criança entra tocando
 * no personagem dela (sem digitar a senha). Só contas de criança; o responsável nunca fica salvo.
 * Com Supabase, guarda a sessão da criança (tokens) para trocar com setSession.
 */
import { readJSON, writeJSON } from '../lib/storage';

const KEY = 'minelearn_saved_children';
const MAX = 8;

export interface SavedProfile {
  id: string;
  name: string;
  username: string;
  ageGroup?: string;
  /** Roupa do personagem (para o botão de escolher) */
  skin?: Record<string, string>;
  /** Supabase: sessão da criança (renovada a cada uso) */
  session?: { access_token: string; refresh_token: string };
  lastUsed: string;
}

export function listSavedProfiles(): SavedProfile[] {
  const list = readJSON<SavedProfile[]>(KEY, []);
  return Array.isArray(list) ? [...list].sort((a, b) => b.lastUsed.localeCompare(a.lastUsed)) : [];
}

export function saveProfile(profile: Omit<SavedProfile, 'lastUsed'>): void {
  const others = listSavedProfiles().filter((p) => p.id !== profile.id);
  const previous = listSavedProfiles().find((p) => p.id === profile.id);
  const next: SavedProfile = { ...previous, ...profile, lastUsed: new Date().toISOString() };
  writeJSON(KEY, [next, ...others].slice(0, MAX));
}

export function updateProfileSkin(id: string, skin: Record<string, string>): void {
  const list = listSavedProfiles();
  if (!list.some((p) => p.id === id)) return;
  writeJSON(KEY, list.map((p) => (p.id === id ? { ...p, skin } : p)));
}

export function forgetProfile(id: string): void {
  writeJSON(KEY, listSavedProfiles().filter((p) => p.id !== id));
}
