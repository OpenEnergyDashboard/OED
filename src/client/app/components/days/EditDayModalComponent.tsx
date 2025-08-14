/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import {
	Button,
	Container, FormFeedback,
	FormGroup, Input, Label, Modal, ModalBody, ModalFooter,
	ModalHeader, Pagination, PaginationItem, PaginationLink,
	Table
} from 'reactstrap';
import { Day, DaySegment } from 'types/redux/days';
import { daysApi } from '../../redux/api/daysApi';
import { daySegmentsApi } from '../../redux/api/daySegmentsApi';
import { useTranslate } from '../../redux/componentHooks';
import { tooltipBaseStyle } from '../../styles/modalStyle';
import { LocaleDataKey } from '../../translations/data';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import ConfirmActionModalComponent from '../ConfirmActionModalComponent';
import TooltipHelpComponent from '../TooltipHelpComponent';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import DeleteDaySegmentComponent from './DeleteDaySegmentComponent';
import EditDaySegmentModalComponent from './EditDaySegmentModalComponent';
import SplitDaySegmentComponent from './SplitDaySegmentComponent';

export interface EditDayModalComponentProps {
	/**
	 * Whether the modal is visible or not
	 */
	show: boolean;
	/**
	 * The day to edit
	 */
	day: Day;
	/**
	 * Function to run when edit modal closes
	 */
	handleClose: () => void;
}

/**
 * Defines a modal that allows editing of an existing day and its segments, with options to edit, split, and delete them.
 * @param props The properties for the component
 * @returns Day edit element
 */
export default function EditDayModalComponent(props: EditDayModalComponentProps) {
	const PER_PAGE = 10;

	const translate = useTranslate();

	const [dayDetails, setDayDetails] = React.useState({ ...props.day });

	const { data: daySegments = [] } = daySegmentsApi.useGetDaySegmentsByDayIdQuery(props.day.id);

	// Fetch days data (used to check if day name already exists)
	const { data: days } = daysApi.useGetDaysQuery();

	const [editDayMutation, { isLoading: isSaving }] = daysApi.useEditDayMutation();

	const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setDayDetails({ ...dayDetails, [e.target.name]: e.target.value });
	};

	const handleSubmit = () => {
		props.handleClose();
		editDayMutation(dayDetails).unwrap()
			.then(() => {
				showSuccessNotification(translate('day.edit.success'));
			}).catch(error => {
				showErrorNotification(`${translate('day.edit.error')} ${error}`);
			});
	};

	// Pagination
	const [page, setPage] = React.useState(1);
	const totalPages = Math.ceil(daySegments.length / PER_PAGE);
	const paged = daySegments.slice((page - 1) * PER_PAGE, page * PER_PAGE);

	// State to hold validation message for day name
	// This is used to show an error message if the day name is invalid
	const [nameValidationMessageId, setNameValidationMessageId] = React.useState<LocaleDataKey | null>(null);

	// Validate the day name to ensure it is not empty and does not already exist
	const isNameValid = React.useMemo(() => {
		if (dayDetails.name === '') {
			setNameValidationMessageId('day.create.name.required');
			return false;
		}
		if (days?.some(day => day.name.toLowerCase() === dayDetails.name.toLowerCase() && day.id !== dayDetails.id)) {
			setNameValidationMessageId('day.create.name.exists');
			return false;
		}

		setNameValidationMessageId(null);
		return true;
	}, [dayDetails]);

	const isDayUnchanged = React.useMemo(() => {
		return props.day.name === dayDetails.name && props.day.note === dayDetails.note;
	}, [props.day, dayDetails]);

	// State to hold the modal for editing a day segment
	const [showEditSegmentModal, setShowEditSegmentModal] = React.useState(false);
	const [editSegment, setEditSegment] = React.useState<DaySegment | null>(null);

	// Function to open the edit segment modal
	const handleShowEditSegmentModal = (segment: DaySegment) => {
		setEditSegment(segment);
		setShowEditSegmentModal(true);
	};
	// Function to close the edit segment modal
	const handleCloseEditSegmentModal = () => {
		setShowEditSegmentModal(false);
		setEditSegment(null);
	};

	// State to hold the segment for showing segment notes in a modal
	const [noteSegment, setNoteSegment] = React.useState<DaySegment | null>(null);
	// The note modal is shown when a segment note is clicked
	const showNoteModal = Boolean(noteSegment);
	const handleShowNoteModal = (segment: DaySegment) => {
		setNoteSegment(segment);
	};
	const handleCloseNoteModal = () => {
		setNoteSegment(null);
	};

	// Delete day confirmation modal
	const [showDeleteModal, setShowDeleteModal] = React.useState(false);
	const [deleteDayMutation, { isLoading: isDeleting }] = daysApi.useDeleteDayMutation();

	// Function to handle deleting the day
	const handleDeleteDay = () => {
		setShowDeleteModal(false);
		deleteDayMutation({ id: dayDetails.id }).unwrap()
			.then(() => {
				showSuccessNotification(translate('day.delete.success'));
				props.handleClose();
			})
			.catch(error => {
				showErrorNotification(`${translate('day.delete.error')} ${error}`);
			});
	};

	return (
		<>
			<Modal isOpen={props.show} toggle={props.handleClose} size="xl">
				<ModalHeader>
					<FormattedMessage id="day.edit" />
					<TooltipHelpComponent page="day-edit" />
					<div style={tooltipBaseStyle}>
						<TooltipMarkerComponent page="day-edit" helpTextId="help.admin.dayedit" />
					</div>
				</ModalHeader>

				<ModalBody>
					<Container>
						{/* Name */}
						<FormGroup>
							<Label for="name">{translate('name')}</Label>
							<Input id="name" name="name" required value={dayDetails.name} onChange={handleStringChange} invalid={!isNameValid} />
							<FormFeedback>
								{nameValidationMessageId && <FormattedMessage id={nameValidationMessageId as string} />}
							</FormFeedback>
						</FormGroup>
						{/* Note */}
						<FormGroup>
							<Label for="note">{translate('note')}</Label>
							<Input id="note" name="note" type="textarea" value={dayDetails.note} onChange={handleStringChange} />
						</FormGroup>

						<hr />
						{/* Table */}
						<h5 className="mt-3 mb-2"><FormattedMessage id="day.segments.table.title" /></h5>
						<Table striped bordered>
							<thead>
								<tr>
									<th><FormattedMessage id="day.segments.table.timeRange" /></th>
									<th><FormattedMessage id="slope" /></th>
									<th><FormattedMessage id="intercept" /></th>
									<th><FormattedMessage id="note" /></th>
									<th><FormattedMessage id="edit" /></th>
									<th><FormattedMessage id="split.earlier" /></th>
									<th><FormattedMessage id="split.later" /></th>
									<th><FormattedMessage id="delete.earlier" /></th>
									<th><FormattedMessage id="delete.later" /></th>
								</tr>
							</thead>
							<tbody>
								{paged?.map(seg => (
									<tr key={seg.id}>
										<td>{seg.startHour} - {seg.endHour}</td>
										<td>{seg.slope}</td>
										<td>{seg.intercept}</td>
										<td
											style={{ cursor: 'pointer' }}
											onClick={() => handleShowNoteModal(seg)}
											aria-label={seg.note}
										>
											{(seg.note ?? '').length > 30 ? `${seg.note?.slice(0, 30)} ...` : seg.note || ''}
										</td>
										<td>
											<Button color="secondary" size="sm" onClick={() => handleShowEditSegmentModal(seg)}>
												<FormattedMessage id="edit" />
											</Button>
										</td>
										<td>
											{/* only show split buttons if segment is longer than 1 hour */}
											{seg.endHour - seg.startHour > 1 && <SplitDaySegmentComponent daySegment={seg} direction="earlier" />}
										</td>
										<td>
											{seg.endHour - seg.startHour > 1 && <SplitDaySegmentComponent daySegment={seg} direction="later" />}
										</td>
										<td>
											{/* first segment cannot delete earlier */}
											{seg.startHour > 0 &&
												<DeleteDaySegmentComponent daySegment={seg} direction="earlier" />
											}
										</td>
										<td>
											{/* last segment cannot delete later */}
											{seg.endHour < 24 &&
												<DeleteDaySegmentComponent daySegment={seg} direction="later" />
											}
										</td>
									</tr>
								))}
							</tbody>
						</Table>

						{/* Pagination */}
						{daySegments && daySegments.length > PER_PAGE && (
							<Pagination style={{ justifyContent: 'center' }}>
								<PaginationItem disabled={page === 1}>
									<PaginationLink first onClick={() => setPage(1)} />
								</PaginationItem>
								<PaginationItem disabled={page === 1}>
									<PaginationLink previous onClick={() => setPage(p => p - 1)} />
								</PaginationItem>
								{Array.from({ length: totalPages }, (_, i) => (
									<PaginationItem key={i} active={page === i + 1}>
										<PaginationLink onClick={() => setPage(i + 1)}>{i + 1}</PaginationLink>
									</PaginationItem>
								))}
								<PaginationItem disabled={page === totalPages}>
									<PaginationLink next onClick={() => setPage(p => p + 1)} />
								</PaginationItem>
								<PaginationItem disabled={page === totalPages}>
									<PaginationLink last onClick={() => setPage(totalPages)} />
								</PaginationItem>
							</Pagination>
						)}
					</Container>
				</ModalBody>

				<ModalFooter>
					{/* Delete day */}
					<Button color="danger" onClick={() => setShowDeleteModal(true)} disabled={isSaving || isDeleting}>
						{translate('day.delete.button')}
					</Button>
					<Button color="secondary" onClick={props.handleClose}>
						<FormattedMessage id="day.edit.discard" />
					</Button>
					<Button color="primary" onClick={handleSubmit} disabled={isDayUnchanged || !isNameValid || isSaving || isDeleting}>
						<FormattedMessage id="day.edit.save" />
					</Button>
				</ModalFooter>

				{/* Delete confirmation modal */}
				<ConfirmActionModalComponent
					show={showDeleteModal}
					actionConfirmMessage={translate('day.delete.confirm')}
					actionFunction={handleDeleteDay}
					handleClose={() => setShowDeleteModal(false)}
					actionConfirmText={translate('day.delete.button')}
					actionRejectText={translate('cancel')}
				/>

				{/* Segment note modal */}
				<Modal isOpen={showNoteModal} toggle={handleCloseNoteModal} centered>
					<ModalHeader>
						{noteSegment?.startHour} - {noteSegment?.endHour}
					</ModalHeader>
					<ModalBody>
						{noteSegment?.note}
					</ModalBody>
				</Modal>
			</Modal >

			{/* Edit Day Segment modal */}
			{editSegment && <EditDaySegmentModalComponent show={showEditSegmentModal} daySegment={editSegment} handleClose={handleCloseEditSegmentModal} />}
		</>
	);
}
