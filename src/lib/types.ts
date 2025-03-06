
export interface User {
  id: string;
  email?: string;
  username?: string;
  avatar_url?: string;
  first_name?: string;
  last_name?: string;
  is_teacher?: boolean;
  xp?: number;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  creator_id: string;
  game_pin?: string;
  is_public: boolean;
  time_limit?: number;
  shuffle_questions: boolean;
  created_at: string;
  updated_at: string;
  creator?: User;
  question_count?: number;
}

export interface Question {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'fill_blank' | 'matching' | 'drag_drop';
  options: any;
  correct_answer: string;
  points: number;
  time_limit?: number;
  order_num: number;
}

export interface GameSession {
  id: string;
  quiz_id: string;
  host_id: string;
  status: 'waiting' | 'active' | 'completed';
  current_question_index: number;
  started_at?: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
  quiz?: Quiz;
  host?: User;
}

export interface PlayerSession {
  id: string;
  game_session_id: string;
  player_id?: string;
  player_name: string;
  score: number;
  answers: any[];
  created_at: string;
  updated_at: string;
  player?: User;
}
