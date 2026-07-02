export type SpecialPredictionQuestionStatus = "scheduled" | "open" | "closed" | "resolved";

export type SpecialPredictionOption = {
  id: string;
  question_id: string;
  value: string;
  label: string;
  sort_order: number;
  active: boolean;
};

export type SpecialPredictionQuestion = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  points: number;
  closes_at: string;
  status: SpecialPredictionQuestionStatus;
  result_value: string | null;
  created_at: string;
  options: SpecialPredictionOption[];
};

export type SpecialPredictionPick = {
  id: string;
  profile_id: string;
  question_id: string;
  option_id: string;
  points: number;
  locked_at: string | null;
  created_at: string;
  updated_at: string;
};
