/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import {
	Alert, Button, FormFeedback, FormGroup, Input, Label,
	Pagination, PaginationItem, PaginationLink, Table, Modal, ModalHeader, ModalBody
} from 'reactstrap';
import { titleStyle } from '../../styles/modalStyle';
import { HolidayInstance } from 'types/redux/holiday';
import { testHolidayInstances } from './holidayInstanceTestData'; // For testing purposes, remove this import in production

const PER_PAGE = 20;

interface HolidayInstanceGroupComponentProps {
	holidayInstances?: HolidayInstance[];
	handleUpdateHolidayLimit?: (holidayLimit: number) => void;
	handleCreateHolidayInstanceGroup?: (holidayInstanceIds: number[]) => void;
}

/**
 * Defines the holiday instance group selection page.
 * @param props Holiday instance data and optional action handlers
 * @returns Holiday instance group page element
 */
export default function HolidayInstanceGroupComponent(props: HolidayInstanceGroupComponentProps) {
	const holidayInstances = props.holidayInstances ?? testHolidayInstances;
	const [holidayLimitText, setHolidayLimitText] = React.useState(PER_PAGE.toString());
	const [displayLimit, setDisplayLimit] = React.useState(PER_PAGE);
	const [currentPage, setCurrentPage] = React.useState(1);
	const [showAllHolidays, setShowAllHolidays] = React.useState(false);
	const [selectedHolidayInstanceIds, setSelectedHolidayInstanceIds] = React.useState<number[]>([]);
	const holidayLimit = Number(holidayLimitText);
	// Modal state for displaying full log message
	const [modalOpen, setModalOpen] = React.useState(false);
	// holiday name to display in the modal header
	const [modelHeader, setModelHeader] = React.useState('');
	// Holiday note to display in the modal
	const [modalHolidayNote, setModalHolidayNote] = React.useState('');
	const holidayLimitInvalid = holidayLimitText.trim() === ''
		|| !Number.isInteger(holidayLimit)
		|| holidayLimit < 1;
	const displayedHolidayInstances = showAllHolidays
		? holidayInstances
		: holidayInstances.slice(0, displayLimit);
	const totalPages = Math.max(1, Math.ceil(displayedHolidayInstances.length / PER_PAGE));
	const paginatedHolidayInstances = showAllHolidays
		? displayedHolidayInstances
		: displayedHolidayInstances.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
	const selectedHolidayInstanceIdsForGroup = holidayInstances
		.filter(holidayInstance => selectedHolidayInstanceIds.includes(holidayInstance.id))
		.map(holidayInstance => holidayInstance.id);

	React.useEffect(() => {
		if (currentPage > totalPages) {
			setCurrentPage(totalPages);
		}
	}, [currentPage, totalPages]);

	const handleUpdateHolidayLimit = () => {
		if (holidayLimitInvalid) {
			return;
		}

		setDisplayLimit(holidayLimit);
		setCurrentPage(1);
		setShowAllHolidays(false);
		props.handleUpdateHolidayLimit?.(holidayLimit);
	};

	//open modal to show full holiday name and note
	const handleHolidayNoteModal = (holidayName: string, holidayNote: string) => {
		setModelHeader(holidayName);
		setModalHolidayNote(holidayNote);
		setModalOpen(true);
	};

	const handleHolidayInstanceSelect = (holidayInstanceId: number) => {
		setSelectedHolidayInstanceIds(currentIds => currentIds.includes(holidayInstanceId)
			? currentIds.filter(id => id !== holidayInstanceId)
			: [...currentIds, holidayInstanceId]);
	};

	const handleCreateHolidayInstanceGroup = () => {
		props.handleCreateHolidayInstanceGroup?.(selectedHolidayInstanceIdsForGroup);
	};

	return (
		<div className='flexGrowOne' style={pageStyle}>
			<h1 style={holidayTitleStyle}>
				<FormattedMessage id='holiday.instance.group' defaultMessage='Holiday Instance Group' />
			</h1>

			<div style={holidayFilterStyle}>
				<FormGroup style={holidayLimitGroupStyle}>
					<Label for='holidayLimit' style={{fontWeight: 'bold', margin: '0'}}>
						<FormattedMessage
							id='holiday.number.display'
							defaultMessage='Number of holidays to display' />
					</Label>
					<Input
						id='holidayLimit'
						name='holidayLimit'
						type='number'
						min={1}
						inputMode='numeric'
						value={holidayLimitText}
						invalid={holidayLimitInvalid}
						onChange={e => setHolidayLimitText(e.target.value)}
					/>
					<FormFeedback>
						<FormattedMessage
							id='holiday.limit.required'
							defaultMessage='Enter at least 1 holiday.' />
					</FormFeedback>
				</FormGroup>
				<Button
					color='secondary'
					outline
					disabled={holidayLimitInvalid}
					onClick={handleUpdateHolidayLimit}
				>
					<FormattedMessage id='update' defaultMessage='Update' />
				</Button>
			</div>

			{/* Display holiday instances table */}
			{holidayInstances.length > 0 ? (
				<div style={tableWrapStyle}>
					<Table bordered style={tableStyle}>
						<thead>
							<tr>
								<th>
									<FormattedMessage id='holiday.instance' defaultMessage='Holiday Instance' />
								</th>
								<th>
									<FormattedMessage id='note' defaultMessage='Note' />
								</th>
								<th>
									<FormattedMessage id='select' defaultMessage='Select' />
								</th>
							</tr>
						</thead>
						<tbody style={bodyStyle}>
							{paginatedHolidayInstances.map(holidayInstance => {
								const selected = selectedHolidayInstanceIds.includes(holidayInstance.id);

								return (
									<tr key={holidayInstance.id}>
										<td>
											{holidayInstance.name}
										</td>
										<td style={{ cursor: 'pointer' }}
											onClick={() => handleHolidayNoteModal(holidayInstance.name, holidayInstance.note)}
										>
											{holidayInstance.note.length > 80 ? `${holidayInstance.note.slice(0, 80)}...` : holidayInstance.note}
										</td>
										<td>
											<Label check style={checkboxLabelStyle}>
												<Input
													type='checkbox'
													checked={selected}
													aria-label={`Select ${holidayInstance.name}`}
													onChange={() => handleHolidayInstanceSelect(holidayInstance.id)}
													style={hiddenCheckboxStyle} />
												<span style={checkboxSquareStyle}>
													{selected ? 'X' : ''}
												</span>
											</Label>
										</td>
									</tr>
								);
							})}
						</tbody>
					</Table>
				</div>
			) : (
				<Alert style={emptyHolidayStyle}>
					<FormattedMessage
						id='holiday.no.instances'
						defaultMessage='No holiday instances available.' />
				</Alert>
			)}

			{/* Pagination */}
			{!showAllHolidays && holidayInstances.length > 0 && (
				<Pagination aria-label='Holiday instance pagination' style={{justifyContent: 'center', margin: '1% auto'}}>
					<PaginationItem disabled={currentPage === 1}>
						<PaginationLink onClick={() => setCurrentPage(1)}>
							{'<<'}
						</PaginationLink>
					</PaginationItem>
					<PaginationItem disabled={currentPage === 1}>
						<PaginationLink onClick={() => setCurrentPage(currentPage - 1)}>
							{'<'}
						</PaginationLink>
					</PaginationItem>
					{Array.from({ length: totalPages }, (_, index) => (
						<PaginationItem key={index + 1} active={currentPage === index + 1}>
							<PaginationLink onClick={() => setCurrentPage(index + 1)}>
								{index + 1}
							</PaginationLink>
						</PaginationItem>
					))}
					<PaginationItem disabled={currentPage === totalPages}>
						<PaginationLink onClick={() => setCurrentPage(currentPage + 1)}>
							{'>'}
						</PaginationLink>
					</PaginationItem>
					<PaginationItem disabled={currentPage === totalPages}>
						<PaginationLink onClick={() => setCurrentPage(totalPages)}>
							{'>>'}
						</PaginationLink>
					</PaginationItem>
				</Pagination>
			)}

			{/* Action buttons for showing all holiday instances and creating holiday instance groups */}
			{holidayInstances.length > 0 && (
				<div style={actionContainerStyle}>
					<Button
						color='secondary'
						outline
						onClick={() => {
							setShowAllHolidays(!showAllHolidays);
							setCurrentPage(1);
						}}
						style={wideOutlineButtonStyle}>
						{showAllHolidays ? (
							<FormattedMessage id='show.in.pages' defaultMessage='Show in pages' />
						) : (
							<FormattedMessage
								id='show.all.holidays'
								defaultMessage='Show all holidays ({count})'
								values={{ count: holidayInstances.length }} />
						)}
					</Button>
					<Button
						color='secondary'
						outline
						disabled={selectedHolidayInstanceIdsForGroup.length === 0}
						onClick={handleCreateHolidayInstanceGroup}
						style={wideOutlineButtonStyle}>
						<FormattedMessage
							id='holiday.instance.group.create'
							defaultMessage='Create Holiday Instance Group' />
					</Button>
				</div>
			)}

			{/* Modal for displaying full holiday note */}
			<Modal isOpen={modalOpen} toggle={() => setModalOpen(false)}>
				<ModalHeader toggle={() => setModalOpen(false)}>
					{modelHeader}
				</ModalHeader>
				<ModalBody>
					{modalHolidayNote}
				</ModalBody>
			</Modal>
		</div>
	);
}

const pageStyle: React.CSSProperties = {
	padding: '4rem 0 2rem',
	width: '100%'
};

const holidayTitleStyle: React.CSSProperties = {
	...titleStyle,
	color: '#111',
	fontSize: '2.75rem',
	fontWeight: 400,
	margin: '0 0 1.35rem',
	textAlign: 'center'
};

const holidayFilterStyle: React.CSSProperties = {
	alignItems: 'flex-end',
	display: 'flex',
	flexWrap: 'wrap',
	gap: '2rem',
	justifyContent: 'center',
	margin: '0 auto 2rem'
};

const holidayLimitGroupStyle: React.CSSProperties = {
	margin: 0,
	width: '21rem'
};

const tableWrapStyle: React.CSSProperties = {
	margin: '0 auto',
	width: '92%'
};

const tableStyle: React.CSSProperties = {
	width: '90%',
	margin: '1% auto'
};

const bodyStyle: React.CSSProperties = {
	textAlign: 'left'
};

const checkboxLabelStyle: React.CSSProperties = {
	alignItems: 'center',
	cursor: 'pointer',
	display: 'inline-flex',
	justifyContent: 'center',
	margin: 0,
	minHeight: '1.35rem',
	minWidth: '1.35rem',
	position: 'relative'
};

const hiddenCheckboxStyle: React.CSSProperties = {
	height: '1px',
	opacity: 0,
	position: 'absolute',
	width: '1px'
};

const checkboxSquareStyle: React.CSSProperties = {
	alignItems: 'center',
	border: '1px solid #222',
	color: '#111',
	display: 'inline-flex',
	fontSize: '1.05rem',
	height: '1.25rem',
	justifyContent: 'center',
	lineHeight: 1,
	width: '1.25rem'
};

const actionContainerStyle: React.CSSProperties = {
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	gap: '1.25rem'
};

const outlineButtonStyle: React.CSSProperties = {
	border: '1px solid #222',
	borderRadius: 0,
	color: '#111',
	fontSize: '1rem',
	height: '2.05rem',
	minWidth: '7.2rem'
};

const wideOutlineButtonStyle: React.CSSProperties = {
	...outlineButtonStyle,
	fontSize: '1.45rem',
	height: '2.4rem',
	maxWidth: '90%',
	width: '37rem'
};

const emptyHolidayStyle: React.CSSProperties = {
	margin: '2rem auto',
	maxWidth: '40rem',
	textAlign: 'center'
};
