import { supabaseAdmin } from '@/lib/database/supabase-admin'
import { anonymizeChileanRUT } from '@/lib/utils/chilean-rut'

export interface PatientInfo {
  rut: string | null
  name: string | null
  age: string | null
  gender: string | null
  confidence: number
}

export interface StorageResult {
  success: boolean
  patientId?: string
  labReportId?: string
  filePath?: string
  error?: string
}

/**
 * Generates a secure file name for PDF storage
 */
function generateSecureFileName(originalName: string, patientRut: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const anonymizedRut = anonymizeChileanRUT(patientRut)
  const extension = originalName.split('.').pop() || 'pdf'
  
  // Format: YYYY-MM-DDTHH-MM-SS_RUT_original-name.pdf
  const safeName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `${timestamp}_${anonymizedRut}_${safeName}.${extension}`
}

/**
 * Creates or updates patient record
 */
async function upsertPatient(patientInfo: PatientInfo): Promise<string | null> {
  if (!patientInfo.rut || !patientInfo.name) {
    throw new Error('RUT y nombre son obligatorios')
  }

  try {
    // Check if patient exists
    const { data: existingPatient, error: fetchError } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('rut', patientInfo.rut)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw new Error(`Error al buscar paciente: ${fetchError.message}`)
    }

    if (existingPatient) {
      // Update existing patient
      const { data: updatedPatient, error: updateError } = await supabaseAdmin
        .from('patients')
        .update({
          name: patientInfo.name,
          age: patientInfo.age,
          gender: patientInfo.gender,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPatient.id)
        .select('id')
        .single()

      if (updateError) {
        throw new Error(`Error al actualizar paciente: ${updateError.message}`)
      }

      return updatedPatient.id
    } else {
      // Create new patient
      const { data: newPatient, error: insertError } = await supabaseAdmin
        .from('patients')
        .insert({
          rut: patientInfo.rut,
          name: patientInfo.name,
          age: patientInfo.age,
          gender: patientInfo.gender
        })
        .select('id')
        .single()

      if (insertError) {
        throw new Error(`Error al crear paciente: ${insertError.message}`)
      }

      return newPatient.id
    }
  } catch (error) {
    console.error('Error in upsertPatient:', error)
    throw error
  }
}

/**
 * Uploads PDF to Supabase Storage
 */
async function uploadPDFToStorage(
  file: Buffer, 
  fileName: string, 
  patientRut: string
): Promise<string> {
  try {
    const secureFileName = generateSecureFileName(fileName, patientRut)
    const filePath = `lab-reports/${new Date().getFullYear()}/${secureFileName}`

    const { data, error } = await supabaseAdmin.storage
      .from('pdfs')
      .upload(filePath, file, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      throw new Error(`Error al subir PDF: ${error.message}`)
    }

    return data.path
  } catch (error) {
    console.error('Error in uploadPDFToStorage:', error)
    throw error
  }
}

/**
 * Creates lab report record
 */
async function createLabReport(
  patientId: string,
  fileName: string,
  filePath: string,
  fileSize: number,
  uploadedBy: string,
  confidence: number
): Promise<string> {
  try {
    const { data: labReport, error } = await supabaseAdmin
      .from('lab_reports')
      .insert({
        patient_id: patientId,
        file_name: fileName,
        file_path: filePath,
        file_size: fileSize,
        uploaded_by: uploadedBy,
        extraction_confidence: confidence,
        processing_status: 'processed'
      })
      .select('id')
      .single()

    if (error) {
      throw new Error(`Error al crear registro de laboratorio: ${error.message}`)
    }

    return labReport.id
  } catch (error) {
    console.error('Error in createLabReport:', error)
    throw error
  }
}

/**
 * Main function to store PDF with patient information
 */
export async function storePDFWithPatient(
  file: Buffer,
  fileName: string,
  fileSize: number,
  patientInfo: PatientInfo,
  uploadedBy: string
): Promise<StorageResult> {
  try {
    // Validate required information
    if (!patientInfo.rut || !patientInfo.name) {
      return {
        success: false,
        error: 'Información del paciente incompleta (RUT y nombre requeridos)'
      }
    }

    // Step 1: Create or update patient
    const patientId = await upsertPatient(patientInfo)
    if (!patientId) {
      return {
        success: false,
        error: 'Error al crear o actualizar paciente'
      }
    }

    // Step 2: Upload PDF to storage
    const filePath = await uploadPDFToStorage(file, fileName, patientInfo.rut)

    // Step 3: Create lab report record
    const labReportId = await createLabReport(
      patientId,
      fileName,
      filePath,
      fileSize,
      uploadedBy,
      patientInfo.confidence
    )

    // Log successful storage (with anonymized data)
    console.log('PDF stored successfully:', {
      patientId,
      labReportId,
      anonymizedRut: anonymizeChileanRUT(patientInfo.rut),
      fileName,
      uploadedBy,
      confidence: patientInfo.confidence
    })

    return {
      success: true,
      patientId,
      labReportId,
      filePath
    }

  } catch (error) {
    console.error('Error storing PDF with patient:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al almacenar PDF'
    }
  }
}

/**
 * Gets PDF download URL from storage
 */
export async function getPDFDownloadUrl(filePath: string): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from('pdfs')
      .createSignedUrl(filePath, 3600) // 1 hour expiry

    if (error) {
      console.error('Error creating signed URL:', error)
      return null
    }

    return data.signedUrl
  } catch (error) {
    console.error('Error in getPDFDownloadUrl:', error)
    return null
  }
}

/**
 * Lists lab reports for a patient
 */
export async function getPatientLabReports(patientId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('lab_reports')
      .select(`
        id,
        file_name,
        file_path,
        file_size,
        upload_date,
        uploaded_by,
        extraction_confidence,
        processing_status
      `)
      .eq('patient_id', patientId)
      .order('upload_date', { ascending: false })

    if (error) {
      throw new Error(`Error al obtener reportes: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Error in getPatientLabReports:', error)
    throw error
  }
}