export type Plan = {
  id: string;
  user_id: string;
  title: string;
  course_code: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  upload_count: number;
  extracted_chunk_count: number;
  generation_count: number;
};

export type UploadStatus =
  | "pending"
  | "extracting"
  | "ready"
  | "failed";

export type UploadContentType =
  | "narrative"
  | "math-textbook"
  | "problem-set"
  | "slides"
  | "reference"
  | "other";

export type UploadCourseType =
  | "reading"
  | "math"
  | "science"
  | "humanities"
  | "cs"
  | "other";

export type Upload = {
  id: string;
  plan_id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  status: UploadStatus;
  pages: number | null;
  chars_extracted: number | null;
  error: string | null;
  content_type: UploadContentType | null;
  course_type: UploadCourseType | null;
  created_at: string;
};

export type ApiKeyStatus = {
  configured: boolean;
  last_verified_at: string | null;
  masked_hint: string | null;
};

export type NextActionKind =
  | "continue_journey"
  | "start_journey"
  | "upload_prompt"
  | "all_done";

export type NextAction = {
  kind: NextActionKind;
  label: string;
  sublabel: string | null;
  journey_id: string | null;
  module_ordinal: number | null;
  upload_id: string | null;
  upload_filename: string | null;
  modules_completed: number;
  modules_total: number;
};

export type CheckpointKind =
  | "concept-check"
  | "problem"
  | "multiple-choice"
  | "true-false-why"
  | "spot-the-error"
  | "complete-the-step"
  | "spaced-recall";

export type JourneyStatus = "generating" | "ready" | "failed";

export type JourneyModuleSummary = {
  id: string;
  ordinal: number;
  title: string;
  concept_labels: string[];
  has_extract: boolean;
  checkpoint_count: number;
};

export type JourneyProgress = {
  current_module_ordinal: number;
  completed_module_ordinals: number[];
  last_activity_at: string | null;
};

export type Journey = {
  id: string;
  plan_id: string;
  title: string;
  status: JourneyStatus;
  module_count: number;
  course_type: UploadCourseType | null;
  error: string | null;
  created_at: string;
  updated_at: string;
  modules: JourneyModuleSummary[];
  progress: JourneyProgress | null;
};

export type CheckpointChoice = { id: string; text: string };

export type AttemptResult = {
  id: string;
  checkpoint_id: string;
  score: number;
  feedback: string | null;
  attempted_at: string;
};

export type Checkpoint = {
  id: string;
  ordinal: number;
  kind: CheckpointKind;
  question: string;
  choices: CheckpointChoice[] | null;
  linked_concept_labels: string[];
  latest_attempt: AttemptResult | null;
};

export type ModuleDetail = {
  id: string;
  ordinal: number;
  title: string;
  concept_labels: string[];
  key_extract: string | null;
  source_labels: string[];
  checkpoints: Checkpoint[];
  is_spaced_recall_module: boolean;
};

export type CompleteModuleResponse = {
  progress: JourneyProgress;
  next_module_ordinal: number | null;
  journey_complete: boolean;
};
