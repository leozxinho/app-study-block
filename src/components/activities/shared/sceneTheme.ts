import { createContext, useContext } from 'react';
import { WORLD_THEMES, type WorldTheme } from '../../../data/worldThemes';

/** Mundo cujo cenário aparece nas perguntas (a aventura passa o mundo da fase). */
export const SceneContext = createContext<WorldTheme>(WORLD_THEMES[0]);

export function useSceneTheme(): WorldTheme {
  return useContext(SceneContext);
}
