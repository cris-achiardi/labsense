'use client';

import { DashboardLayout } from '@/components/ui/dashboard-layout';
import {
	Badge,
	Box,
	Button,
	Card,
	Container,
	Flex,
	Text,
} from '@radix-ui/themes';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { CHILEAN_HEALTH_MARKERS } from '@/lib/pdf-parsing/spanish-health-markers';
import { getPriorityBadgeProps } from '@/lib/utils/priority';

interface Patient {
	id: string;
	rut: string;
	name: string;
	age: string | null;
	gender: string | null;
	priority_score: number;
	contact_status: string;
	created_at: string;
	updated_at: string;
}

interface LabReport {
	id: string;
	patient_id: string;
	folio: string | null;
	fecha_ingreso: string | null;
	toma_muestra: string | null;
	fecha_validacion: string | null;
	profesional_solicitante: string | null;
	procedencia: string | null;
	created_at: string;
}

interface LabResult {
	id: string;
	marker_type: string;
	value: number;
	unit: string;
	is_abnormal: boolean;
	severity: string | null;
	extracted_text: string | null;
	confidence: number;
	created_at: string;
}

interface DemoPatientDetailPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default function DemoPatientDetailPage({ params }: DemoPatientDetailPageProps) {
	const router = useRouter();
	const [patient, setPatient] = useState<Patient | null>(null);
	const [labResults, setLabResults] = useState<LabResult[]>([]);
	const [labReport, setLabReport] = useState<LabReport | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [patientId, setPatientId] = useState<string | null>(null);

	useEffect(() => {
		params.then((resolvedParams) => {
			setPatientId(resolvedParams.id);
		});
	}, [params]);

	// DEMO ANONYMIZATION FUNCTIONS - Keep data private for public demo
	const anonymizeRut = (rut: string) => {
		return rut.replace(/\d/g, '*');
	};

	const anonymizeName = (name: string) => {
		return name
			.split(' ')
			.map((part) =>
				part.length > 0
					? part[0] + '*'.repeat(Math.max(part.length - 1, 3))
					: part
			)
			.join(' ');
	};

	const anonymizeProfesional = (profesional: string | null | undefined) => {
		if (!profesional) return 'N/A';
		return profesional
			.split(' ')
			.map((part) =>
				part.length > 0
					? part[0] + '*'.repeat(Math.max(part.length - 1, 3))
					: part
			)
			.join(' ');
	};

	const anonymizeProcedencia = (procedencia: string | null | undefined) => {
		if (!procedencia) return 'N/A';
		return procedencia
			.split(' ')
			.map((part) =>
				part.length > 0
					? part[0] + '*'.repeat(Math.max(part.length - 1, 3))
					: part
			)
			.join(' ');
	};

	const fetchPatientData = useCallback(async () => {
		try {
			setLoading(true);

			if (!patientId) {
				throw new Error('ID de paciente no proporcionado');
			}

			// Fetch data from demo API (no auth required)
			const response = await fetch(`/api/demo/patients/${patientId}`);
			
			if (!response.ok) {
				throw new Error('No se pudo cargar la información del paciente');
			}

			const data = await response.json();
			
			setPatient(data.patient);
			setLabResults(data.labResults || []);
			setLabReport(data.labReport);

		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Error al cargar los datos'
			);
		} finally {
			setLoading(false);
		}
	}, [patientId]);

	useEffect(() => {
		if (patientId) {
			fetchPatientData();
		}
	}, [patientId, fetchPatientData]);


	if (loading) {
		return (
			<DashboardLayout>
				<Container size='1'>
					<Flex
						direction='column'
						align='center'
						justify='center'
						style={{ minHeight: '50vh' }}
					>
						<Text>Cargando información del paciente...</Text>
					</Flex>
				</Container>
			</DashboardLayout>
		);
	}

	if (error) {
		return (
			<DashboardLayout>
				<Container size='1'>
					<Card>
						<Flex direction='column' align='center' gap='4'>
							<Text size='5' style={{ color: 'var(--red-11)' }}>
								Error al cargar el paciente
							</Text>
							<Text>{error}</Text>
							<Button
								color='mint'
								variant='solid'
								onClick={() => router.back()}
							>
								Volver
							</Button>
						</Flex>
					</Card>
				</Container>
			</DashboardLayout>
		);
	}

	if (!patient) {
		return (
			<DashboardLayout>
				<Container size='1'>
					<Card>
						<Flex direction='column' align='center' gap='4'>
							<Text size='5'>Paciente no encontrado</Text>
							<Button
								color='mint'
								variant='solid'
								onClick={() => router.back()}
							>
								Volver
							</Button>
						</Flex>
					</Card>
				</Container>
			</DashboardLayout>
		);
	}


	// Dynamic helper functions using CHILEAN_HEALTH_MARKERS as single source of truth
	const getLabUnit = (markerType: string): string => {
		// Try to find exact match by system code first
		const exactMatch = CHILEAN_HEALTH_MARKERS.find(marker => 
			marker.systemCode === markerType
		)
		if (exactMatch?.unit) return exactMatch.unit

		// Try to find by Spanish name (case-insensitive match)
		const spanishMatch = CHILEAN_HEALTH_MARKERS.find(marker => 
			marker.spanishName.toLowerCase().includes(markerType.toLowerCase()) ||
			markerType.toLowerCase().includes(marker.spanishName.toLowerCase())
		)
		if (spanishMatch?.unit) return spanishMatch.unit

		// Fallback for partial matches
		const marker = markerType.toLowerCase()
		const partialMatch = CHILEAN_HEALTH_MARKERS.find(m => {
			const spanish = m.spanishName.toLowerCase()
			return spanish.includes('glicemia') && marker.includes('glicemia') ||
					 spanish.includes('colesterol') && marker.includes('colesterol') ||
					 spanish.includes('trigliceridos') && marker.includes('trigliceridos') ||
					 spanish.includes('tsh') && marker.includes('tsh') ||
					 spanish.includes('got') && (marker.includes('got') || marker.includes('ast')) ||
					 spanish.includes('gpt') && (marker.includes('gpt') || marker.includes('alt')) ||
					 spanish.includes('creatinina') && marker.includes('creatinina') ||
					 spanish.includes('hemoglobina') && marker.includes('hemoglobina')
		})
		
		return partialMatch?.unit || 'mg/dL' // default
	}

	const getNormalRange = (markerType: string): string => {
		// Try to find exact match by system code first
		const exactMatch = CHILEAN_HEALTH_MARKERS.find(marker => 
			marker.systemCode === markerType
		)
		if (exactMatch?.normalRange?.text) return exactMatch.normalRange.text

		// Try to find by Spanish name (case-insensitive match)
		const spanishMatch = CHILEAN_HEALTH_MARKERS.find(marker => 
			marker.spanishName.toLowerCase().includes(markerType.toLowerCase()) ||
			markerType.toLowerCase().includes(marker.spanishName.toLowerCase())
		)
		if (spanishMatch?.normalRange?.text) return spanishMatch.normalRange.text

		// Fallback for partial matches
		const marker = markerType.toLowerCase()
		const partialMatch = CHILEAN_HEALTH_MARKERS.find(m => {
			const spanish = m.spanishName.toLowerCase()
			return spanish.includes('glicemia') && marker.includes('glicemia') ||
					 spanish.includes('colesterol') && marker.includes('colesterol') ||
					 spanish.includes('trigliceridos') && marker.includes('trigliceridos') ||
					 spanish.includes('tsh') && marker.includes('tsh') ||
					 spanish.includes('got') && (marker.includes('got') || marker.includes('ast')) ||
					 spanish.includes('gpt') && (marker.includes('gpt') || marker.includes('alt')) ||
					 spanish.includes('creatinina') && marker.includes('creatinina') ||
					 spanish.includes('hemoglobina') && marker.includes('hemoglobina')
		})
		
		return partialMatch?.normalRange?.text || 'Consultar médico' // default
	}

	return (
		<DashboardLayout style={{ backgroundColor: '#EFEFEF' }}>
			<Box style={{ width: '100%' }}>
				<Flex direction='column' gap='2'>
					{/* Back Button - Outside main card */}
					<Button
						variant='ghost'
						onClick={() => router.push('/demo')}
						style={{
							color: 'var(--labsense-blue)',
							fontWeight: '700',
							fontSize: '14px',
							padding: '0.5rem 0',
							justifyContent: 'flex-start',
							alignSelf: 'flex-start',
							marginLeft: '0',
							width: 'fit-content',
						}}
					>
						← Volver a Demo Dashboard
					</Button>

					{/* Main Container Card */}
					<Card
						style={{
							backgroundColor: 'var(--color-panel)',
							padding: '1rem',
						}}
					>
						{/* Section 1: Header (inside main card) */}
						<Flex
							justify='between'
							align='center'
							style={{ marginBottom: 'var(--space-4)' }}
						>
							<Text
								size='4'
								weight='bold'
								style={{ color: 'var(--labsense-text-primary)' }}
							>
								Resultados Laboratorio - Demo
							</Text>
							<Flex align='center' gap='2'>
								<Text
									size='3'
									style={{ color: 'var(--gray-11)', fontWeight: '300' }}
								>
									Folio
								</Text>
								<Text
									size='3'
									style={{
										color: 'var(--labsense-text-primary)',
										fontWeight: '700',
									}}
								>
									{labReport?.folio || 'N/A'}
								</Text>
							</Flex>
						</Flex>

						{/* Demo Banner */}
						<Card
							style={{
								backgroundColor: 'var(--mint-2)',
								border: '1px solid var(--mint-6)',
								padding: '0.75rem',
								marginBottom: 'var(--space-3)',
							}}
						>
							<Text
								size='2'
								style={{
									color: 'var(--mint-11)',
									textAlign: 'center',
									display: 'block'
								}}
							>
								✨ Vista de demostración con datos anonimizados para protección del paciente
							</Text>
						</Card>

						{/* Section 2: Patient Info Card */}
						<Card
							style={{
								border: '1px solid var(--gray-6)',
								backgroundColor: 'var(--color-panel)',
								padding: '1rem',
								marginBottom: 'var(--space-3)',
							}}
						>
							<Flex justify='between' align='start'>
								<Flex direction='column' gap='1'>
									<Text
										size='3'
										weight='medium'
										style={{ color: 'var(--labsense-text-primary)' }}
									>
										{anonymizeName(patient.name)}
									</Text>
									<Text size='2' style={{ color: 'var(--gray-11)' }}>
										RUT: {anonymizeRut(patient.rut)}
									</Text>
								</Flex>
								<Flex direction='column' align='end' gap='1'>
									<Text size='2' style={{ color: 'var(--gray-11)' }}>
										Edad: {patient.age || 'N/A'}
									</Text>
									<Text size='2' style={{ color: 'var(--gray-11)' }}>
										Sexo: {patient.gender || 'N/A'}
									</Text>
								</Flex>
							</Flex>
						</Card>

						{/* Section 3: Lab Test Info Card */}
						<Card
							style={{
								border: '1px solid var(--gray-6)',
								backgroundColor: 'var(--color-panel)',
								padding: '1rem',
								marginBottom: 'var(--space-3)',
							}}
						>
							<Flex justify='between' align='start'>
								<Box style={{ flex: '1' }}>
									<Flex direction='column' gap='1'>
										<Flex align='center' gap='6'>
											<Text
												size='2'
												style={{ color: 'var(--gray-10)', minWidth: '140px' }}
											>
												Fecha de Ingreso:
											</Text>
											<Text size='2' style={{ color: 'var(--gray-11)' }}>
												{labReport?.fecha_ingreso
													? new Date(
															labReport.fecha_ingreso
														).toLocaleDateString('es-CL')
													: 'N/A'}
											</Text>
										</Flex>
										<Flex align='center' gap='6'>
											<Text
												size='2'
												style={{ color: 'var(--gray-10)', minWidth: '140px' }}
											>
												Toma de Muestra:
											</Text>
											<Text size='2' style={{ color: 'var(--gray-11)' }}>
												{labReport?.toma_muestra
													? new Date(labReport.toma_muestra).toLocaleDateString(
															'es-CL'
														)
													: 'N/A'}
											</Text>
										</Flex>
										<Flex align='center' gap='6'>
											<Text
												size='2'
												style={{ color: 'var(--gray-10)', minWidth: '140px' }}
											>
												Fecha de Validación:
											</Text>
											<Text size='2' style={{ color: 'var(--gray-11)' }}>
												{labReport?.fecha_validacion
													? new Date(
															labReport.fecha_validacion
														).toLocaleDateString('es-CL')
													: 'N/A'}
											</Text>
										</Flex>
										<Flex align='center' gap='6'>
											<Text
												size='2'
												style={{ color: 'var(--gray-10)', minWidth: '140px' }}
											>
												Profesional Solicitante:
											</Text>
											<Text size='2' style={{ color: 'var(--gray-11)' }}>
												{anonymizeProfesional(labReport?.profesional_solicitante)}
											</Text>
										</Flex>
										<Flex align='center' gap='6'>
											<Text
												size='2'
												style={{ color: 'var(--gray-10)', minWidth: '140px' }}
											>
												Procedencia:
											</Text>
											<Text size='2' style={{ color: 'var(--gray-11)' }}>
												{anonymizeProcedencia(labReport?.procedencia)}
											</Text>
										</Flex>
									</Flex>
								</Box>
								<Flex direction='column' align='end' gap='2'>
									<Flex align='center' gap='2'>
										<Text size='2' style={{ color: 'var(--gray-11)' }}>
											Prioridad
										</Text>
										<Badge
											className={getPriorityBadgeProps(patient.priority_score).chipClass}
											size='1'
											style={{
												width: '3.875rem',
												textAlign: 'center',
												display: 'flex',
												justifyContent: 'center',
												alignItems: 'center',
											}}
										>
											{getPriorityBadgeProps(patient.priority_score).text}
										</Badge>
									</Flex>
									<Flex align='center' gap='2'>
										<Text size='2' style={{ color: 'var(--gray-11)' }}>
											Exámenes
										</Text>
										<Badge
											className='chip-gray'
											size='1'
											style={{
												width: '3.875rem',
												textAlign: 'center',
												display: 'flex',
												justifyContent: 'center',
												alignItems: 'center',
											}}
										>
											{labResults.length}
										</Badge>
									</Flex>
									<Flex align='center' gap='2'>
										<Text size='2' style={{ color: 'var(--gray-11)' }}>
											Anormal
										</Text>
										<Badge
											className='chip-error'
											size='1'
											style={{
												width: '3.875rem',
												textAlign: 'center',
												display: 'flex',
												justifyContent: 'center',
												alignItems: 'center',
											}}
										>
											{labResults.filter((result) => result.is_abnormal).length}
										</Badge>
									</Flex>
								</Flex>
							</Flex>
						</Card>

						{/* Section 4: Results Table Card */}
						{labResults.length > 0 ? (
							<Card
								style={{
									border: '1px solid var(--gray-6)',
									backgroundColor: 'var(--color-panel)',
									padding: '0',
									overflow: 'auto',
								}}
							>
								{/* Table Rows */}
								{labResults
									.sort((a, b) => {
										// Sort abnormal results first, then normal
										if (a.is_abnormal && !b.is_abnormal) return -1;
										if (!a.is_abnormal && b.is_abnormal) return 1;
										return 0;
									})
									.map((result, index) => {
									const isAbnormal = result.is_abnormal;
									const unit = getLabUnit(result.marker_type);
									const normalRange = getNormalRange(result.marker_type);

									return (
										<Box
											key={result.id}
											style={{
												borderBottom:
													index < labResults.length - 1
														? '1px solid var(--gray-6)'
														: 'none',
												backgroundColor: 'var(--color-panel)',
											}}
										>
											<Flex
												align='center'
												style={{
													minHeight: '40px',
													minWidth: '600px',
													padding: '8px 16px',
												}}
											>
												{/* Lab Name */}
												<Box style={{ flex: '2', minWidth: '200px', textAlign: 'left' }}>
													<Text
														size='2'
														style={{
															color: isAbnormal
																? 'var(--red-10)'
																: 'var(--labsense-text-primary)',
															fontWeight: '400',
														}}
													>
														{result.marker_type}
													</Text>
												</Box>

												{/* Result Value */}
												<Box style={{ flex: '1', textAlign: 'left', minWidth: '80px' }}>
													<Text
														size='2'
														weight='medium'
														style={{
															color: isAbnormal
																? 'var(--red-10)'
																: 'var(--labsense-text-primary)',
														}}
													>
														{result.value}
													</Text>
												</Box>

												{/* Unit */}
												<Box style={{ flex: '1', textAlign: 'left', minWidth: '60px' }}>
													<Text
														size='2'
														style={{
															color: 'var(--gray-11)',
															fontWeight: '400',
														}}
													>
														({unit})
													</Text>
												</Box>

												{/* Reference Range */}
												<Box style={{ flex: '2', textAlign: 'left', minWidth: '150px' }}>
													<Text
														size='2'
														style={{
															color: 'var(--gray-10)',
															fontWeight: '400',
														}}
													>
														{isAbnormal && '[ * ] '}
														{normalRange}
													</Text>
												</Box>
											</Flex>
										</Box>
									);
								})}
							</Card>
						) : (
							<Card
								style={{
									border: '1px solid var(--gray-6)',
									backgroundColor: 'var(--color-panel)',
									padding: '2rem',
								}}
							>
								<Flex direction='column' align='center' gap='4'>
									<Text size='3' style={{ color: 'var(--gray-11)' }}>
										No se encontraron resultados de laboratorio para este
										paciente
									</Text>
									<Button color='mint' variant='solid' size='2' disabled>
										Subir Resultado PDF (Demo)
									</Button>
								</Flex>
							</Card>
						)}
					</Card>
				</Flex>
			</Box>
		</DashboardLayout>
	);
}