export type DefectClass = 'Scratch' | 'Crack' | 'Dent' | 'Stain' | 'Hole' | 'Other Defect';

export type SeverityGrade = 'Safe' | 'Minor Defect' | 'Moderate Defect' | 'Critical Defect';

export interface DefectDetection {
  id: string;
  class_id: number;
  class_name: DefectClass;
  confidence: number; // Uncalibrated detector confidence [0-1]
  bbox: [number, number, number, number]; // [x1, y1, x2, y2] relative to image dimensions [0-100%]
  pixel_bbox?: [number, number, number, number];
  area_percentage: number;
  area_pixels: number;
}

export interface SeverityWeights {
  area_weight: number;
  count_weight: number;
  type_weight: number;
}

export interface ClassHazardWeights {
  Scratch: number;
  Crack: number;
  Dent: number;
  Stain: number;
  Hole: number;
  'Other Defect': number;
}

export interface SeverityAssessment {
  severity_score: number; // 0 to 100
  severity_grade: SeverityGrade;
  area_percentage_total: number;
  defect_count: number;
  max_hazard_class: string;
  area_component_score: number;
  count_component_score: number;
  type_component_score: number;
  is_heuristic: boolean;
}

export interface BenchmarkSample {
  id: string;
  title: string;
  category: string;
  material: string;
  imageUrl: string;
  description: string;
  dimensions: string;
  defaultDetections: DefectDetection[];
}

export interface InspectionRecord {
  id: string;
  timestamp: string;
  sampleName: string;
  severity: SeverityAssessment;
  detections: DefectDetection[];
  inferenceTimeMs: number;
  imageUrl: string;
}
