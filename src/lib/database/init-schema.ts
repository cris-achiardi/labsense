// Database schema initialization helper for development and testing

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function initializeSchema() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    console.log('🔄 Initializing database schema...')

    // Check if tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')

    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError)
      return false
    }

    const tableNames = tables?.map(t => t.table_name) || []
    
    const requiredTables = [
      'patients',
      'lab_reports', 
      'health_markers',
      'normal_ranges',
      'abnormal_flags',
      'audit_logs'
    ]

    const missingTables = requiredTables.filter(table => !tableNames.includes(table))

    if (missingTables.length > 0) {
      console.log('⚠️  Missing tables:', missingTables.join(', '))
      console.log('📝 Please run the migration: supabase/migrations/006_complete_database_schema.sql')
      return false
    }

    console.log('✅ All required tables exist')

    // Check if normal ranges are populated
    const { data: normalRanges, error: rangesError } = await supabase
      .from('normal_ranges')
      .select('count')
      .single()

    if (rangesError) {
      console.error('❌ Error checking normal ranges:', rangesError)
      return false
    }

    if (!normalRanges || normalRanges.count === 0) {
      console.log('⚠️  Normal ranges table is empty')
      console.log('📝 Please run the migration to populate initial normal ranges')
      return false
    }

    console.log('✅ Normal ranges are populated')

    // Test basic functionality
    const { data: testPatient, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .limit(1)

    if (patientError) {
      console.error('❌ Error testing patient table access:', patientError)
      return false
    }

    console.log('✅ Database schema is properly initialized')
    return true

  } catch (error) {
    console.error('❌ Error initializing schema:', error)
    return false
  }
}

export async function getSchemaStatus() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Get table counts
    const tables = ['patients', 'lab_reports', 'health_markers', 'normal_ranges', 'abnormal_flags', 'audit_logs']
    const status: Record<string, number> = {}

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (error) {
        status[table] = -1 // Error
      } else {
        status[table] = count || 0
      }
    }

    return status
  } catch (error) {
    console.error('Error getting schema status:', error)
    return null
  }
}

// Helper function to create test data for development
export async function createTestData() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    console.log('🔄 Creating test data...')

    // Create test patient
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .insert({
        rut: '12.345.678-9',
        name: 'Juan Pérez González',
        age: '45',
        gender: 'masculino',
        priority_score: 0,
        contact_status: 'pending'
      })
      .select()
      .single()

    if (patientError) {
      console.error('❌ Error creating test patient:', patientError)
      return false
    }

    console.log('✅ Test patient created:', patient.name)

    // Create test lab report
    const { data: labReport, error: reportError } = await supabase
      .from('lab_reports')
      .insert({
        patient_id: patient.id,
        file_name: 'test_lab_report.pdf',
        file_path: '/test/path/test_lab_report.pdf',
        file_size: 1024000,
        uploaded_by: 'test@example.com',
        extraction_confidence: 85,
        processing_status: 'processed',
        priority_score: 0,
        test_date: new Date().toISOString().split('T')[0],
        laboratory_name: 'Laboratorio Central',
        status: 'pending'
      })
      .select()
      .single()

    if (reportError) {
      console.error('❌ Error creating test lab report:', reportError)
      return false
    }

    console.log('✅ Test lab report created')

    // Create test health markers
    const healthMarkers = [
      {
        lab_report_id: labReport.id,
        marker_type: 'GLICEMIA EN AYUNO',
        value: 180, // Abnormally high
        unit: 'mg/dL',
        extracted_text: 'GLICEMIA EN AYUNO: 180 mg/dL [ * ]',
        confidence: 0.95,
        is_abnormal: true,
        abnormal_indicator: '[ * ]',
        severity: 'moderate',
        is_critical_value: false
      },
      {
        lab_report_id: labReport.id,
        marker_type: 'COLESTEROL TOTAL',
        value: 95, // Normal
        unit: 'mg/dL',
        extracted_text: 'COLESTEROL TOTAL: 95 mg/dL',
        confidence: 0.90,
        is_abnormal: false,
        severity: 'normal',
        is_critical_value: false
      }
    ]

    const { data: markers, error: markersError } = await supabase
      .from('health_markers')
      .insert(healthMarkers)
      .select()

    if (markersError) {
      console.error('❌ Error creating test health markers:', markersError)
      return false
    }

    console.log('✅ Test health markers created')

    // Create abnormal flag for the high glucose
    const abnormalMarker = markers.find(m => m.is_abnormal)
    if (abnormalMarker) {
      const { error: flagError } = await supabase
        .from('abnormal_flags')
        .insert({
          health_marker_id: abnormalMarker.id,
          severity: 'moderate',
          is_above_range: true,
          is_below_range: false,
          priority_weight: 2
        })

      if (flagError) {
        console.error('❌ Error creating abnormal flag:', flagError)
        return false
      }

      console.log('✅ Abnormal flag created')
    }

    // Update patient priority score
    const { error: priorityError } = await supabase
      .rpc('calculate_patient_priority_score', { p_patient_id: patient.id })

    if (priorityError) {
      console.error('❌ Error calculating priority score:', priorityError)
      return false
    }

    console.log('✅ Patient priority score calculated')

    console.log('🎉 Test data creation completed successfully!')
    return true

  } catch (error) {
    console.error('❌ Error creating test data:', error)
    return false
  }
}

// CLI helper for development
if (require.main === module) {
  const command = process.argv[2]
  
  switch (command) {
    case 'init':
      initializeSchema().then(success => {
        process.exit(success ? 0 : 1)
      })
      break
    case 'status':
      getSchemaStatus().then(status => {
        console.log('📊 Schema Status:')
        if (status) {
          Object.entries(status).forEach(([table, count]) => {
            const icon = count === -1 ? '❌' : count === 0 ? '⚠️' : '✅'
            console.log(`${icon} ${table}: ${count === -1 ? 'ERROR' : count + ' records'}`)
          })
        }
        process.exit(0)
      })
      break
    case 'test-data':
      createTestData().then(success => {
        process.exit(success ? 0 : 1)
      })
      break
    default:
      console.log('Usage: node init-schema.js [init|status|test-data]')
      process.exit(1)
  }
}