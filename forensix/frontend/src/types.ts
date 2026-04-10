// Shared TypeScript interfaces across ForensiX frontend

export interface Detection {
  label: string;
  is_weapon: boolean;
  confidence: number;
  box: [number, number, number, number];
  class_id: number;
}

export interface WeaponResult {
  status: string;
  model?: string;
  total_objects: number;
  weapons_found: number;
  detections: Detection[];
}

export interface BloodRegion {
  x: number; y: number; w: number; h: number; area: number;
}

export interface BloodResult {
  status: string;
  pattern: string;
  spots_count: number;
  average_size: number;
  total_area_px: number;
  coverage_pct: number;
  top_regions?: BloodRegion[];
}

export interface FootprintResult {
  status: string;
  match: boolean;
  similarity: number;
  best_match: string | null;
  keypoints_detected: number;
  database_size?: number;
  message?: string;
  all_scores?: Record<string, number>;
}

export interface FaceMatch {
  name: string;
  confidence: number;
  box: [number, number, number, number];
  matched: boolean;
}

export interface FaceResult {
  status: string;
  faces_detected: number;
  suspects_in_db: number;
  faces: FaceMatch[];
}

export interface AIResults {
  file_id?: string;
  image_dimensions?: { width: number; height: number };
  temp_file_url?: string;
  weapon_detection: WeaponResult;
  blood_analysis: BloodResult;
  footprint_match: FootprintResult;
  face_recognition: FaceResult;
  threat_level: number;
}

export interface Case {
  id: number;
  case_number: string;
  title: string;
  description?: string;
  location?: string;
  investigator?: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  evidence_image_url?: string;
  ai_results?: AIResults;
  weapon_detected: boolean;
  blood_detected: boolean;
  face_detected: boolean;
  threat_level: number;
}

export interface CaseStats {
  total: number;
  open: number;
  closed: number;
  weapon_cases: number;
  blood_cases: number;
  face_cases: number;
  high_threat: number;
}
