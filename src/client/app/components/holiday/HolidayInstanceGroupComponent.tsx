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
	const totalPages = Math.max(1, Math.ceil(holidayInstances.length / displayLimit));
	const paginatedHolidayInstances = showAllHolidays
		? holidayInstances
		: holidayInstances.slice((currentPage - 1) * displayLimit, currentPage * displayLimit);
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
			<h1 style={titleStyle}>
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
					color='primary'
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
											<Label check style={{ display: 'flex', justifyContent: 'center', margin: 0 }}>
												<Input
													type='checkbox'
													checked={selected}
													aria-label={`Select ${holidayInstance.name}`}
													onChange={() => handleHolidayInstanceSelect(holidayInstance.id)}
												/>
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
						<PaginationLink first onClick={() => setCurrentPage(1)} />
					</PaginationItem><PaginationItem disabled={currentPage === 1}>
						<PaginationLink previous onClick={() => setCurrentPage(currentPage - 1)} />
					</PaginationItem>

					{Array.from({ length: totalPages }, (_, index) => (
						<PaginationItem key={index + 1} active={currentPage === index + 1}>
							<PaginationLink onClick={() => setCurrentPage(index + 1)}>
								{index + 1}
							</PaginationLink>
						</PaginationItem>
					))}

					<PaginationItem disabled={currentPage === totalPages}>
						<PaginationLink next onClick={() => setCurrentPage(currentPage + 1)} />
					</PaginationItem><PaginationItem disabled={currentPage === totalPages}>
						<PaginationLink last onClick={() => setCurrentPage(totalPages)} />
					</PaginationItem>
				</Pagination>
			)}

			{/* Action buttons for showing all holiday instances and creating holiday instance groups */}
			{holidayInstances.length > 0 && (
				<div style={actionContainerStyle}>
					<Button
						color='primary'
						onClick={() => {
							setShowAllHolidays(!showAllHolidays);
							setCurrentPage(1);
						}}
						style={{ margin: '0% 40% 1%' }}>
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
						color='primary'
						disabled={selectedHolidayInstanceIdsForGroup.length === 0}
						onClick={handleCreateHolidayInstanceGroup}
						style={{ margin: '0% 40% 1%'}}>
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

const holidayFilterStyle: React.CSSProperties = {
	display: 'flex',
	justifyContent: 'center',
	gap: '1.5%',
	alignItems: 'center',
	margin: 'auto 25%',
	padding: '20px',
	border: '2px solid lightgrey'
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

const actionContainerStyle: React.CSSProperties = {
	alignItems: 'center',
	display: 'flex',
	flexDirection: 'column',
	gap: '1.25rem'
};

const emptyHolidayStyle: React.CSSProperties = {
	margin: '2rem auto',
	maxWidth: '40rem',
	textAlign: 'center'
};
