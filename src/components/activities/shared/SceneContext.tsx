import type { ReactNode } from 'react';
import type { WorldTheme } from '../../../data/worldThemes';
import { SceneContext } from './sceneTheme';

export function SceneProvider({ theme, children }: { theme: WorldTheme; children: ReactNode }) {
  return <SceneContext.Provider value={theme}>{children}</SceneContext.Provider>;
}
