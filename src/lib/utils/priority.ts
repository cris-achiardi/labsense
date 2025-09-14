// Shared priority utility functions for consistent priority handling across the app

export type PriorityColor = 'red' | 'orange' | 'yellow' | 'green'
export type PriorityLevel = 'CRÍTICO' | 'ALTO' | 'MEDIO' | 'BAJO'

export interface PriorityBadgeProps {
  color: 'red' | 'amber' | 'yellow' | 'green'
  variant: 'solid'
  text: string
  chipClass: string
}

/**
 * Get priority color based on numeric priority score
 * Used consistently across dashboard and patient pages
 */
export function getPriorityColor(score: number): PriorityColor {
  if (score >= 8) return 'red'      // CRÍTICO
  if (score >= 5) return 'orange'   // ALTO  
  if (score >= 3) return 'yellow'   // MEDIO
  return 'green'                    // BAJO
}

/**
 * Get priority label based on numeric priority score
 * Returns Spanish labels used throughout the app
 */
export function getPriorityLabel(score: number): PriorityLevel {
  if (score >= 8) return 'CRÍTICO'
  if (score >= 5) return 'ALTO'
  if (score >= 3) return 'MEDIO'
  return 'BAJO'
}

/**
 * Get complete priority badge properties for Radix UI Badge component
 * Includes color mapping and chip CSS classes for consistent styling
 */
export function getPriorityBadgeProps(score: number): PriorityBadgeProps {
  const color = getPriorityColor(score)
  const label = getPriorityLabel(score)
  
  // Map colors to Radix UI badge colors and chip CSS classes
  const colorMap = {
    red: { 
      badgeColor: 'red' as const, 
      chipClass: 'chip-error' 
    },
    orange: { 
      badgeColor: 'amber' as const, 
      chipClass: 'chip-warning' 
    },
    yellow: { 
      badgeColor: 'yellow' as const, 
      chipClass: 'chip-info' 
    },
    green: { 
      badgeColor: 'green' as const, 
      chipClass: 'chip-success' 
    }
  }
  
  const mapping = colorMap[color]
  
  return {
    color: mapping.badgeColor,
    variant: 'solid',
    text: label.toLowerCase(),
    chipClass: mapping.chipClass
  }
}

/**
 * Legacy compatibility function for components still using priority_level strings
 * Converts old string-based priority levels to numeric scores for consistent handling
 */
export function convertPriorityLevelToScore(priorityLevel: 'HIGH' | 'MEDIUM' | 'LOW'): number {
  switch (priorityLevel) {
    case 'HIGH': return 6    // Maps to ALTO range (5-7)
    case 'MEDIUM': return 4  // Maps to MEDIO range (3-4) 
    case 'LOW': return 1     // Maps to BAJO range (0-2)
    default: return 0
  }
}