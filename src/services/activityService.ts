import { doc, getDoc } from 'firebase/firestore';
import { activeDb, isFirebaseConfigured } from '../lib/firebase';
import type { Activity } from '../types';
import { ADVENTURE_ACTIVITIES } from '../data/adventureActivities';

const ALL_ADVENTURE_ACTIVITIES: Activity[] = Object.values(ADVENTURE_ACTIVITIES).flat();

export const activityService = {
  /** Atividade da aventura pelo id (do app; se não houver, da coleção activities do Firestore). */
  async getActivityById(id: string): Promise<Activity | null> {
    const local = ALL_ADVENTURE_ACTIVITIES.find((a) => a.id === id);
    if (local || !isFirebaseConfigured()) return local || null;

    const snap = await getDoc(doc(activeDb(), 'activities', id));
    return snap.exists() ? ({ ...snap.data(), id: snap.id } as Activity) : null;
  },
};
