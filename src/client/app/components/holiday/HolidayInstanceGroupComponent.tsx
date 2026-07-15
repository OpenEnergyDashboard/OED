/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import {
	Alert, Button, FormFeedback, FormGroup, Input, Label,
	Pagination, PaginationItem, PaginationLink, Table, Modal, ModalHeader, ModalBody, ModalFooter
} from 'reactstrap';
import { titleStyle } from '../../styles/modalStyle';
import { HolidayInstance } from 'types/redux/holiday';
import { testHolidayInstances } from './holidayInstanceTestData'; // For testing purposes, remove this import in production
import CreateHolidayInstanceGroupModalComponent from './CreateHolidayInstanceGroupModalComponent';


// interface HolidayInstanceGroup {
// 	id: number;
// 	holidayInstanceIds: number[];
// }

// interface HolidayInstanceGroupComponentProps {
// 	holidayInstances?: HolidayInstance[];
// 	holidayInstanceGroups?: HolidayInstanceGroup[];
// 	handleUpdateHolidayLimit?: (holidayLimit: number) => void;
// 	handleCreateHolidayInstanceGroup?: (holidayInstanceIds: number[]) => void;
// 	handleUpdateHolidayInstanceGroup?: (holidayInstanceGroupId: number, holidayInstanceIds: number[]) => void;
// 	handleDeleteHolidayInstanceGroup?: (holidayInstanceGroupId: number) => void;
// }

// /**
//  * Defines the holiday instance group selection page.
//  * @param props Holiday instance data and optional action handlers
//  * @returns Holiday instance group page element
//  */
// export default function HolidayInstanceGroupComponent(props: HolidayInstanceGroupComponentProps) {
// 	const holidayInstances = props.holidayInstances ?? testHolidayInstances;
// 	const [holidayLimitText, setHolidayLimitText] = React.useState(PER_PAGE.toString());
// 	const [displayLimit, setDisplayLimit] = React.useState(PER_PAGE);
// 	const [currentPage, setCurrentPage] = React.useState(1);
// 	const [showAllHolidays, setShowAllHolidays] = React.useState(false);
// 	const [selectedHolidayInstanceIds, setSelectedHolidayInstanceIds] = React.useState<number[]>([]);
// 	const [createdHolidayInstanceGroups, setCreatedHolidayInstanceGroups] = React.useState<HolidayInstanceGroup[]>([]);
// 	const [selectedHolidayInstanceGroupId, setSelectedHolidayInstanceGroupId] = React.useState('');
// 	const [selectedHolidayInstanceGroupHolidayIds, setSelectedHolidayInstanceGroupHolidayIds] = React.useState<number[]>([]);
// 	const [deleteHolidayInstanceGroupModalOpen, setDeleteHolidayInstanceGroupModalOpen] = React.useState(false);
// 	const holidayLimit = Number(holidayLimitText);
// 	// Modal state for displaying full log message
// 	const [modalOpen, setModalOpen] = React.useState(false);
// 	// holiday name to display in the modal header
// 	const [modelHeader, setModelHeader] = React.useState('');
// 	// Holiday note to display in the modal
// 	const [modalHolidayNote, setModalHolidayNote] = React.useState('');
// 	const holidayLimitInvalid = holidayLimitText.trim() === ''
// 		|| !Number.isInteger(holidayLimit)
// 		|| holidayLimit < 1;
// 	const holidayInstanceGroups = props.holidayInstanceGroups ?? createdHolidayInstanceGroups;
// 	const selectedHolidayInstanceGroup = holidayInstanceGroups.find(holidayInstanceGroup =>
// 		holidayInstanceGroup.id.toString() === selectedHolidayInstanceGroupId);
// 	const viewingHolidayInstanceGroup = selectedHolidayInstanceGroup !== undefined;
// 	const tableHolidayInstances = viewingHolidayInstanceGroup
// 		? holidayInstances.filter(holidayInstance =>
// 			selectedHolidayInstanceGroupHolidayIds.includes(holidayInstance.id))
// 		: holidayInstances;
// 	const totalPages = Math.max(1, Math.ceil(tableHolidayInstances.length / displayLimit));
// 	const paginatedHolidayInstances = showAllHolidays
// 		? tableHolidayInstances
// 		: tableHolidayInstances.slice((currentPage - 1) * displayLimit, currentPage * displayLimit);
// 	const selectedHolidayInstanceIdsForGroup = holidayInstances
// 		.filter(holidayInstance => selectedHolidayInstanceIds.includes(holidayInstance.id))
// 		.map(holidayInstance => holidayInstance.id);

// 	React.useEffect(() => {
// 		if (currentPage > totalPages) {
// 			setCurrentPage(totalPages);
// 		}
// 	}, [currentPage, totalPages]);

// 	const handleUpdateHolidayLimit = () => {
// 		if (holidayLimitInvalid) {
// 			return;
// 		}

// 		setDisplayLimit(holidayLimit);
// 		setCurrentPage(1);
// 		setShowAllHolidays(false);
// 		props.handleUpdateHolidayLimit?.(holidayLimit);
// 	};

// 	const handleHolidayInstanceGroupChange = (holidayInstanceGroupId: string) => {
// 		const nextHolidayInstanceGroup = holidayInstanceGroups.find(holidayInstanceGroup =>
// 			holidayInstanceGroup.id.toString() === holidayInstanceGroupId);

// 		setSelectedHolidayInstanceGroupId(holidayInstanceGroupId);
// 		setSelectedHolidayInstanceGroupHolidayIds(nextHolidayInstanceGroup?.holidayInstanceIds ?? []);
// 		setSelectedHolidayInstanceIds([]);
// 		setCurrentPage(1);
// 		setShowAllHolidays(false);
// 	};

// 	const handleCreateNewHolidayInstanceGroup = () => {
// 		setSelectedHolidayInstanceGroupId('');
// 		setSelectedHolidayInstanceGroupHolidayIds([]);
// 		setSelectedHolidayInstanceIds([]);
// 		setCurrentPage(1);
// 		setShowAllHolidays(false);
// 	};

// 	//open modal to show full holiday name and note
// 	const handleHolidayNoteModal = (holidayName: string, holidayNote: string) => {
// 		setModelHeader(holidayName);
// 		setModalHolidayNote(holidayNote);
// 		setModalOpen(true);
// 	};

// 	const handleHolidayInstanceSelect = (holidayInstanceId: number) => {
// 		setSelectedHolidayInstanceIds(currentIds => currentIds.includes(holidayInstanceId)
// 			? currentIds.filter(id => id !== holidayInstanceId)
// 			: [...currentIds, holidayInstanceId]);
// 	};

// 	const handleRemoveHolidayInstanceFromGroup = (holidayInstanceId: number) => {
// 		setSelectedHolidayInstanceGroupHolidayIds(currentIds =>
// 			currentIds.filter(id => id !== holidayInstanceId));
// 	};

// 	const handleSaveHolidayInstanceGroupChanges = () => {
// 		if (selectedHolidayInstanceGroup === undefined) {
// 			return;
// 		}

// 		props.handleUpdateHolidayInstanceGroup?.(
// 			selectedHolidayInstanceGroup.id,
// 			selectedHolidayInstanceGroupHolidayIds
// 		);

// 		if (props.holidayInstanceGroups === undefined) {
// 			setCreatedHolidayInstanceGroups(currentGroups => currentGroups.map(group =>
// 				group.id === selectedHolidayInstanceGroup.id
// 					? { ...group, holidayInstanceIds: selectedHolidayInstanceGroupHolidayIds }
// 					: group));
// 		}
// 	};

// 	const handleDeleteHolidayInstanceGroup = () => {
// 		if (selectedHolidayInstanceGroup === undefined) {
// 			return;
// 		}

// 		props.handleDeleteHolidayInstanceGroup?.(selectedHolidayInstanceGroup.id);

// 		if (props.holidayInstanceGroups === undefined) {
// 			setCreatedHolidayInstanceGroups(currentGroups =>
// 				currentGroups.filter(group => group.id !== selectedHolidayInstanceGroup.id));
// 		}

// 		setDeleteHolidayInstanceGroupModalOpen(false);
// 		setSelectedHolidayInstanceGroupId('');
// 		setSelectedHolidayInstanceGroupHolidayIds([]);
// 		setCurrentPage(1);
// 		setShowAllHolidays(false);
// 	};

// 	const handleCreateHolidayInstanceGroup = () => {
// 		if (selectedHolidayInstanceIdsForGroup.length === 0) {
// 			return;
// 		}

// 		props.handleCreateHolidayInstanceGroup?.(selectedHolidayInstanceIdsForGroup);

// 		if (props.holidayInstanceGroups === undefined) {
// 			setCreatedHolidayInstanceGroups(currentGroups => {
// 				const nextHolidayInstanceGroupId = Math.max(0, ...currentGroups.map(group => group.id)) + 1;

// 				return [
// 					...currentGroups,
// 					{
// 						id: nextHolidayInstanceGroupId,
// 						holidayInstanceIds: selectedHolidayInstanceIdsForGroup
// 					}
// 				];
// 			});
// 		}

// 		setSelectedHolidayInstanceIds([]);
// 	};

// 	return (
// 		<div className='flexGrowOne' style={pageStyle}>
// 			<h1 style={titleStyle}>
// 				<FormattedMessage id='holiday.instance.group' defaultMessage='Holiday Instance Group' />
// 			</h1>

// 			<div style={holidayFilterStyle}>
// 				<FormGroup style={holidayInstanceGroupSelectStyle}>
// 					<Label for='holidayInstanceGroup' style={{fontWeight: 'bold', margin: '0'}}>
// 						<FormattedMessage
// 							id='holiday.instance.group.previous'
// 							defaultMessage='Previous holiday instance group' />
// 					</Label>
// 					<Input
// 						id='holidayInstanceGroup'
// 						name='holidayInstanceGroup'
// 						type='select'
// 						value={selectedHolidayInstanceGroupId}
// 						onChange={e => handleHolidayInstanceGroupChange(e.target.value)}
// 					>
// 						<option value=''>
// 							Select previous group
// 						</option>
// 						{holidayInstanceGroups.map(holidayInstanceGroup => (
// 							<option
// 								key={holidayInstanceGroup.id}
// 								value={holidayInstanceGroup.id}
// 							>
// 								{`Holiday Instance Group ${holidayInstanceGroup.id}`}
// 							</option>
// 						))}
// 					</Input>
// 				</FormGroup>
// 				<Button
// 					color='primary'
// 					onClick={handleCreateNewHolidayInstanceGroup}
// 				>
// 					<FormattedMessage
// 						id='holiday.instance.group.create.new'
// 						defaultMessage='Create new Holiday instance group' />
// 				</Button>
// 				<FormGroup style={holidayLimitGroupStyle}>
// 					<Label for='holidayLimit' style={{fontWeight: 'bold', margin: '0'}}>
// 						<FormattedMessage
// 							id='holiday.number.display'
// 							defaultMessage='Number of holidays to display' />
// 					</Label>
// 					<Input
// 						id='holidayLimit'
// 						name='holidayLimit'
// 						type='number'
// 						min={1}
// 						inputMode='numeric'
// 						value={holidayLimitText}
// 						invalid={holidayLimitInvalid}
// 						onChange={e => setHolidayLimitText(e.target.value)}
// 					/>
// 					<FormFeedback>
// 						<FormattedMessage
// 							id='holiday.limit.required'
// 							defaultMessage='Enter at least 1 holiday.' />
// 					</FormFeedback>
// 				</FormGroup>
// 				<Button
// 					color='primary'
// 					disabled={holidayLimitInvalid}
// 					onClick={handleUpdateHolidayLimit}
// 				>
// 					<FormattedMessage id='update' defaultMessage='Update' />
// 				</Button>
// 			</div>

// 			{/* Display holiday instances table */}
// 			{tableHolidayInstances.length > 0 ? (
// 				<div style={tableWrapStyle}>
// 					<Table bordered style={tableStyle}>
// 						<thead>
// 							<tr>
// 								<th>
// 									<FormattedMessage id='holiday.instance' defaultMessage='Holiday Instance' />
// 								</th>
// 								<th>
// 									<FormattedMessage id='note' defaultMessage='Note' />
// 								</th>
// 								<th>
// 									{viewingHolidayInstanceGroup ? (
// 										<FormattedMessage id='remove' defaultMessage='Remove' />
// 									) : (
// 										<FormattedMessage id='select' defaultMessage='Select' />
// 									)}
// 								</th>
// 							</tr>
// 						</thead>
// 						<tbody style={bodyStyle}>
// 							{paginatedHolidayInstances.map(holidayInstance => {
// 								const selected = selectedHolidayInstanceIds.includes(holidayInstance.id);

// 								return (
// 									<tr key={holidayInstance.id}>
// 										<td>
// 											{holidayInstance.name}
// 										</td>
// 										<td style={{ cursor: 'pointer' }}
// 											onClick={() => handleHolidayNoteModal(holidayInstance.name, holidayInstance.note)}
// 										>
// 											{holidayInstance.note.length > 80 ? `${holidayInstance.note.slice(0, 80)}...` : holidayInstance.note}
// 										</td>
// 										{viewingHolidayInstanceGroup ? (
// 											<td>
// 												<Button
// 													color='danger'
// 													onClick={() => handleRemoveHolidayInstanceFromGroup(holidayInstance.id)}
// 												>
// 													<FormattedMessage id='remove' defaultMessage='Remove' />
// 												</Button>
// 											</td>
// 										) : (
// 											<td>
// 												<Label check style={{ display: 'flex', justifyContent: 'center', margin: 0 }}>
// 													<Input
// 														type='checkbox'
// 														checked={selected}
// 														aria-label={`Select ${holidayInstance.name}`}
// 														onChange={() => handleHolidayInstanceSelect(holidayInstance.id)}
// 													/>
// 												</Label>
// 											</td>
// 										)}
// 									</tr>
// 								);
// 							})}
// 						</tbody>
// 					</Table>
// 				</div>
// 			) : (
// 				<Alert style={emptyHolidayStyle}>
// 					<FormattedMessage
// 						id='holiday.no.instances'
// 						defaultMessage='No holiday instances available.' />
// 				</Alert>
// 			)}

// 			{/* Pagination */}
// 			{!showAllHolidays && tableHolidayInstances.length > 0 && (
// 				<Pagination aria-label='Holiday instance pagination' style={{justifyContent: 'center', margin: '1% auto'}}>
// 					<PaginationItem disabled={currentPage === 1}>
// 						<PaginationLink first onClick={() => setCurrentPage(1)} />
// 					</PaginationItem><PaginationItem disabled={currentPage === 1}>
// 						<PaginationLink previous onClick={() => setCurrentPage(currentPage - 1)} />
// 					</PaginationItem>

// 					{Array.from({ length: totalPages }, (_, index) => (
// 						<PaginationItem key={index + 1} active={currentPage === index + 1}>
// 							<PaginationLink onClick={() => setCurrentPage(index + 1)}>
// 								{index + 1}
// 							</PaginationLink>
// 						</PaginationItem>
// 					))}

// 					<PaginationItem disabled={currentPage === totalPages}>
// 						<PaginationLink next onClick={() => setCurrentPage(currentPage + 1)} />
// 					</PaginationItem><PaginationItem disabled={currentPage === totalPages}>
// 						<PaginationLink last onClick={() => setCurrentPage(totalPages)} />
// 					</PaginationItem>
// 				</Pagination>
// 			)}

// 			{/* Action buttons for showing all holiday instances and creating holiday instance groups */}
// 			{(tableHolidayInstances.length > 0 || viewingHolidayInstanceGroup) && (
// 				<div style={actionContainerStyle}>
// 					{tableHolidayInstances.length > 0 && (
// 						<Button
// 							color='primary'
// 							onClick={() => {
// 								setShowAllHolidays(!showAllHolidays);
// 								setCurrentPage(1);
// 							}}
// 							style={{ margin: '0% 40% 1%' }}>
// 							{showAllHolidays ? (
// 								<FormattedMessage id='show.in.pages' defaultMessage='Show in pages' />
// 							) : (
// 								<FormattedMessage
// 									id='show.all.holidays'
// 									defaultMessage='Show all holidays ({count})'
// 									values={{ count: tableHolidayInstances.length }} />
// 							)}
// 						</Button>
// 					)}
// 					{!viewingHolidayInstanceGroup && (
// 						<Button
// 							color='primary'
// 							disabled={selectedHolidayInstanceIdsForGroup.length === 0}
// 							onClick={handleCreateHolidayInstanceGroup}
// 							style={{ margin: '0% 40% 1%'}}>
// 							<FormattedMessage
// 								id='holiday.instance.group.create'
// 								defaultMessage='Create Holiday Instance Group' />
// 						</Button>
// 					)}
// 					{viewingHolidayInstanceGroup && (
// 						<div style={holidayInstanceGroupActionStyle}>
// 							<Button
// 								color='primary'
// 								onClick={handleSaveHolidayInstanceGroupChanges}>
// 								<FormattedMessage
// 									id='save.changes'
// 									defaultMessage='Save changes' />
// 							</Button>
// 							<Button
// 								color='danger'
// 								onClick={() => setDeleteHolidayInstanceGroupModalOpen(true)}>
// 								<FormattedMessage
// 									id='delete'
// 									defaultMessage='Delete' />
// 							</Button>
// 						</div>
// 					)}
// 				</div>
// 			)}

// 			{/* Modal for displaying full holiday note */}
// 			<Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} centered>
// 				<ModalHeader toggle={() => setModalOpen(false)}>
// 					{modelHeader}
// 				</ModalHeader>
// 				<ModalBody>
// 					{modalHolidayNote}
// 				</ModalBody>
// 			</Modal>

// 			<Modal
// 				isOpen={deleteHolidayInstanceGroupModalOpen}
// 				toggle={() => setDeleteHolidayInstanceGroupModalOpen(false)}
// 				centered>
// 				<ModalHeader toggle={() => setDeleteHolidayInstanceGroupModalOpen(false)}>
// 					<FormattedMessage
// 						id='holiday.instance.group.delete'
// 						defaultMessage='Delete Holiday Instance Group {id}'
// 						values={{ id: selectedHolidayInstanceGroup?.id }} />
// 				</ModalHeader>
// 				<ModalBody>
// 					<FormattedMessage
// 						id='holiday.instance.group.delete.confirm'
// 						defaultMessage='Are you sure you want to delete this holiday instance group?' />
// 				</ModalBody>
// 				<ModalFooter>
// 					<Button
// 						color='secondary'
// 						onClick={() => setDeleteHolidayInstanceGroupModalOpen(false)}>
// 						<FormattedMessage id='cancel' defaultMessage='Cancel' />
// 					</Button>
// 					<Button
// 						color='danger'
// 						onClick={handleDeleteHolidayInstanceGroup}>
// 						<FormattedMessage id='delete' defaultMessage='Delete' />
// 					</Button>
// 				</ModalFooter>
// 			</Modal>
// 		</div>
// 	);
// }

// const pageStyle: React.CSSProperties = {
// 	padding: '4rem 0 2rem',
// 	width: '100%'
// };

// const holidayFilterStyle: React.CSSProperties = {
// 	display: 'flex',
// 	justifyContent: 'center',
// 	flexWrap: 'wrap',
// 	gap: '1.5%',
// 	alignItems: 'center',
// 	margin: 'auto',
// 	width: '92%',
// 	maxWidth: '72rem',
// 	padding: '20px',
// 	border: '2px solid lightgrey'
// };

// const holidayInstanceGroupSelectStyle: React.CSSProperties = {
// 	margin: 0,
// 	width: '18rem'
// };

// const holidayLimitGroupStyle: React.CSSProperties = {
// 	margin: 0,
// 	width: '21rem'
// };

// const tableWrapStyle: React.CSSProperties = {
// 	margin: '0 auto',
// 	width: '92%'
// };

// const tableStyle: React.CSSProperties = {
// 	width: '90%',
// 	margin: '1% auto'
// };

// const bodyStyle: React.CSSProperties = {
// 	textAlign: 'left'
// };

// const actionContainerStyle: React.CSSProperties = {
// 	alignItems: 'center',
// 	display: 'flex',
// 	flexDirection: 'column',
// 	gap: '1.25rem'
// };

// const holidayInstanceGroupActionStyle: React.CSSProperties = {
// 	display: 'flex',
// 	gap: '1rem',
// 	justifyContent: 'center',
// 	margin: '0% 40% 1%'
// };

// const emptyHolidayStyle: React.CSSProperties = {
// 	margin: '2rem auto',
// 	maxWidth: '40rem',
// 	textAlign: 'center'
// };
interface HolidayInstanceGroupComponentProps {
	holidayInstances?: HolidayInstance[];
	handleCreateHolidayInstanceGroup?: (holidayInstanceIds: number[], note?: string) => void;
}

/**
 * Defines the holiday instance group page.
 * @param props Available holiday instances and the create handler.
 * @returns Holiday instance group page element.
 */
export default function HolidayInstanceGroupComponent(props: HolidayInstanceGroupComponentProps) {
	return (
		<div className='flexGrowOne'>
			<div className='container-fluid'>
				<h2 style={titleStyle}>
					<FormattedMessage
						id='holiday.instance.group'
						defaultMessage='Holiday Instance Group'
					/>
				</h2>
				<div className='edit-btn'>
					<CreateHolidayInstanceGroupModalComponent
						holidayInstances={props.holidayInstances ?? testHolidayInstances}
						onCreateHolidayInstanceGroup={(holidayInstanceIds, note) =>
							props.handleCreateHolidayInstanceGroup?.(holidayInstanceIds, note)}
					/>
				</div>
			</div>
		</div>
	);
}