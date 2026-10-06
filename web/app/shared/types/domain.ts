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
  created_at: string;
};

export type Generation = {
  id: string;
  plan_id: string;
  kind: string;
  prompt_tag: string | null;
  content: string;
  sources: string[];
  created_at: string;
};

export type ApiKeyStatus = {
  configured: boolean;
  last_verified_at: string | null;
  masked_hint: string | null;
};
