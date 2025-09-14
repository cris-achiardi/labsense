// Shared priority utility functions for consistent priority handling across the app

export type PriorityColor = 'red' | 'orange' | 'yellow' | 'green'
export type PriorityLevel = 'CRÍTICO' | 'ALTO' | 'MEDIO' | 'BAJO'

export interface PriorityBadgeProps {
  chipClass: string
  text: string
}

/**
 * Get priority color based on numeric risk score (0-100 scale)
 * Used consistently across dashboard and patient pages
 */
export function getPriorityColor(score: number): PriorityColor {
  if (score >= 80) return 'red'      // CRÍTICO
  if (score >= 50) return 'orange'   // ALTO  
  if (score >= 20) return 'yellow'   // MEDIO
  return 'green'                     // BAJO
}

/**
 * Get priority label based on numeric risk score (0-100 scale)
 * Returns Spanish labels used throughout the app
 */
export function getPriorityLabel(score: number): PriorityLevel {
  if (score >= 80) return 'CRÍTICO'
  if (score >= 50) return 'ALTO'
  if (score >= 20) return 'MEDIO'
  return 'BAJO'
}

/**
 * Get complete priority badge properties using custom chip CSS classes
 * Maps risk score (0-100) to priority levels for consistent healthcare styling
 */
export function getPriorityBadgeProps(score: number): PriorityBadgeProps {
  const color = getPriorityColor(score)
  const label = getPriorityLabel(score)
  
  // Map priority colors to custom chip CSS classes (defined in globals.css)
  const chipClassMap = {
    red: 'chip-error',      // CRÍTICO - Red background, dark red text
    orange: 'chip-warning', // ALTO - Orange background, dark orange text  
    yellow: 'chip-info',    // MEDIO - Yellow background, dark yellow text
    green: 'chip-success'   // BAJO - Green background, dark green text
  }
  
  return {
    chipClass: chipClassMap[color],
    text: label.toLowerCase()
  }
}

/**
 * Legacy compatibility function for components still using priority_level strings
 * Converts old string-based priority levels to numeric risk scores for consistent handling
 */
export function convertPriorityLevelToScore(priorityLevel: 'HIGH' | 'MEDIUM' | 'LOW'): number {
  switch (priorityLevel) {
    case 'HIGH': return 60    // Maps to ALTO range (50-79)
    case 'MEDIUM': return 30  // Maps to MEDIO range (20-49) 
    case 'LOW': return 10     // Maps to BAJO range (0-19)
    default: return 0
  }
}