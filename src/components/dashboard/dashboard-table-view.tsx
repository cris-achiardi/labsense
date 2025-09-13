'use client';

import { PDFViewerButton } from '@/components/healthcare/pdf-viewer-button';
import { db } from '@/lib/database';
import { PatientFilters, PrioritizedPatient } from '@/types/database';
import {
	Badge,
	Box,
	Button,
	Card,
	Container,
	Flex,
	Spinner,
	Text,
} from '@radix-ui/themes';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface DashboardTableViewProps {
	limit?: number;
	onPatientClick?: (patientId: string) => void;
	filters?: PatientFilters;
	viewMode?: 'table' | 'cards';
	onPatientCountChange?: (count: number) => void;
}

export function DashboardTableView({
	limit = 10,
	onPatientClick,
	filters,
	viewMode = 'table',
	onPatientCountChange,
}: DashboardTableViewProps) {
	const { data: session } = useSession();
	const [patients, setPatients] = useState<PrioritizedPatient[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		loadPatients();
	}, [limit, filters]);

	const loadPatients = async () => {
		try {
			setLoading(true);
			setError(null);

			const prioritizedPatients = await db.getPrioritizedPatients(
				limit,
				0,
				filters
			);
			setPatients(prioritizedPatients);
			onPatientCountChange?.(prioritizedPatients.length);
		} catch (err) {
			console.error('Error loading patients:', err);
			setError('Error cargando pacientes. Por favor, intenta nuevamente.');
		} finally {
			setLoading(false);
		}
	};

	const handlePatientClick = (patientId: string) => {
		if (onPatientClick) {
			onPatientClick(patientId);
		} else {
			window.location.href = `/patients/${patientId}`;
		}
	};

	const getPriorityBadge = (priorityLevel: 'HIGH' | 'MEDIUM' | 'LOW') => {
		switch (priorityLevel) {
			case 'HIGH':
				return {
					color: 'red' as const,
					variant: 'solid' as const,
					text: 'alto',
				};
			case 'MEDIUM':
				return {
					color: 'amber' as const,
					variant: 'solid' as const,
					text: 'medio',
				};
			case 'LOW':
				return {
					color: 'green' as const,
					variant: 'solid' as const,
					text: 'bajo',
				};
			default:
				return {
					color: 'gray' as const,
					variant: 'soft' as const,
					text: 'sin clasificar',
				};
		}
	};

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

	const formatDate = (date: string | Date | null | undefined) => {
		if (!date) return 'No disponible';

		const dateObj = typeof date === 'string' ? new Date(date) : date;
		return dateObj.toLocaleDateString('es-CL', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	};

	const formatAge = (ageAtTest: number | string | undefined) => {
		if (!ageAtTest) {
			return 'N/A';
		}

		if (typeof ageAtTest === 'string') {
			return ageAtTest;
		}

		const years = Math.floor(ageAtTest);
		const months = Math.floor((ageAtTest - years) * 12);
		const days = Math.floor(((ageAtTest - years) * 12 - months) * 30.44);

		return `${years}a ${months}m ${days}d`;
	};

	if (loading) {
		return (
			<Container size='4'>
				<Flex
					direction='column'
					align='center'
					justify='center'
					gap='4'
					style={{ minHeight: '200px' }}
				>
					<Spinner size='3' />
					<Text>Cargando pacientes priorizados...</Text>
				</Flex>
			</Container>
		);
	}

	if (error) {
		return (
			<Container size='4'>
				<Card>
					<Flex
						direction='column'
						align='center'
						gap='4'
						style={{ padding: 'var(--space-6)' }}
					>
						<Text color='red' weight='bold'>
							Error
						</Text>
						<Text>{error}</Text>
						<Button onClick={loadPatients} color='mint' variant='outline'>
							Reintentar
						</Button>
					</Flex>
				</Card>
			</Container>
		);
	}

	if (patients.length === 0) {
		return (
			<Container size='4'>
				<Card>
					<Flex
						direction='column'
						align='center'
						gap='4'
						style={{ padding: 'var(--space-6)' }}
					>
						<Text size='4' weight='bold'>
							No hay pacientes para mostrar
						</Text>
						<Text color='gray'>
							No se encontraron pacientes con resultados de laboratorio
							procesados.
						</Text>
					</Flex>
				</Card>
			</Container>
		);
	}

	if (viewMode === 'cards') {
		// Mobile-friendly card grid view
		return (
			<Flex gap='4' wrap='wrap'>
				{patients.map((patient) => {
					const priorityBadge = getPriorityBadge(patient.priority_level);

					return (
						<Card
							key={patient.id}
							style={{ width: '380px', minHeight: '280px' }}
						>
							<Flex direction='column' gap='3' style={{ height: '100%' }}>
								<Flex justify='between' align='center'>
									<Text weight='bold' size='3'>
										{anonymizeName(patient.name)}
									</Text>
									<Badge
										color={priorityBadge.color}
										variant={priorityBadge.variant}
									>
										{priorityBadge.text}
									</Badge>
								</Flex>

								<Flex direction='column' gap='1'>
									<Text size='2' style={{ color: 'var(--gray-11)' }}>
										RUT: {anonymizeRut(patient.rut)}
									</Text>
									<Text size='2' style={{ color: 'var(--gray-11)' }}>
										Fecha de examen: {formatDate(patient.test_date)}
									</Text>
									<Text size='2' style={{ color: 'var(--gray-11)' }}>
										Puntaje: {patient.priority_score}
									</Text>
								</Flex>

								<Flex gap='2' style={{ marginTop: 'auto' }}>
									<Button
										color='mint'
										variant='solid'
										size='2'
										style={{ flex: 1 }}
										onClick={() => handlePatientClick(patient.id)}
									>
										Ver Detalles
									</Button>

									{patient.pdf_file_path && patient.lab_report_id && (
										<PDFViewerButton
											pdfUrl={patient.pdf_file_path}
											patientRut={patient.rut}
											labReportId={patient.lab_report_id}
											patientName={patient.name}
										/>
									)}
								</Flex>
							</Flex>
						</Card>
					);
				})}
			</Flex>
		);
	}

	// HTML Table Implementation
	return (
		<Box style={{ width: '100%' }}>
			<Card
				style={{
					border: '1px solid var(--gray-6)',
					overflow: 'auto',
				}}
			>
				<table
					style={{
						width: '100%',
						borderCollapse: 'collapse',
						fontSize: '14px',
					}}
				>
					<thead>
						<tr
							style={{
								backgroundColor: 'var(--color-panel)',
								borderBottom: '1px solid var(--gray-6)',
							}}
						>
							<th
								style={{
									padding: '8px',
									textAlign: 'left',
									fontWeight: '500',
									color: 'var(--gray-12)',
									minWidth: '200px',
								}}
							>
								Nombre del Paciente (ID)
							</th>
							<th
								style={{
									padding: '8px',
									textAlign: 'left',
									fontWeight: '500',
									color: 'var(--gray-12)',
									width: '120px',
								}}
							>
								RUT
							</th>
							<th
								style={{
									padding: '8px',
									textAlign: 'left',
									fontWeight: '500',
									color: 'var(--gray-12)',
									width: '80px',
								}}
							>
								Edad
							</th>
							<th
								style={{
									padding: '8px',
									textAlign: 'left',
									fontWeight: '500',
									color: 'var(--gray-12)',
									width: '70px',
								}}
							>
								Sexo
							</th>
							<th
								style={{
									padding: '8px',
									textAlign: 'left',
									fontWeight: '500',
									color: 'var(--gray-12)',
									width: '100px',
								}}
							>
								Prioridad
							</th>
							<th
								style={{
									padding: '8px',
									textAlign: 'left',
									fontWeight: '500',
									color: 'var(--gray-12)',
									width: '130px',
								}}
							>
								Fecha Examen
							</th>
							<th
								style={{
									padding: '8px',
									textAlign: 'left',
									fontWeight: '500',
									color: 'var(--gray-12)',
									width: '70px',
								}}
							>
								Folio
							</th>
							<th
								style={{
									padding: '8px',
									textAlign: 'center',
									fontWeight: '500',
									color: 'var(--gray-12)',
									width: '90px',
								}}
							>
								Exámenes
							</th>
							<th
								style={{
									padding: '8px',
									textAlign: 'center',
									fontWeight: '500',
									color: 'var(--gray-12)',
									width: '80px',
								}}
							>
								Anormal
							</th>
							<th
								style={{
									padding: '8px',
									textAlign: 'center',
									fontWeight: '500',
									color: 'var(--gray-12)',
									width: '100px',
								}}
							>
								Pje. Riesgo
							</th>
							<th
								style={{
									padding: '8px',
									textAlign: 'center',
									fontWeight: '500',
									color: 'var(--gray-12)',
									width: '60px',
								}}
							>
								PDF
							</th>
						</tr>
					</thead>
					<tbody>
						{patients.map((patient, index) => {
							const priorityBadge = getPriorityBadge(patient.priority_level);

							return (
								<tr
									key={patient.id}
									style={{
										borderBottom:
											index < patients.length - 1
												? '1px solid var(--gray-6)'
												: 'none',
										backgroundColor: 'var(--color-panel)',
										transition: 'background-color 0.2s ease',
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.backgroundColor = 'var(--gray-3)';
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.backgroundColor =
											'var(--color-panel)';
									}}
								>
									{/* Patient Name and ID */}
									<td
										style={{
											padding: '8px',
											minHeight: '40px',
											verticalAlign: 'middle',
										}}
									>
										<Flex align='center' gap='2'>
											<Text
												size='2'
												style={{
													color: 'var(--blue-11)',
													cursor: 'pointer',
													fontWeight: '300',
												}}
												onClick={() => handlePatientClick(patient.id)}
											>
												{anonymizeName(patient.name)}
											</Text>
											<Text
												size='2'
												style={{ color: 'var(--blue-11)', fontWeight: '300' }}
											>
												({patient.id.slice(-5)})
											</Text>
										</Flex>
									</td>

									{/* RUT */}
									<td style={{ padding: '8px', verticalAlign: 'middle' }}>
										<Text
											size='2'
											style={{ color: 'var(--gray-12)', fontWeight: '300' }}
										>
											{anonymizeRut(patient.rut)}
										</Text>
									</td>

									{/* Age */}
									<td style={{ padding: '8px', verticalAlign: 'middle' }}>
										<Text
											size='2'
											style={{ color: 'var(--gray-12)', fontWeight: '300' }}
										>
											{formatAge(patient.age_at_test)}
										</Text>
									</td>

									{/* Gender */}
									<td style={{ padding: '8px', verticalAlign: 'middle' }}>
										<Text
											size='2'
											style={{ color: 'var(--gray-12)', fontWeight: '300' }}
										>
											{patient.gender ?? 'N/A'}
										</Text>
									</td>

									{/* Priority Badge */}
									<td style={{ padding: '8px', verticalAlign: 'middle' }}>
										<Badge
											color={priorityBadge.color}
											variant={priorityBadge.variant}
											size='1'
											style={{ fontSize: '12px' }}
										>
											{priorityBadge.text}
										</Badge>
									</td>

									{/* Test Date */}
									<td style={{ padding: '8px', verticalAlign: 'middle' }}>
										<Text
											size='2'
											style={{ color: 'var(--gray-12)', fontWeight: '300' }}
										>
											{formatDate(patient.test_date)}
										</Text>
									</td>

									{/* Folio */}
									<td style={{ padding: '8px', verticalAlign: 'middle' }}>
										<Text
											size='2'
											style={{ color: 'var(--gray-12)', fontWeight: '300' }}
										>
											{patient.lab_report_id || 'N/A'}
										</Text>
									</td>

									{/* Total Tests Count */}
									<td
										style={{
											padding: '8px',
											textAlign: 'center',
											verticalAlign: 'middle',
										}}
									>
										<Text
											size='1'
											style={{ color: 'var(--gray-12)', fontWeight: '300' }}
										>
											{patient.total_tests_count || 0}
										</Text>
									</td>

									{/* Abnormal Count */}
									<td
										style={{
											padding: '8px',
											textAlign: 'center',
											verticalAlign: 'middle',
										}}
									>
										<Text
											size='1'
											style={{
												color:
													patient.abnormal_count > 0
														? 'var(--red-11)'
														: 'var(--gray-12)',
												fontWeight: '300',
											}}
										>
											{patient.abnormal_count || 0}
										</Text>
									</td>

									{/* Priority Score */}
									<td
										style={{
											padding: '8px',
											textAlign: 'center',
											verticalAlign: 'middle',
										}}
									>
										<Text
											size='1'
											style={{
												color:
													patient.priority_score > 1000
														? 'var(--red-11)'
														: patient.priority_score > 100
															? 'var(--amber-9)'
															: 'var(--green-11)',
												fontWeight: '300',
											}}
										>
											{patient.priority_score || 0}
										</Text>
									</td>

									{/* PDF Button */}
									<td
										style={{
											padding: '8px',
											textAlign: 'center',
											verticalAlign: 'middle',
											display: 'table-cell',
										}}
									>
										<div
											style={{
												display: 'flex',
												justifyContent: 'center',
												alignItems: 'center',
												width: '100%',
											}}
										>
											<PDFViewerButton
												pdfUrl={
													patient.pdf_file_path ||
													'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
												}
												patientRut={patient.rut}
												labReportId={patient.lab_report_id || 'test-report'}
												patientName={patient.name}
											/>
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</Card>
		</Box>
	);
}
