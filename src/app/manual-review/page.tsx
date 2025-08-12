import { Metadata } from 'next'
import { ManualReviewQueue } from '@/components/validation/manual-review-queue'

export const metadata: Metadata = {
  title: 'Revisión Manual - LabSense',
  description: 'Sistema de revisión manual para reportes de laboratorio con baja confianza'
}

export default function ManualReviewPage() {
  return (
    <div style={{ padding: '24px', minHeight: '100vh', backgroundColor: 'var(--gray-1)' }}>
      <ManualReviewQueue 
        onReviewComplete={(reviewId, action) => {
          console.log(`Review ${reviewId} completed with action: ${action}`)
          // In a real app, this would update the database and possibly trigger notifications
        }}
      />
    </div>
  )
}