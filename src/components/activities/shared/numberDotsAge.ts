/** Faixas que ainda estão aprendendo os números: mostram bolinhas nas respostas. */
export function showsNumberDots(): boolean {
  try {
    const age = localStorage.getItem('minecraft_edu_age_group') || 'maternal';
    return ['bercario', 'maternal', 'pre-escola-1'].includes(age);
  } catch {
    return false;
  }
}
