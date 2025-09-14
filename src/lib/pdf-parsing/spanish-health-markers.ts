/**
 * Spanish Health Marker Extraction for Chilean Lab Reports
 * Specialized for extracting and mapping Spanish medical terminology to standardized codes
 * Critical for Chilean public primary care facilities
 */

export interface HealthMarkerMapping {
  spanishName: string
  systemCode: string
  category: 'glucose' | 'lipids' | 'liver' | 'thyroid' | 'kidney' | 'blood' | 'other'
  priority: 'critical' | 'high' | 'medium' | 'low'
  unit?: string
  description: string
  normalRange?: {
    min?: number
    max?: number
    text?: string       // Original text like "74-106", "< 200", "Hasta 34"
    source?: string     // "Chilean Healthcare Standards"
  }
}

/**
 * Comprehensive Chilean health marker mappings
 * Based on real Chilean lab reports and medical terminology
 */
export const CHILEAN_HEALTH_MARKERS: HealthMarkerMapping[] = [
  // GLUCOSE MARKERS (Critical for diabetes detection)
  {
    spanishName: 'GLICEMIA EN AYUNO (BASAL)',
    systemCode: 'glucose_fasting',
    category: 'glucose',
    priority: 'critical',
    unit: 'mg/dL',
    description: 'Fasting glucose - critical for diabetes diagnosis',
    normalRange: {
      min: 74,
      max: 106,
      text: '74 - 106',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'GLICEMIA EN AYUNAS',
    systemCode: 'glucose_fasting',
    category: 'glucose',
    priority: 'critical',
    unit: 'mg/dL',
    description: 'Fasting glucose - alternative spelling',
    normalRange: {
      min: 74,
      max: 106,
      text: '74 - 106',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'GLUCOSA EN AYUNO',
    systemCode: 'glucose_fasting',
    category: 'glucose',
    priority: 'critical',
    unit: 'mg/dL',
    description: 'Fasting glucose - alternative term',
    normalRange: {
      min: 74,
      max: 106,
      text: '74 - 106',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'HEMOGLOBINA GLICADA A1C',
    systemCode: 'hba1c',
    category: 'glucose',
    priority: 'critical',
    unit: '%',
    description: 'HbA1c - long-term glucose control indicator',
    normalRange: {
      min: 4,
      max: 6,
      text: '4 - 6',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'HEMOGLOBINA GLICOSILADA',
    systemCode: 'hba1c',
    category: 'glucose',
    priority: 'critical',
    unit: '%',
    description: 'HbA1c - alternative term',
    normalRange: {
      min: 4,
      max: 6,
      text: '4 - 6',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'HBA1C',
    systemCode: 'hba1c',
    category: 'glucose',
    priority: 'critical',
    unit: '%',
    description: 'HbA1c - abbreviated form',
    normalRange: {
      min: 4,
      max: 6,
      text: '4 - 6',
      source: 'Chilean Healthcare Standards'
    }
  },

  // LIPID PROFILE (High priority for cardiovascular risk)
  {
    spanishName: 'COLESTEROL TOTAL',
    systemCode: 'cholesterol_total',
    category: 'lipids',
    priority: 'high',
    unit: 'mg/dL',
    description: 'Total cholesterol',
    normalRange: {
      max: 200,
      text: 'Bajo (deseable): < 200',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'COLESTEROL HDL',
    systemCode: 'cholesterol_hdl',
    category: 'lipids',
    priority: 'high',
    unit: 'mg/dL',
    description: 'HDL cholesterol - good cholesterol',
    normalRange: {
      min: 40,
      text: 'Bajo (alto riesgo): < 40, Alto (bajo riesgo): > 60',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'COLESTEROL LDL',
    systemCode: 'cholesterol_ldl',
    category: 'lipids',
    priority: 'high',
    unit: 'mg/dL',
    description: 'LDL cholesterol - bad cholesterol',
    normalRange: {
      min: 1,
      max: 150,
      text: '1 - 150',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'TRIGLICÉRIDOS',
    systemCode: 'triglycerides',
    category: 'lipids',
    priority: 'high',
    unit: 'mg/dL',
    description: 'Triglycerides',
    normalRange: {
      max: 150,
      text: 'Normal: < 150',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'TRIGLICERIDOS',
    systemCode: 'triglycerides',
    category: 'lipids',
    priority: 'high',
    unit: 'mg/dL',
    description: 'Triglycerides - without accent',
    normalRange: {
      max: 150,
      text: 'Normal: < 150',
      source: 'Chilean Healthcare Standards'
    }
  },

  // LIVER FUNCTION (High priority for liver disease detection)
  {
    spanishName: 'GOT (A.S.T)',
    systemCode: 'ast',
    category: 'liver',
    priority: 'high',
    unit: 'U/L',
    description: 'AST - liver enzyme',
    normalRange: {
      max: 34,
      text: 'Hasta 34',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'GPT (A.L.T)',
    systemCode: 'alt',
    category: 'liver',
    priority: 'high',
    unit: 'U/L',
    description: 'ALT - liver enzyme',
    normalRange: {
      min: 10,
      max: 49,
      text: '10 - 49',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'TRANSAMINASA GOT',
    systemCode: 'ast',
    category: 'liver',
    priority: 'high',
    unit: 'U/L',
    description: 'AST - alternative term',
    normalRange: {
      max: 34,
      text: 'Hasta 34',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'TRANSAMINASA GPT',
    systemCode: 'alt',
    category: 'liver',
    priority: 'high',
    unit: 'U/L',
    description: 'ALT - alternative term',
    normalRange: {
      min: 10,
      max: 49,
      text: '10 - 49',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'FOSF. ALCALINAS',
    systemCode: 'alkaline_phosphatase',
    category: 'liver',
    priority: 'medium',
    unit: 'U/L',
    description: 'Alkaline phosphatase',
    normalRange: {
      min: 40,
      max: 129,
      text: '40 - 129',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'FOSFATASA ALCALINA',
    systemCode: 'alkaline_phosphatase',
    category: 'liver',
    priority: 'medium',
    unit: 'U/L',
    description: 'Alkaline phosphatase - full term',
    normalRange: {
      min: 40,
      max: 129,
      text: '40 - 129',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'BILIRRUBINA TOTAL',
    systemCode: 'bilirubin_total',
    category: 'liver',
    priority: 'medium',
    unit: 'mg/dL',
    description: 'Total bilirubin'
  },

  // THYROID FUNCTION (Critical for thyroid disorders)
  {
    spanishName: 'H. TIROESTIMULANTE (TSH)',
    systemCode: 'tsh',
    category: 'thyroid',
    priority: 'critical',
    unit: 'mUI/L',
    description: 'TSH - thyroid stimulating hormone',
    normalRange: {
      min: 0.55,
      max: 4.78,
      text: '0.55 - 4.78',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'TSH',
    systemCode: 'tsh',
    category: 'thyroid',
    priority: 'critical',
    unit: 'mUI/L',
    description: 'TSH - abbreviated form',
    normalRange: {
      min: 0.55,
      max: 4.78,
      text: '0.55 - 4.78',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'TIROTROPINA',
    systemCode: 'tsh',
    category: 'thyroid',
    priority: 'critical',
    unit: 'mUI/L',
    description: 'TSH - alternative term',
    normalRange: {
      min: 0.55,
      max: 4.78,
      text: '0.55 - 4.78',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'T4 LIBRE',
    systemCode: 't4_free',
    category: 'thyroid',
    priority: 'high',
    unit: 'ng/dL',
    description: 'Free T4 - thyroid hormone',
    normalRange: {
      min: 0.89,
      max: 1.76,
      text: '0.89 - 1.76',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'T3 LIBRE',
    systemCode: 't3_free',
    category: 'thyroid',
    priority: 'high',
    unit: 'pg/mL',
    description: 'Free T3 - thyroid hormone'
  },

  // KIDNEY FUNCTION (High priority for kidney disease)
  {
    spanishName: 'CREATININA',
    systemCode: 'creatinine',
    category: 'kidney',
    priority: 'high',
    unit: 'mg/dL',
    description: 'Creatinine - kidney function marker',
    normalRange: {
      min: 0.55,
      max: 1.02,
      text: '0.55 - 1.02',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'UREA',
    systemCode: 'urea',
    category: 'kidney',
    priority: 'medium',
    unit: 'mg/dL',
    description: 'Urea - kidney function marker'
  },
  {
    spanishName: 'ÁCIDO ÚRICO',
    systemCode: 'uric_acid',
    category: 'kidney',
    priority: 'medium',
    unit: 'mg/dL',
    description: 'Uric acid',
    normalRange: {
      min: 3.1,
      max: 7.8,
      text: '3.1 - 7.8',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'ACIDO URICO',
    systemCode: 'uric_acid',
    category: 'kidney',
    priority: 'medium',
    unit: 'mg/dL',
    description: 'Uric acid - without accent',
    normalRange: {
      min: 3.1,
      max: 7.8,
      text: '3.1 - 7.8',
      source: 'Chilean Healthcare Standards'
    }
  },

  // BLOOD COUNT (Medium priority for general health)
  {
    spanishName: 'HEMOGLOBINA',
    systemCode: 'hemoglobin',
    category: 'blood',
    priority: 'medium',
    unit: 'g/dL',
    description: 'Hemoglobin',
    normalRange: {
      min: 12.0,
      max: 16.0,
      text: '12.0 - 16.0',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'HEMATOCRITO',
    systemCode: 'hematocrit',
    category: 'blood',
    priority: 'medium',
    unit: '%',
    description: 'Hematocrit',
    normalRange: {
      min: 36.0,
      max: 47.0,
      text: '36.0 - 47.0',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'GLÓBULOS ROJOS',
    systemCode: 'rbc',
    category: 'blood',
    priority: 'medium',
    unit: 'mill/mm³',
    description: 'Red blood cells'
  },
  {
    spanishName: 'GLOBULOS ROJOS',
    systemCode: 'rbc',
    category: 'blood',
    priority: 'medium',
    unit: 'mill/mm³',
    description: 'Red blood cells - without accent'
  },
  {
    spanishName: 'GLÓBULOS BLANCOS',
    systemCode: 'wbc',
    category: 'blood',
    priority: 'medium',
    unit: '/mm³',
    description: 'White blood cells'
  },
  {
    spanishName: 'GLOBULOS BLANCOS',
    systemCode: 'wbc',
    category: 'blood',
    priority: 'medium',
    unit: '/mm³',
    description: 'White blood cells - without accent'
  },
  {
    spanishName: 'PLAQUETAS',
    systemCode: 'platelets',
    category: 'blood',
    priority: 'medium',
    unit: '/mm³',
    description: 'Platelets'
  },

  // OTHER IMPORTANT MARKERS
  {
    spanishName: 'PROTEÍNA C REACTIVA',
    systemCode: 'crp',
    category: 'other',
    priority: 'medium',
    unit: 'mg/L',
    description: 'C-reactive protein - inflammation marker'
  },
  {
    spanishName: 'PROTEINA C REACTIVA',
    systemCode: 'crp',
    category: 'other',
    priority: 'medium',
    unit: 'mg/L',
    description: 'C-reactive protein - without accent'
  },
  {
    spanishName: 'PCR',
    systemCode: 'crp',
    category: 'other',
    priority: 'medium',
    unit: 'mg/L',
    description: 'C-reactive protein - abbreviated'
  },
  {
    spanishName: 'VITAMINA D',
    systemCode: 'vitamin_d',
    category: 'other',
    priority: 'low',
    unit: 'ng/mL',
    description: 'Vitamin D'
  },
  {
    spanishName: 'VITAMINA B12',
    systemCode: 'vitamin_b12',
    category: 'other',
    priority: 'low',
    unit: 'pg/mL',
    description: 'Vitamin B12'
  },
  {
    spanishName: 'FERRITINA',
    systemCode: 'ferritin',
    category: 'other',
    priority: 'medium',
    unit: 'ng/mL',
    description: 'Ferritin - iron storage marker'
  },

  // BILIRUBIN MARKERS (Liver function assessment)
  {
    spanishName: 'BILIRRUBINA DIRECTA',
    systemCode: 'bilirubin_direct',
    category: 'liver',
    priority: 'medium',
    unit: 'mg/dL',
    description: 'Direct bilirubin',
    normalRange: {
      max: 0.30,
      text: 'Menor a 0.30',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'BILIRRUBINA TOTAL',
    systemCode: 'bilirubin_total',
    category: 'liver',
    priority: 'medium',
    unit: 'mg/dL',
    description: 'Total bilirubin',
    normalRange: {
      min: 0.3,
      max: 1.2,
      text: '0.3 - 1.2',
      source: 'Chilean Healthcare Standards'
    }
  },

  // ADDITIONAL LIVER ENZYMES
  {
    spanishName: 'G.G.T.',
    systemCode: 'ggt',
    category: 'liver',
    priority: 'medium',
    unit: 'U/L',
    description: 'Gamma-glutamyl transferase',
    normalRange: {
      max: 38,
      text: 'Menor a 38',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'GGT',
    systemCode: 'ggt',
    category: 'liver',
    priority: 'medium',
    unit: 'U/L',
    description: 'Gamma-glutamyl transferase - abbreviated',
    normalRange: {
      max: 38,
      text: 'Menor a 38',
      source: 'Chilean Healthcare Standards'
    }
  },

  // KIDNEY FUNCTION EXTENDED
  {
    spanishName: 'NITROGENO UREICO (BUN)',
    systemCode: 'bun',
    category: 'kidney',
    priority: 'medium',
    unit: 'mg/dL',
    description: 'Blood urea nitrogen',
    normalRange: {
      min: 9,
      max: 23,
      text: '9 - 23',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'UREMIA (CALCULO)',
    systemCode: 'urea_calculated',
    category: 'kidney',
    priority: 'medium',
    unit: 'mg/dL',
    description: 'Calculated urea',
    normalRange: {
      min: 15.4,
      max: 37.4,
      text: '15.4 - 37.4',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'VFG',
    systemCode: 'gfr',
    category: 'kidney',
    priority: 'high',
    unit: 'mL/min/1.73 mt²',
    description: 'Glomerular filtration rate',
    normalRange: {
      min: 60,
      text: 'Mayor a 60',
      source: 'Chilean Healthcare Standards'
    }
  },

  // ELECTROLYTES
  {
    spanishName: 'SODIO (Na) EN SANGRE',
    systemCode: 'sodium',
    category: 'other',
    priority: 'medium',
    unit: 'mEq/L',
    description: 'Sodium in blood',
    normalRange: {
      min: 136,
      max: 145,
      text: '136 - 145',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'POTASIO (K) EN SANGRE',
    systemCode: 'potassium',
    category: 'other',
    priority: 'medium',
    unit: 'mEq/L',
    description: 'Potassium in blood',
    normalRange: {
      min: 3.5,
      max: 5.1,
      text: '3.5 - 5.1',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'CLORO (Cl) EN SANGRE',
    systemCode: 'chloride',
    category: 'other',
    priority: 'medium',
    unit: 'mEq/L',
    description: 'Chloride in blood',
    normalRange: {
      min: 98,
      max: 107,
      text: '98 - 107',
      source: 'Chilean Healthcare Standards'
    }
  },

  // PROTEIN MARKERS
  {
    spanishName: 'ALBÚMINA',
    systemCode: 'albumin',
    category: 'other',
    priority: 'medium',
    unit: 'g/dL',
    description: 'Albumin protein',
    normalRange: {
      min: 3.2,
      max: 4.8,
      text: '3.2 - 4.8',
      source: 'Chilean Healthcare Standards'
    }
  },

  // VITAMINS
  {
    spanishName: 'VITAMINA B12',
    systemCode: 'vitamin_b12',
    category: 'other',
    priority: 'medium',
    unit: 'pg/mL',
    description: 'Vitamin B12',
    normalRange: {
      min: 211,
      max: 911,
      text: '211 - 911',
      source: 'Chilean Healthcare Standards'
    }
  },

  // ADDITIONAL THYROID
  {
    spanishName: 'H. TIROXINA LIBRE (T4 LIBRE)',
    systemCode: 't4_free',
    category: 'thyroid',
    priority: 'high',
    unit: 'ng/dL',
    description: 'Free T4 - full name variant',
    normalRange: {
      min: 0.89,
      max: 1.76,
      text: '0.89 - 1.76',
      source: 'Chilean Healthcare Standards'
    }
  },

  // LIPID PROFILE EXTENDED
  {
    spanishName: 'COLESTEROL VLDL (CALCULO)',
    systemCode: 'cholesterol_vldl',
    category: 'lipids',
    priority: 'medium',
    unit: 'mg/dL',
    description: 'VLDL cholesterol calculated',
    normalRange: {
      max: 36,
      text: 'Hasta 36',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'COLESTEROL LDL (CALCULO)',
    systemCode: 'cholesterol_ldl',
    category: 'lipids',
    priority: 'high',
    unit: 'mg/dL',
    description: 'LDL cholesterol calculated',
    normalRange: {
      min: 1,
      max: 150,
      text: '1 - 150',
      source: 'Chilean Healthcare Standards'
    }
  },

  // MICROALBUMINURIA
  {
    spanishName: 'MICROALBUMINURIA AISLADA',
    systemCode: 'microalbuminuria',
    category: 'kidney',
    priority: 'medium',
    unit: 'mg/L',
    description: 'Isolated microalbuminuria'
  },
  {
    spanishName: 'MAU-RAC (calculo)',
    systemCode: 'albumin_creatinine_ratio',
    category: 'kidney',
    priority: 'high',
    unit: 'mg/gr',
    description: 'Albumin-creatinine ratio',
    normalRange: {
      max: 30,
      text: 'Menor a 30',
      source: 'Chilean Healthcare Standards'
    }
  },

  // BLOOD COUNT DETAILED
  {
    spanishName: 'RECUENTO GLOBULOS ROJOS',
    systemCode: 'red_blood_cells',
    category: 'blood',
    priority: 'medium',
    unit: 'x10^6/uL',
    description: 'Red blood cell count',
    normalRange: {
      min: 4.1,
      max: 5.1,
      text: '4.1 - 5.1',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'RECUENTO GLOBULOS BLANCOS',
    systemCode: 'white_blood_cells',
    category: 'blood',
    priority: 'medium',
    unit: 'x10^3/uL',
    description: 'White blood cell count',
    normalRange: {
      min: 4.5,
      max: 11,
      text: '4.5 - 11',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'RECUENTO PLAQUETAS',
    systemCode: 'platelets',
    category: 'blood',
    priority: 'medium',
    unit: 'x10^3/uL',
    description: 'Platelet count',
    normalRange: {
      min: 150,
      max: 400,
      text: '150 - 400',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'V.C.M',
    systemCode: 'mcv',
    category: 'blood',
    priority: 'medium',
    unit: 'fL',
    description: 'Mean corpuscular volume',
    normalRange: {
      min: 80,
      max: 99,
      text: '80 - 99',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'H.C.M',
    systemCode: 'mch',
    category: 'blood',
    priority: 'medium',
    unit: 'pg',
    description: 'Mean corpuscular hemoglobin',
    normalRange: {
      min: 26.6,
      max: 32,
      text: '26.6 - 32',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'C.H.C.M',
    systemCode: 'mchc',
    category: 'blood',
    priority: 'medium',
    unit: 'gr/dL',
    description: 'Mean corpuscular hemoglobin concentration',
    normalRange: {
      min: 32,
      max: 35,
      text: '32 - 35',
      source: 'Chilean Healthcare Standards'
    }
  },

  // BLOOD DIFFERENTIAL PERCENTAGES (From HEMOGRAMA-VHS section)
  {
    spanishName: 'EOSINOFILOS',
    systemCode: 'eosinophils',
    category: 'blood',
    priority: 'medium',
    unit: '%',
    description: 'Eosinophils percentage',
    normalRange: {
      min: 2,
      max: 4,
      text: '2 - 4',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'BASOFILOS',
    systemCode: 'basophils',
    category: 'blood',
    priority: 'medium',
    unit: '%',
    description: 'Basophils percentage',
    normalRange: {
      min: 0,
      max: 1,
      text: '0 - 1',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'LINFOCITOS',
    systemCode: 'lymphocytes',
    category: 'blood',
    priority: 'medium',
    unit: '%',
    description: 'Lymphocytes percentage',
    normalRange: {
      min: 25,
      max: 40,
      text: '25 - 40',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'MONOCITOS',
    systemCode: 'monocytes',
    category: 'blood',
    priority: 'medium',
    unit: '%',
    description: 'Monocytes percentage',
    normalRange: {
      min: 2,
      max: 8,
      text: '2 - 8',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'NEUTROFILOS',
    systemCode: 'neutrophils',
    category: 'blood',
    priority: 'medium',
    unit: '%',
    description: 'Neutrophils percentage',
    normalRange: {
      min: 50,
      max: 70,
      text: '50 - 70',
      source: 'Chilean Healthcare Standards'
    }
  },

  // IMMATURE CELL COUNTS
  {
    spanishName: 'BACILIFORMES',
    systemCode: 'bands',
    category: 'blood',
    priority: 'low',
    unit: '%',
    description: 'Band cells percentage',
    normalRange: {
      min: 0,
      max: 0,
      text: '0 - 0',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'JUVENILES',
    systemCode: 'juvenile_cells',
    category: 'blood',
    priority: 'low',
    unit: '%',
    description: 'Juvenile cells percentage',
    normalRange: {
      min: 0,
      max: 0,
      text: '0 - 0',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'MIELOCITOS',
    systemCode: 'myelocytes',
    category: 'blood',
    priority: 'low',
    unit: '%',
    description: 'Myelocytes percentage',
    normalRange: {
      min: 0,
      max: 0,
      text: '0 - 0',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'PROMIELOCITOS',
    systemCode: 'promyelocytes',
    category: 'blood',
    priority: 'low',
    unit: '%',
    description: 'Promyelocytes percentage',
    normalRange: {
      min: 0,
      max: 0,
      text: '0 - 0',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'BLASTOS',
    systemCode: 'blasts',
    category: 'blood',
    priority: 'low',
    unit: '%',
    description: 'Blast cells percentage',
    normalRange: {
      min: 0,
      max: 0,
      text: '0 - 0',
      source: 'Chilean Healthcare Standards'
    }
  },

  // ERYTHROCYTE SEDIMENTATION RATE
  {
    spanishName: 'V.H.S.',
    systemCode: 'esr',
    category: 'blood',
    priority: 'medium',
    unit: 'mm/hr',
    description: 'Erythrocyte sedimentation rate',
    normalRange: {
      min: 0,
      max: 15,
      text: '0 - 15',
      source: 'Chilean Healthcare Standards'
    }
  },

  // URINE ANALYSIS - PHYSICAL PROPERTIES
  {
    spanishName: 'PH',
    systemCode: 'urine_ph',
    category: 'other',
    priority: 'medium',
    unit: 'pH',
    description: 'Urine pH level',
    normalRange: {
      min: 5,
      max: 8,
      text: '5 - 8',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'DENSIDAD',
    systemCode: 'urine_density',
    category: 'other',
    priority: 'medium',
    unit: 'specific gravity',
    description: 'Urine specific gravity',
    normalRange: {
      min: 1.01,
      max: 1.03,
      text: '1.01 - 1.03',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'ASPECTO',
    systemCode: 'urine_aspect',
    category: 'other',
    priority: 'low',
    unit: 'qualitative',
    description: 'Urine appearance',
    normalRange: {
      text: 'Claro',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'COLOR',
    systemCode: 'urine_color',
    category: 'other',
    priority: 'low',
    unit: 'qualitative',
    description: 'Urine color',
    normalRange: {
      text: 'Amarillo',
      source: 'Chilean Healthcare Standards'
    }
  },

  // URINE ANALYSIS - CHEMICAL COMPONENTS
  {
    spanishName: 'LEUCOCITOS',
    systemCode: 'urine_leukocytes',
    category: 'other',
    priority: 'medium',
    unit: '/μL',
    description: 'Leukocytes in urine',
    normalRange: {
      text: 'Negativo',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'SANGRE EN ORINA',
    systemCode: 'urine_blood',
    category: 'other',
    priority: 'medium',
    unit: 'Eri/uL',
    description: 'Blood in urine',
    normalRange: {
      text: 'Negativo',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'PROTEINAS',
    systemCode: 'urine_protein',
    category: 'other',
    priority: 'medium',
    unit: 'mg/dL',
    description: 'Protein in urine',
    normalRange: {
      text: 'Negativo',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'GLUCOSA',
    systemCode: 'urine_glucose',
    category: 'other',
    priority: 'medium',
    unit: 'mg/dL',
    description: 'Glucose in urine',
    normalRange: {
      text: 'Negativo',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'CETONAS',
    systemCode: 'urine_ketones',
    category: 'other',
    priority: 'medium',
    unit: 'mg/dL',
    description: 'Ketones in urine',
    normalRange: {
      text: 'Negativo',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'NITRITOS',
    systemCode: 'urine_nitrites',
    category: 'other',
    priority: 'medium',
    unit: 'qualitative',
    description: 'Nitrites in urine',
    normalRange: {
      text: 'Negativo',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'BILIRRUBINA',
    systemCode: 'urine_bilirubin',
    category: 'other',
    priority: 'medium',
    unit: 'qualitative',
    description: 'Bilirubin in urine',
    normalRange: {
      text: 'Negativa',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'UROBILINOGENO',
    systemCode: 'urine_urobilinogen',
    category: 'other',
    priority: 'medium',
    unit: 'mg/dL',
    description: 'Urobilinogen in urine'
  },

  // URINE ANALYSIS - MICROSCOPIC SEDIMENT
  {
    spanishName: 'HEMATIES POR CAMPO',
    systemCode: 'urine_rbc_per_field',
    category: 'other',
    priority: 'medium',
    unit: 'per field',
    description: 'Red blood cells per field in urine',
    normalRange: {
      min: 0,
      max: 2,
      text: '0 - 2',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'LEUCOCITOS POR CAMPO',
    systemCode: 'urine_wbc_per_field',
    category: 'other',
    priority: 'medium',
    unit: 'per field',
    description: 'White blood cells per field in urine',
    normalRange: {
      min: 0,
      max: 2,
      text: '0 - 2',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'CELULAS EPITELIALES',
    systemCode: 'urine_epithelial_cells',
    category: 'other',
    priority: 'low',
    unit: 'qualitative',
    description: 'Epithelial cells in urine',
    normalRange: {
      text: 'No se observan',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'MUCUS',
    systemCode: 'urine_mucus',
    category: 'other',
    priority: 'low',
    unit: 'qualitative',
    description: 'Mucus in urine',
    normalRange: {
      text: 'No se observa',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'CRISTALES',
    systemCode: 'urine_crystals',
    category: 'other',
    priority: 'low',
    unit: 'qualitative',
    description: 'Crystals in urine',
    normalRange: {
      text: 'No se observan',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'CILINDROS',
    systemCode: 'urine_casts',
    category: 'other',
    priority: 'low',
    unit: 'qualitative',
    description: 'Casts in urine',
    normalRange: {
      text: 'No se observan',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'BACTERIAS',
    systemCode: 'urine_bacteria',
    category: 'other',
    priority: 'low',
    unit: 'qualitative',
    description: 'Bacteria in urine',
    normalRange: {
      text: 'No se observan',
      source: 'Chilean Healthcare Standards'
    }
  },

  // CALCULATED VALUES & SPECIAL TESTS
  {
    spanishName: 'GLICEMIA POST-CARGA (120 MIN)',
    systemCode: 'glucose_post_load',
    category: 'glucose',
    priority: 'high',
    unit: 'mg/dL',
    description: 'Post-load glucose (120 minutes)',
    normalRange: {
      min: 74,
      max: 140,
      text: '74 - 140',
      source: 'Chilean Healthcare Standards'
    }
  },
  {
    spanishName: 'CALCULO TOTAL/HDL',
    systemCode: 'total_hdl_ratio',
    category: 'lipids',
    priority: 'medium',
    unit: 'ratio',
    description: 'Total cholesterol to HDL ratio'
  },
  {
    spanishName: 'CREATINURIA AISLADA',
    systemCode: 'urine_creatinine',
    category: 'kidney',
    priority: 'medium',
    unit: 'mg/dL',
    description: 'Isolated urine creatinine'
  },
  {
    spanishName: 'R.P.R.',
    systemCode: 'rpr',
    category: 'other',
    priority: 'low',
    unit: 'qualitative',
    description: 'Rapid plasma reagin test',
    normalRange: {
      text: 'No reactivo',
      source: 'Chilean Healthcare Standards'
    }
  }
]

/**
 * Creates a lookup map for fast health marker identification
 */
export function createHealthMarkerLookup(): Map<string, HealthMarkerMapping> {
  const lookup = new Map<string, HealthMarkerMapping>()
  
  for (const marker of CHILEAN_HEALTH_MARKERS) {
    // Add exact match
    lookup.set(marker.spanishName.toUpperCase(), marker)
    
    // Add normalized versions (remove accents, punctuation)
    const normalized = marker.spanishName
      .toUpperCase()
      .replace(/[ÁÀÄÂ]/g, 'A')
      .replace(/[ÉÈËÊ]/g, 'E')
      .replace(/[ÍÌÏÎ]/g, 'I')
      .replace(/[ÓÒÖÔ]/g, 'O')
      .replace(/[ÚÙÜÛ]/g, 'U')
      .replace(/[Ñ]/g, 'N')
      .replace(/[^A-Z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    
    if (normalized !== marker.spanishName.toUpperCase()) {
      lookup.set(normalized, marker)
    }
    
    // Add version without parentheses content
    const withoutParens = marker.spanishName
      .toUpperCase()
      .replace(/\([^)]*\)/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    
    if (withoutParens !== marker.spanishName.toUpperCase()) {
      lookup.set(withoutParens, marker)
    }
  }
  
  return lookup
}

/**
 * Health marker extraction result
 */
export interface HealthMarkerResult {
  success: boolean
  marker: HealthMarkerMapping | null
  originalText: string
  confidence: number
  position: number
  context: string
}

/**
 * Comprehensive health marker extraction result
 */
export interface HealthMarkerExtractionResult {
  success: boolean
  results: HealthMarkerResult[]
  criticalMarkers: HealthMarkerResult[]
  highPriorityMarkers: HealthMarkerResult[]
  totalMarkersFound: number
  error?: string
}

/**
 * Extracts health markers from Chilean lab report text
 */
export function extractSpanishHealthMarkers(text: string): HealthMarkerExtractionResult {
  const results: HealthMarkerResult[] = []
  const lookup = createHealthMarkerLookup()
  
  try {
    // Normalize text for better matching
    const normalizedText = text.toUpperCase()
    
    // Search for each health marker
    lookup.forEach((marker, searchTerm) => {
      const regex = new RegExp(`\\b${searchTerm.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}\\b`, 'gi')
      let match
      
      while ((match = regex.exec(normalizedText)) !== null) {
        const position = match.index
        const context = extractHealthMarkerContext(text, position, searchTerm.length)
        
        // Calculate confidence based on context and marker priority
        const confidence = calculateHealthMarkerConfidence(marker, context, searchTerm)
        
        const result: HealthMarkerResult = {
          success: true,
          marker,
          originalText: match[0],
          confidence,
          position,
          context
        }
        
        results.push(result)
      }
    })
    
    // Remove duplicates (same marker found multiple times)
    const uniqueResults = results.filter((result, index, array) => {
      return array.findIndex(r => 
        r.marker?.systemCode === result.marker?.systemCode && 
        Math.abs(r.position - result.position) < 50
      ) === index
    })
    
    // Sort by position in document
    uniqueResults.sort((a, b) => a.position - b.position)
    
    // Categorize by priority
    const criticalMarkers = uniqueResults.filter(r => r.marker?.priority === 'critical')
    const highPriorityMarkers = uniqueResults.filter(r => r.marker?.priority === 'high')
    
    return {
      success: uniqueResults.length > 0,
      results: uniqueResults,
      criticalMarkers,
      highPriorityMarkers,
      totalMarkersFound: uniqueResults.length
    }
    
  } catch (error) {
    console.error('Error extracting health markers:', error)
    return {
      success: false,
      results: [],
      criticalMarkers: [],
      highPriorityMarkers: [],
      totalMarkersFound: 0,
      error: error instanceof Error ? error.message : 'Error desconocido al extraer marcadores de salud'
    }
  }
}

/**
 * Extracts context around a health marker for validation
 */
function extractHealthMarkerContext(text: string, position: number, markerLength: number): string {
  const start = Math.max(0, position - 100)
  const end = Math.min(text.length, position + markerLength + 100)
  return text.substring(start, end).trim()
}

/**
 * Calculates confidence score for a health marker match
 */
function calculateHealthMarkerConfidence(
  marker: HealthMarkerMapping,
  context: string,
  searchTerm: string
): number {
  let confidence = 80 // Base confidence
  
  // Boost confidence based on priority
  switch (marker.priority) {
    case 'critical':
      confidence += 15
      break
    case 'high':
      confidence += 10
      break
    case 'medium':
      confidence += 5
      break
    case 'low':
      confidence += 0
      break
  }
  
  // Boost confidence if found in table-like structure
  if (context.includes('|') || /\s{3,}/.test(context)) {
    confidence += 10
  }
  
  // Boost confidence if found with units
  const contextLower = context.toLowerCase()
  if (marker.unit && contextLower.includes(marker.unit.toLowerCase())) {
    confidence += 15
  }
  
  // Boost confidence if found with result indicators
  if (contextLower.includes('resultado') || contextLower.includes('valor')) {
    confidence += 8
  }
  
  // Boost confidence for exact matches
  if (searchTerm === marker.spanishName.toUpperCase()) {
    confidence += 10
  }
  
  // Penalize if found in headers or titles (less likely to be actual results)
  if (contextLower.includes('laboratorio') || contextLower.includes('examen') || 
      contextLower.includes('informe')) {
    confidence -= 5
  }
  
  return Math.max(0, Math.min(100, confidence))
}

/**
 * Gets health markers by category
 */
export function getHealthMarkersByCategory(category: string): HealthMarkerMapping[] {
  return CHILEAN_HEALTH_MARKERS.filter(marker => marker.category === category)
}

/**
 * Gets critical health markers for priority scoring
 */
export function getCriticalHealthMarkers(): HealthMarkerMapping[] {
  return CHILEAN_HEALTH_MARKERS.filter(marker => marker.priority === 'critical')
}

/**
 * Finds health marker by system code
 */
export function findHealthMarkerByCode(systemCode: string): HealthMarkerMapping | null {
  return CHILEAN_HEALTH_MARKERS.find(marker => marker.systemCode === systemCode) || null
}