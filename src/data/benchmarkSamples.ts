import { BenchmarkSample } from '../types/inspection';

import metalScratchImg from '../assets/images/defect_metal_scratch_1791779533389.jpg';
import ceramicCrackImg from '../assets/images/defect_ceramic_crack_1791779545005.jpg';
import steelDentImg from '../assets/images/defect_steel_dent_1791779554324.jpg';
import fabricStainImg from '../assets/images/defect_fabric_stain_1791779564420.jpg';
import cleanSurfaceImg from '../assets/images/defect_free_surface_1791779576123.jpg';

export const BENCHMARK_SAMPLES: BenchmarkSample[] = [
  {
    id: 'sample-metal-scratch',
    title: 'Machined Aluminium Flange — Surface Scratch',
    category: 'Surface Abrasion',
    material: 'Aluminium 6061-T6 (Milled Specimen)',
    imageUrl: metalScratchImg,
    description: 'Distinct linear scratch gouge across circular milling grain on Part AL-3104. Moderate surface damage without structural perforation.',
    dimensions: '1024 × 768 px',
    defaultDetections: [
      {
        id: 'det-1',
        class_id: 0,
        class_name: 'Scratch',
        confidence: 0.94,
        bbox: [14.5, 28.2, 75.8, 79.5], // percentage coordinates [x1, y1, x2, y2]
        area_percentage: 4.8,
        area_pixels: 37748
      }
    ]
  },
  {
    id: 'sample-ceramic-crack',
    title: 'Technical Ceramic Tile — Structural Fracture',
    category: 'Structural Fracture',
    material: 'Sintered Alumina Ceramic (MVTec AD Benchmark)',
    imageUrl: ceramicCrackImg,
    description: 'Severe diagonal cleavage fracture propagating completely through structural ceramic substrate. High catastrophic failure hazard.',
    dimensions: '1024 × 768 px',
    defaultDetections: [
      {
        id: 'det-2',
        class_id: 1,
        class_name: 'Crack',
        confidence: 0.97,
        bbox: [18.2, 17.5, 87.4, 76.5],
        area_percentage: 14.2,
        area_pixels: 111673
      }
    ]
  },
  {
    id: 'sample-steel-dent',
    title: 'Cold-Rolled Steel Sheet — Impact Dent Defect',
    category: 'Plastic Deformation',
    material: 'Cold-Rolled Sheet Steel (NEU Database Class)',
    imageUrl: steelDentImg,
    description: 'Deep localized impact indentation depression with micro-crazing at depression center. Verified by caliper scale in inspection zone.',
    dimensions: '1024 × 768 px',
    defaultDetections: [
      {
        id: 'det-3',
        class_id: 2,
        class_name: 'Dent',
        confidence: 0.91,
        bbox: [24.0, 31.0, 71.0, 68.5],
        area_percentage: 8.6,
        area_pixels: 67633
      }
    ]
  },
  {
    id: 'sample-fabric-stain',
    title: 'Synthetic Composite Fabric — Lubricant Oil Stain',
    category: 'Fluid Contamination',
    material: 'Industrial Carbon/Polymer Weave (Kolektor Inspection)',
    imageUrl: fabricStainImg,
    description: 'Dark circular droplet oil penetration into composite fabric weave. Cosmetic and resin bonding contamination flaw.',
    dimensions: '1024 × 768 px',
    defaultDetections: [
      {
        id: 'det-4',
        class_id: 3,
        class_name: 'Stain',
        confidence: 0.89,
        bbox: [14.0, 16.0, 66.5, 84.0],
        area_percentage: 12.5,
        area_pixels: 98304
      }
    ]
  },
  {
    id: 'sample-clean-surface',
    title: '316L Stainless Steel Component — Pristine Reference',
    category: 'Flawless Specimen',
    material: 'Precision Machined 316L Stainless Steel',
    imageUrl: cleanSurfaceImg,
    description: 'Flawless precision milled steel fixture with uniform specular finish. Certified zero visible defect specimen (Pass QC).',
    dimensions: '1024 × 768 px',
    defaultDetections: [] // Defect-free: 0 detections
  }
];
