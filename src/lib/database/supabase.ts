import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error(
		'Missing Supabase environment variables. Please check your .env.local file.'
	);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Complete database types for Task 6 schema
export type Database = {
	public: {
		Tables: {
			patients: {
				Row: {
					id: string;
					rut: string;
					name: string;
					age: string | null;
					gender: string | null;
					age_at_test: number | null;
					sex: string | null;
					priority_score: number;
					last_contact_date: string | null;
					contact_status: 'pending' | 'contacted' | 'processed';
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					rut: string;
					name: string;
					age?: string | null;
					gender?: string | null;
					age_at_test?: number | null;
					sex?: string | null;
					priority_score?: number;
					last_contact_date?: string | null;
					contact_status?: 'pending' | 'contacted' | 'processed';
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					rut?: string;
					name?: string;
					age?: string | null;
					gender?: string | null;
					age_at_test?: number | null;
					sex?: string | null;
					priority_score?: number;
					last_contact_date?: string | null;
					contact_status?: 'pending' | 'contacted' | 'processed';
					created_at?: string;
					updated_at?: string;
				};
			};
			lab_reports: {
				Row: {
					id: string;
					patient_id: string;
					file_name: string;
					file_path: string;
					file_size: number;
					upload_date: string;
					uploaded_by: string;
					extraction_confidence: number;
					processing_status: 'pending' | 'processed' | 'failed';
					priority_score: number;
					test_date: string | null;
					laboratory_name: string | null;
					status: 'pending' | 'processed' | 'contacted' | 'failed';
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					patient_id: string;
					file_name: string;
					file_path: string;
					file_size: number;
					upload_date?: string;
					uploaded_by: string;
					extraction_confidence?: number;
					processing_status?: 'pending' | 'processed' | 'failed';
					priority_score?: number;
					test_date?: string | null;
					laboratory_name?: string | null;
					status?: 'pending' | 'processed' | 'contacted' | 'failed';
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					patient_id?: string;
					file_name?: string;
					file_path?: string;
					file_size?: number;
					upload_date?: string;
					uploaded_by?: string;
					extraction_confidence?: number;
					processing_status?: 'pending' | 'processed' | 'failed';
					priority_score?: number;
					test_date?: string | null;
					laboratory_name?: string | null;
					status?: 'pending' | 'processed' | 'contacted' | 'failed';
					created_at?: string;
					updated_at?: string;
				};
			};
			health_markers: {
				Row: {
					id: string;
					lab_report_id: string;
					marker_type: string;
					value: number;
					unit: string;
					extracted_text: string | null;
					confidence: number | null;
					is_abnormal: boolean;
					abnormal_indicator: string | null;
					severity: 'normal' | 'mild' | 'moderate' | 'severe' | null;
					is_critical_value: boolean;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					lab_report_id: string;
					marker_type: string;
					value: number;
					unit: string;
					extracted_text?: string | null;
					confidence?: number | null;
					is_abnormal?: boolean;
					abnormal_indicator?: string | null;
					severity?: 'normal' | 'mild' | 'moderate' | 'severe' | null;
					is_critical_value?: boolean;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					lab_report_id?: string;
					marker_type?: string;
					value?: number;
					unit?: string;
					extracted_text?: string | null;
					confidence?: number | null;
					is_abnormal?: boolean;
					abnormal_indicator?: string | null;
					severity?: 'normal' | 'mild' | 'moderate' | 'severe' | null;
					is_critical_value?: boolean;
					created_at?: string;
					updated_at?: string;
				};
			};
			normal_ranges: {
				Row: {
					id: string;
					marker_type: string;
					min_value: number | null;
					max_value: number | null;
					unit: string;
					source: string;
					raw_text: string | null;
					is_active: boolean;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					marker_type: string;
					min_value?: number | null;
					max_value?: number | null;
					unit: string;
					source?: string;
					raw_text?: string | null;
					is_active?: boolean;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					marker_type?: string;
					min_value?: number | null;
					max_value?: number | null;
					unit?: string;
					source?: string;
					raw_text?: string | null;
					is_active?: boolean;
					created_at?: string;
					updated_at?: string;
				};
			};
			abnormal_flags: {
				Row: {
					id: string;
					health_marker_id: string;
					severity: 'mild' | 'moderate' | 'severe';
					is_above_range: boolean;
					is_below_range: boolean;
					priority_weight: number;
					flagged_at: string;
				};
				Insert: {
					id?: string;
					health_marker_id: string;
					severity: 'mild' | 'moderate' | 'severe';
					is_above_range: boolean;
					is_below_range: boolean;
					priority_weight?: number;
					flagged_at?: string;
				};
				Update: {
					id?: string;
					health_marker_id?: string;
					severity?: 'mild' | 'moderate' | 'severe';
					is_above_range?: boolean;
					is_below_range?: boolean;
					priority_weight?: number;
					flagged_at?: string;
				};
			};
			audit_logs: {
				Row: {
					id: string;
					user_id: string | null;
					user_email: string | null;
					action: string;
					resource_type: string;
					resource_id: string | null;
					patient_rut: string | null;
					details: any | null;
					ip_address: string | null;
					user_agent: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					user_id?: string | null;
					user_email?: string | null;
					action: string;
					resource_type: string;
					resource_id?: string | null;
					patient_rut?: string | null;
					details?: any | null;
					ip_address?: string | null;
					user_agent?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					user_id?: string | null;
					user_email?: string | null;
					action?: string;
					resource_type?: string;
					resource_id?: string | null;
					patient_rut?: string | null;
					details?: any | null;
					ip_address?: string | null;
					user_agent?: string | null;
					created_at?: string;
				};
			};
		};
		Views: {
			prioritized_patients: {
				Row: {
					id: string;
					name: string;
					rut: string;
					age_at_test: string | null;
					gender: string | null;
					priority_score: number;
					contact_status: 'pending' | 'contacted' | 'processed';
					last_contact_date: string | null;
					lab_report_id: string | null;
					pdf_file_path: string | null;
					test_date: string | null;
					upload_date: string;
					laboratory_name: string | null;
					abnormal_count: number;
					total_tests_count: number;
					abnormal_markers: string | null;
					priority_level: 'HIGH' | 'MEDIUM' | 'LOW';
				};
			};
		};
		Functions: {
			calculate_patient_priority_score: {
				Args: { p_patient_id: string };
				Returns: number;
			};
			log_audit_event: {
				Args: {
					p_user_id: string;
					p_user_email: string;
					p_action: string;
					p_resource_type: string;
					p_resource_id?: string;
					p_patient_rut?: string;
					p_details?: any;
				};
				Returns: string;
			};
		};
	};
};
