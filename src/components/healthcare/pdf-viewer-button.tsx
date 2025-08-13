'use client'

import { Button } from '@radix-ui/themes'
import { ExternalLinkIcon } from '@radix-ui/react-icons'
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
      variant="outline"
      size="2"
      onClick={handleViewPDF}
      disabled={isLoading || !pdfUrl}
    >
      <ExternalLinkIcon />
      {isLoading ? 'Abriendo...' : 'Ver PDF Original'}
    </Button>
  )
}