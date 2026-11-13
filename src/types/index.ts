// Tipos para o sistema educacional

export type UserRole = 'admin' | 'teacher' | 'parent' | 'student';

export type AgeGroup =
  | 'bercario'
  | 'maternal'
  | 'pre-escola-1'
  | 'pre-escola-2'
  | 'fundamental-1' // 1º e 2º ano (6–7 anos)
  | 'fundamental-2'; // 3º ao 5º ano (8–10 anos)

export type ActivityCategory = 
  | 'matematica'
  | 'linguagem'
  | 'cores'
  | 'formas'
  | 'coordenacao'
  | 'natureza'
  | 'desafios';

export type ActivityType = 
  | 'multiple-choice'
  | 'click-correct'
  | 'drag-drop'
  | 'matching'
  | 'ordering'
  | 'counting'
  | 'color-identification'
  | 'shape-identification'
  | 'letter-identification'
  | 'sequence'
  | 'memory'
  | 'puzzle'
  | 'crafting'
  | 'mining-math'
  | 'word-builder'
  | 'shadow-match'
  | 'build-pattern'
  | 'math-mobs';

export type Difficulty = 'facil' | 'medio' | 'dificil';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
  /** Só contas de criança: login (sem e-mail) e faixa etária */
  username?: string;
  age_group?: AgeGroup;
}

export interface Student {
  id: string;
  user_id: string;
  name: string;
  birth_date: string;
  age_group: AgeGroup;
  avatar: string;
  created_at: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  age_group: AgeGroup;
  category: ActivityCategory;
  difficulty: Difficulty;
  activity_type: ActivityType;
  question: string;
  image_url?: string;
  background_url?: string;
  points: number;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActivityQuestion {
  id: string;
  activity_id: string;
  question: string;
  question_type: ActivityType;
  options: ActivityOption[];
  correct_answer: string;
  image_url?: string;
  audio_url?: string;
  created_at: string;
}

export interface ActivityOption {
  id: string;
  text: string;
  image_url?: string;
  is_correct: boolean;
}

export interface StudentProgress {
  id: string;
  student_id: string;
  activity_id: string;
  completed: boolean;
  score: number;
  attempts: number;
  completed_at?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  required_xp: number;
  created_at: string;
}

export interface StudentAchievement {
  id: string;
  student_id: string;
  achievement_id: string;
  unlocked_at: string;
  achievement?: Achievement;
}

export interface StudentXP {
  id: string;
  student_id: string;
  total_xp: number;
  current_level: number;
  updated_at: string;
}

export interface Level {
  level: number;
  name: string;
  minXP: number;
  maxXP: number;
  icon: string;
}

export interface Biome {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  category: ActivityCategory;
  unlocked: boolean;
  progress: number;
}

export interface AgeGroupInfo {
  id: AgeGroup;
  name: string;
  description: string;
  icon: string;
  ageRange: string;
  color: string;
}

export interface GameState {
  currentStudent: Student | null;
  selectedAgeGroup: AgeGroup | null;
  currentActivity: Activity | null;
  xp: StudentXP | null;
  achievements: StudentAchievement[];
  progress: StudentProgress[];
}

// =============================================
// Adventure Map Types
// =============================================

export type LevelStatus = 'locked' | 'available' | 'in_progress' | 'completed';

export interface World {
  id: string;
  name: string;
  description: string;
  theme: string;
  icon: string;
  bgColor: string;
  worldOrder: number;
  levelRange: [number, number]; // e.g., [1, 10]
}

export interface AdventureLevel {
  id: string;
  worldId: string;
  levelNumber: number;
  name: string;
  description: string;
  activityIds: string[]; // references to existing activity IDs
  difficulty: Difficulty;
  xpReward: number;
}

export interface StudentLevelProgress {
  id: string;
  student_id: string;
  level_number: number;
  status: LevelStatus;
  stars: number; // 0-3
  score: number;
  attempts: number;
  completed_at?: string;
  updated_at: string;
}
