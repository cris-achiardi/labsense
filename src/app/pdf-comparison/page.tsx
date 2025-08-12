'use client'

import { EnhancedManualReview } from '@/components/validation/enhanced-manual-review'
import { ManualReviewData } from '@/components/validation/manual-review-interface'
import { PDFComparisonData } from '@/components/validation/pdf-comparison-view'

// Mock data for demonstration
const mockReviewData: ManualReviewData = {
  id: 'demo-1',
  patientRUT: '12.345.678-9',
  patientName: 'María Elena González',
  uploadDate: '2024-01-15 14:30',
  confidence: 68,
  riskLevel: 'medium',
  riskFactors: [
    '⚠️ MEDIO: Confianza por debajo del umbral de aprobación automática',
    '⚠️ MEDIO: Algunos marcadores con baja confianza'
  ],
  components: [
    {
      component: 'rut',
      score: 88,
      issues: [],
      details: 'RUT: 12.345.678-9, Fuente: form, Confianza: 88%'
    },
    {
      component: 'health_markers',
      score: 75,
      issues: ['Algunos marcadores con baja confianza'],
      details: '6 marcadores encontrados (2 críticos, 3 alta prioridad)'
    },
    {
      component: 'reference_ranges',
      score: 65,
      issues: ['Rangos de referencia limitados'],
      details: '4 rangos de referencia encontrados'
    },
    {
      component: 'abnormal_values',
      score: 70,
      issues: [],
      details: '6 marcadores procesados, 3 anormales (1 críticos, 1 severos)'
    }
  ],
  abnormalities: [
    {
      marker: 'GLICEMIA EN AYUNO (BASAL)',
      value: '269 mg/dL',
      referenceRange: '74 - 106',
      severity: 'severe',
      priority: 'critical'
    },
    {
      marker: 'H. TIROESTIMULANTE (TSH)',
      value: '8.5 mUI/L',
      referenceRange: '0.55 - 4.78',
      severity: 'severe',
      priority: 'critical'
    },
    {
      marker: 'COLESTEROL TOTAL',
      value: '220 mg/dL',
      referenceRange: '< 200',
      severity: 'mild',
      priority: 'high'
    }
  ],
  recommendations: [
    '⚠️ Confianza media (68%) - revisión manual recomendada',
    '🚨 3 valores anormales detectados',
    '⚠️ SEVERO: 2 valores severos requieren seguimiento urgente',
    '🩺 Marcadores de glucosa detectados - revisar para diabetes',
    '🩺 Marcadores tiroideos detectados - revisar función tiroidea'
  ],
  originalPdfUrl: '/sample-lab-report.pdf' // This would be a real PDF URL
}

const mockPdfComparisonData: PDFComparisonData = {
  pdfUrl: '/sample-lab-report.pdf',
  patientInfo: {
    rut: '12.345.678-9',
    name: 'María Elena González',
    date: '2024-01-15'
  },
  extractedData: [
    {
      type: 'rut',
      label: 'RUT del Paciente',
      value: '12.345.678-9',
      confidence: 88,
      position: { page: 1, x: 150, y: 200, width: 120, height: 20 },
      context: 'PACIENTE: MARÍA ELENA GONZÁLEZ RUT: 12.345.678-9 EDAD: 45 AÑOS',
      issues: []
    },
    {
      type: 'health_marker',
      label: 'Marcador de Glucosa',
      value: 'GLICEMIA EN AYUNO (BASAL)',
      confidence: 95,
      position: { page: 1, x: 50, y: 350, width: 200, height: 20 },
      context: 'GLICEMIA EN AYUNO (BASAL)    269    mg/dL    [ * ] 74 - 106',
      issues: []
    },
    {
      type: 'lab_value',
      label: 'Valor de Glucosa',
      value: '269 mg/dL',
      confidence: 92,
      position: { page: 1, x: 250, y: 350, width: 80, height: 20 },
      context: 'GLICEMIA EN AYUNO (BASAL)    269    mg/dL    [ * ] 74 - 106',
      issues: ['Valor crítico detectado']
    },
    {
      type: 'reference_range',
      label: 'Rango de Referencia - Glucosa',
      value: '74 - 106 mg/dL',
      confidence: 90,
      position: { page: 1, x: 400, y: 350, width: 100, height: 20 },
      context: 'GLICEMIA EN AYUNO (BASAL)    269    mg/dL    [ * ] 74 - 106',
      issues: []
    },
    {
      type: 'health_marker',
      label: 'Marcador de TSH',
      value: 'H. TIROESTIMULANTE (TSH)',
      confidence: 93,
      position: { page: 1, x: 50, y: 380, width: 200, height: 20 },
      context: 'H. TIROESTIMULANTE (TSH)    8.5    mUI/L    [ * ] 0.55 - 4.78',
      issues: []
    },
    {
      type: 'lab_value',
      label: 'Valor de TSH',
      value: '8.5 mUI/L',
      confidence: 88,
      position: { page: 1, x: 250, y: 380, width: 80, height: 20 },
      context: 'H. TIROESTIMULANTE (TSH)    8.5    mUI/L    [ * ] 0.55 - 4.78',
      issues: ['Valor anormal detectado']
    },
    {
      type: 'reference_range',
      label: 'Rango de Referencia - TSH',
      value: '0.55 - 4.78 mUI/L',
      confidence: 85,
      position: { page: 1, x: 400, y: 380, width: 120, height: 20 },
      context: 'H. TIROESTIMULANTE (TSH)    8.5    mUI/L    [ * ] 0.55 - 4.78',
      issues: []
    },
    {
      type: 'health_marker',
      label: 'Marcador de Colesterol',
      value: 'COLESTEROL TOTAL',
      confidence: 90,
      position: { page: 1, x: 50, y: 410, width: 150, height: 20 },
      context: 'COLESTEROL TOTAL    220    mg/dL    [ * ] < 200',
      issues: []
    },
    {
      type: 'lab_value',
      label: 'Valor de Colesterol',
      value: '220 mg/dL',
      confidence: 85,
      position: { page: 1, x: 250, y: 410, width: 80, height: 20 },
      context: 'COLESTEROL TOTAL    220    mg/dL    [ * ] < 200',
      issues: []
    },
    {
      type: 'reference_range',
      label: 'Rango de Referencia - Colesterol',
      value: '< 200 mg/dL',
      confidence: 82,
      position: { page: 1, x: 400, y: 410, width: 100, height: 20 },
      context: 'COLESTEROL TOTAL    220    mg/dL    [ * ] < 200',
      issues: ['Formato de rango no estándar']
    }
  ],
  summary: {
    totalExtracted: 10,
    highConfidence: 7,
    lowConfidence: 1,
    withIssues: 3
  }
}

export default function PDFComparisonPage() {
  const handleApprove = (id: string, notes: string, validatedItems?: any[]) => {
    console.log('Approved review:', id, 'Notes:', notes, 'Validated items:', validatedItems?.length)
    alert(`Reporte aprobado con ${validatedItems?.length || 0} elementos validados`)
  }

  const handleReject = (id: string, reason: string, notes: string) => {
    console.log('Rejected review:', id, 'Reason:', reason, 'Notes:', notes)
    alert(`Reporte rechazado: ${reason}`)
  }

  const handleRequestInfo = (id: string, questions: string[]) => {
    console.log('Info requested for review:', id, 'Questions:', questions)
    alert(`Información solicitada: ${questions.length} preguntas`)
  }

  return (
    <div style={{ padding: '24px', minHeight: '100vh', backgroundColor: 'var(--gray-1)' }}>
      <EnhancedManualReview
        reviewData={mockReviewData}
        pdfComparisonData={mockPdfComparisonData}
        onApprove={handleApprove}
        onReject={handleReject}
        onRequestMoreInfo={handleRequestInfo}
      />
    </div>
  )
}