'use client'

import { Button } from '@radix-ui/themes'
import { useState } from 'react'

interface PDFViewerButtonProps {
  pdfUrl: string
  patientRut: string
  labReportId: string
  patientName: string
}

export function PDFViewerButton({ 
  pdfUrl, 
  patientRut, 
  labReportId, 
  patientName 
}: PDFViewerButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleViewPDF = async () => {
    if (!pdfUrl) {
      alert('PDF no disponible')
      return
    }

    setIsLoading(true)

    try {
      // Log the PDF access event
      await fetch('/api/audit/pdf-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          labReportId,
          patientRut,
          patientName,
          action: 'view_pdf',
        }),
      })

      // Open PDF in new tab
      window.open(pdfUrl, '_blank', 'noopener,noreferrer')
    } catch (error) {
      console.error('Error logging PDF access:', error)
      // Still open the PDF even if logging fails
      window.open(pdfUrl, '_blank', 'noopener,noreferrer')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="1"
      onClick={handleViewPDF}
      disabled={isLoading || !pdfUrl}
      style={{
        backgroundColor: 'var(--labsense-purple)',
        borderRadius: '8px',
        width: '30px',
        height: '30px',
        padding: '0',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer'
      }}
    >
      <img 
        src="/assets/icons/lucide/external-link.svg" 
        alt="View PDF" 
        style={{ width: '16px', height: '16px' }}
      />
    </Button>
  )
}