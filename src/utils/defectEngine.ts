import { DefectDetection, SeverityAssessment, SeverityWeights, ClassHazardWeights } from '../types/inspection';
import JSZip from 'jszip';
import { PYTHON_PROJECT_FILES } from '../data/pythonProjectFiles';

export const DEFAULT_WEIGHTS: SeverityWeights = {
  area_weight: 0.45,
  count_weight: 0.25,
  type_weight: 0.30,
};

export const DEFAULT_CLASS_HAZARD: ClassHazardWeights = {
  Crack: 95.0,
  Hole: 90.0,
  Dent: 70.0,
  Scratch: 45.0,
  Stain: 35.0,
  'Other Defect': 40.0,
};

export function computeSeverity(
  detections: DefectDetection[],
  weights: SeverityWeights = DEFAULT_WEIGHTS,
  hazardWeights: ClassHazardWeights = DEFAULT_CLASS_HAZARD
): SeverityAssessment {
  if (!detections || detections.length === 0) {
    return {
      severity_score: 0.0,
      severity_grade: 'Safe',
      area_percentage_total: 0.0,
      defect_count: 0,
      max_hazard_class: 'None',
      area_component_score: 0.0,
      count_component_score: 0.0,
      type_component_score: 0.0,
      is_heuristic: true,
    };
  }

  // Normalize weights
  const totalW = weights.area_weight + weights.count_weight + weights.type_weight;
  const wArea = totalW > 0 ? weights.area_weight / totalW : 0.45;
  const wCount = totalW > 0 ? weights.count_weight / totalW : 0.25;
  const wType = totalW > 0 ? weights.type_weight / totalW : 0.30;

  // 1. Area Component
  const totalAreaPct = detections.reduce((sum, d) => sum + d.area_percentage, 0);
  const areaScore = Math.min(100.0, totalAreaPct * 10.0);

  // 2. Count Component
  const count = detections.length;
  const countScore = Math.min(100.0, count * 20.0);

  // 3. Type Hazard Component
  let maxHazard = 0.0;
  let primaryClass = 'None';
  for (const d of detections) {
    const hazard = hazardWeights[d.class_name] ?? 45.0;
    if (hazard > maxHazard) {
      maxHazard = hazard;
      primaryClass = d.class_name;
    }
  }
  const typeScore = maxHazard;

  // Composite Heuristic
  const rawScore = (wArea * areaScore) + (wCount * countScore) + (wType * typeScore);
  const finalScore = Math.round(Math.max(0.0, Math.min(100.0, rawScore)) * 10) / 10;

  let grade: SeverityAssessment['severity_grade'] = 'Safe';
  if (finalScore < 20.0) {
    grade = 'Safe';
  } else if (finalScore < 50.0) {
    grade = 'Minor Defect';
  } else if (finalScore < 80.0) {
    grade = 'Moderate Defect';
  } else {
    grade = 'Critical Defect';
  }

  return {
    severity_score: finalScore,
    severity_grade: grade,
    area_percentage_total: Math.round(totalAreaPct * 100) / 100,
    defect_count: count,
    max_hazard_class: primaryClass,
    area_component_score: Math.round(areaScore * 10) / 10,
    count_component_score: Math.round(countScore * 10) / 10,
    type_component_score: Math.round(typeScore * 10) / 10,
    is_heuristic: true,
  };
}

export function exportJSONReport(
  sampleTitle: string,
  severity: SeverityAssessment,
  detections: DefectDetection[]
): void {
  const report = {
    inspection_header: {
      system: 'VisionGuard Industrial AI Defect Inspection System',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      sample_inspected: sampleTitle,
      operator_id: 'OPERATOR-QC-01',
      workstation: 'STATION-AOI-ALPHA',
    },
    inspection_verdict: {
      overall_status: severity.severity_grade,
      severity_score: severity.severity_score,
      score_scale: '0 to 100 (0-19: Safe, 20-49: Minor, 50-79: Moderate, 80-100: Critical)',
      defect_count: severity.defect_count,
      total_surface_coverage_pct: severity.area_percentage_total,
      primary_hazard: severity.max_hazard_class,
      confidence_disclaimer:
        'Model confidence represents detector classification belief, not physical severity. Severity is computed via area and structural risk heuristics.',
    },
    heuristic_breakdown: {
      area_score_component: severity.area_component_score,
      defect_count_component: severity.count_component_score,
      hazard_type_component: severity.type_component_score,
    },
    defects: detections.map((d, idx) => ({
      index: idx + 1,
      class_name: d.class_name,
      uncalibrated_model_confidence: d.confidence,
      bounding_box_normalized: d.bbox,
      area_percentage: d.area_percentage,
    })),
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `visionguard_inspection_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCSVReport(
  sampleTitle: string,
  severity: SeverityAssessment,
  detections: DefectDetection[]
): void {
  const timestamp = new Date().toISOString();
  let csv = 'Timestamp,Sample_Name,Severity_Grade,Severity_Score,Defect_Count,Area_Pct,Defect_ID,Defect_Type,Confidence,BBox_X1,BBox_Y1,BBox_X2,BBox_Y2\n';

  if (detections.length === 0) {
    csv += `"${timestamp}","${sampleTitle}","${severity.severity_grade}",${severity.severity_score},0,0.0,"N/A","None",0.0,0,0,0,0\n`;
  } else {
    detections.forEach((d, idx) => {
      csv += `"${timestamp}","${sampleTitle}","${severity.severity_grade}",${severity.severity_score},${severity.defect_count},${severity.area_percentage_total},${idx + 1},"${d.class_name}",${d.confidence},${d.bbox[0]},${d.bbox[1]},${d.bbox[2]},${d.bbox[3]}\n`;
    });
  }

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `visionguard_quality_log_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadPythonZip(): Promise<void> {
  const zip = new JSZip();
  const root = zip.folder('visionguard');

  for (const [filePath, content] of Object.entries(PYTHON_PROJECT_FILES)) {
    root?.file(filePath, content);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'visionguard_ai_defect_system.zip';
  a.click();
  URL.revokeObjectURL(url);
}
