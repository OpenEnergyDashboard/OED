/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import * as React from 'react';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Col, Container, FormGroup, FormFeedback, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap';
import TooltipHelpComponent from '../TooltipHelpComponent';
import '../../styles/modal.css';
import { tooltipBaseStyle } from '../../styles/modalStyle';
import { useTranslate } from '../../redux/componentHooks';
import ConfirmActionModalComponent from '../ConfirmActionModalComponent';
import TooltipMarkerComponent from '../TooltipMarkerComponent';

export type HolidayType =
	| 'federal'
	| 'national'
	| 'religious'
	| 'cultural'
	| 'regional'
	| 'observed'
	| 'utility';

export interface HolidayDayPatternOption {
	id: number;
	name: string;
	note?: string;
}

export interface HolidayInstanceGroupOption {
	id: number;
	name: string;
	note?: string;
}

// UI projection from holidays, holiday_instance, holiday_instance_group, and day_patterns.
export interface HolidayModalData {
	id: number;
	name: string;
	startDate: string;
	local: string;
	note?: string;
	holidayInstanceId?: number;
	holidayInstanceName: string;
	holidayInstanceNote?: string;
	holidayInstanceGroupId?: number;
	dayPatternId?: number;
	holidayRateApplies: boolean;
	holidayType: HolidayType;
}

interface EditHolidayModalComponentProps {
	show: boolean;
	holiday: HolidayModalData;
	holidayIdentifier: string;
	dayPatterns: HolidayDayPatternOption[];
	holidayInstanceGroups: HolidayInstanceGroupOption[];
	// passed in to handle opening the modal
	handleShow: () => void;
	// passed in to handle closing the modal
	handleClose: () => void;
	// Hook these to a holidaysApi edit mutation when the Redux API is added.
	handleSaveHoliday?: (holidayData: HolidayModalData) => void;
	handleDeleteHoliday?: (holidayId: number) => void;
}

const holidayTypeLabels: Record<HolidayType, string> = {
	federal: 'Federal holiday',
	national: 'National holiday',
	religious: 'Religious holiday',
	cultural: 'Cultural holiday',
	regional: 'Regional holiday',
	observed: 'Observed closure',
	utility: 'Utility holiday'
};

/**
 * Defines the edit holiday modal form.
 * @param props Props for the component
 * @returns Holiday edit element
 */
export default function EditHolidayModalComponent(props: EditHolidayModalComponentProps) {
	const translate = useTranslate();

	// Set existing holiday values
	const values = { ...props.holiday };

	/* State */
	const [state, setState] = useState(values);
	const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);
	const [showWarningModal, setShowWarningModal] = useState(false);
	const [warningMessage, setWarningMessage] = useState('');
	const [deleteConfirmationMessage, setDeleteConfirmationMessage] = useState(
		'Delete holiday [' + props.holidayIdentifier + '] ?');

	const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setState({ ...state, [e.target.name]: e.target.value });
	};

	const handleBooleanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setState({ ...state, [e.target.name]: JSON.parse(e.target.value) });
	};

	const handleOptionalNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setState({
			...state,
			[e.target.name]: e.target.value === '' ? undefined : Number(e.target.value)
		});
	};
	/* End State */

	const isHolidayNameInvalid = () => state.name.trim() === '';
	const isStartDateInvalid = () => state.startDate.trim() === '';
	const isDayPatternInvalid = () => state.holidayRateApplies && state.dayPatternId === undefined;

	const holidayHasChanges = () => {
		return props.holiday.name !== state.name
			|| props.holiday.startDate !== state.startDate
			|| props.holiday.local !== state.local
			|| props.holiday.note !== state.note
			|| props.holiday.holidayInstanceName !== state.holidayInstanceName
			|| props.holiday.holidayInstanceNote !== state.holidayInstanceNote
			|| props.holiday.holidayInstanceGroupId !== state.holidayInstanceGroupId
			|| props.holiday.dayPatternId !== state.dayPatternId
			|| props.holiday.holidayRateApplies !== state.holidayRateApplies
			|| props.holiday.holidayType !== state.holidayType;
	};

	/* Confirm Delete Modal */
	const handleDeleteConfirmationModalClose = () => {
		// Hide the warning modal
		setShowDeleteConfirmationModal(false);
		// Show the edit modal
		handleShow();
	};

	const handleDeleteConfirmationModalOpen = () => {
		// Hide the edit modal
		handleClose();
		// Show the warning modal
		setShowDeleteConfirmationModal(true);
	};

	const handleDeleteHoliday = () => {
		setShowDeleteConfirmationModal(false);
		props.handleDeleteHoliday?.(state.id);
	};

	const checkState = () => {
		setDeleteConfirmationMessage(
			'Delete holiday [' + props.holidayIdentifier + '] ?\n'
			+ 'This may also affect linked holiday instances, week patterns, and day patterns.');
		handleDeleteConfirmationModalOpen();
	};
	/* End Confirm Delete Modal */

	// Reset the state to default values
	const resetState = () => {
		setState(values);
	};

	const handleShow = () => {
		props.handleShow();
	};

	const handleClose = () => {
		props.handleClose();
		resetState();
	};

	const handleWarningConfirm = () => {
		setShowWarningModal(false);
		props.handleClose();

		if (holidayHasChanges()) {
			props.handleSaveHoliday?.(state);
		}
	};

	const handleWarningCancel = () => {
		setShowWarningModal(false);
	};

	// Save changes
	const handleSaveChanges = () => {
		if (isHolidayNameInvalid() || isStartDateInvalid() || isDayPatternInvalid()) {
			return;
		}

		if (!state.holidayRateApplies) {
			setWarningMessage(
				'This holiday is marked as not following holiday rates. Save this holiday rate setting?');
			setShowWarningModal(true);
		} else {
			props.handleClose();

			if (holidayHasChanges()) {
				props.handleSaveHoliday?.(state);
			}
		}
	};

	const tooltipStyle = {
		...tooltipBaseStyle,
		tooltipEditHolidayView: 'help.admin.holidayedit'
	};

	return (
		<>
			{/* Warning Modal */}
			<ConfirmActionModalComponent
				show={showWarningModal}
				actionConfirmMessage={warningMessage}
				handleClose={handleWarningCancel}
				actionFunction={handleWarningConfirm}
				actionConfirmText={translate('confirm.action')}
				actionRejectText={translate('cancel')} />
			<ConfirmActionModalComponent
				show={showDeleteConfirmationModal}
				actionConfirmMessage={deleteConfirmationMessage}
				handleClose={handleDeleteConfirmationModalClose}
				actionFunction={handleDeleteHoliday}
				actionConfirmText='Delete Holiday'
				actionRejectText={translate('cancel')} />
			<Modal isOpen={props.show} toggle={handleClose}>
				<ModalHeader>
					<FormattedMessage id='holiday.edit.holiday' />
					<TooltipHelpComponent page='holidays-edit' />
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='holidays-edit' helpTextId={tooltipStyle.tooltipEditHolidayView} />
					</div>
				</ModalHeader>
				<ModalBody>
					<Container>
						<Row xs='1' lg='2'>
							<Col>
								{/* Holiday name */}
								<FormGroup>
									<Label for='name'>{translate('holiday.name')}</Label>
									<Input
										id='name'
										name='name'
										type='text'
										value={state.name}
										invalid={isHolidayNameInvalid()}
										onChange={e => handleStringChange(e)} />
									<FormFeedback>
										<FormattedMessage id='holiday.name.required' />
									</FormFeedback>
								</FormGroup>
							</Col>
							<Col>
								{/* Start date from holidays.start_date */}
								<FormGroup>
									<Label for='startDate'>{translate('holiday.start.date')}</Label>
									<Input
										id='startDate'
										name='startDate'
										type='date'
										value={state.startDate}
										invalid={isStartDateInvalid()}
										onChange={e => handleStringChange(e)} />
									<FormFeedback>
										<FormattedMessage id='holiday.start.date.required' />
									</FormFeedback>
								</FormGroup>
							</Col>
						</Row>
						<Row xs='1' lg='2'>
							<Col>
								{/* International region/local value from holidays.local */}
								<FormGroup>
									<Label for='local'>{translate('holiday.region')}</Label>
									<Input
										id='local'
										name='local'
										type='select'
										value={state.local}
										onChange={e => handleStringChange(e)}>
										<option value='United States'>United States</option>
										<option value='Asian Holidays'>Asian Holidays</option>
										<option value='European Holidays'>European Holidays</option>
										<option value='Middle East Holidays'>Middle East Holidays</option>
										<option value='International'>International</option>
									</Input>
								</FormGroup>
							</Col>
							<Col>
								{/* Frontend classification used by the holiday widget */}
								<FormGroup>
									<Label for='holidayType'>{translate('holiday.type')}</Label>
									<Input
										id='holidayType'
										name='holidayType'
										type='select'
										value={state.holidayType}
										onChange={e => handleStringChange(e)}>
										{Object.entries(holidayTypeLabels).map(([key, value]) => {
											return (<option value={key} key={key}>{value}</option>);
										})}
									</Input>
								</FormGroup>
							</Col>
						</Row>
						<Row xs='1' lg='2'>
							<Col>
								{/* Holiday rate flag for the page widget */}
								<FormGroup>
									<Label for='holidayRateApplies'>{translate('holiday.rates')}</Label>
									<Input
										id='holidayRateApplies'
										name='holidayRateApplies'
										type='select'
										value={state.holidayRateApplies.toString()}
										onChange={e => handleBooleanChange(e)}>
										<option value='true'>Yes</option>
										<option value='false'>No</option>
									</Input>
								</FormGroup>
							</Col>
							<Col>
								{/* holiday_instance.day_patterns_id */}
								<FormGroup>
									<Label for='dayPatternId'>{translate('holiday.day.pattern')}</Label>
									<Input
										id='dayPatternId'
										name='dayPatternId'
										type='select'
										value={state.dayPatternId ?? ''}
										invalid={isDayPatternInvalid()}
										onChange={e => handleOptionalNumberChange(e)}>
										<option value=''>Select a day pattern</option>
										{props.dayPatterns.map(dayPattern => {
											return (
												<option value={dayPattern.id} key={dayPattern.id}>
													{dayPattern.name}
												</option>
											);
										})}
									</Input>
									<FormFeedback>
										<FormattedMessage id='holiday.day.pattern.select' />
									</FormFeedback>
								</FormGroup>
							</Col>
						</Row>
						<Row xs='1' lg='2'>
							<Col>
								{/* holiday_instance.name */}
								<FormGroup>
									<Label for='holidayInstanceName'>Holiday instance</Label>
									<Input
										id='holidayInstanceName'
										name='holidayInstanceName'
										type='text'
										value={state.holidayInstanceName}
										onChange={e => handleStringChange(e)} />
								</FormGroup>
							</Col>
							<Col>
								{/* holiday_group_members.holiday_instance_group_id */}
								<FormGroup>
									<Label for='holidayInstanceGroupId'>Holiday group</Label>
									<Input
										id='holidayInstanceGroupId'
										name='holidayInstanceGroupId'
										type='select'
										value={state.holidayInstanceGroupId ?? ''}
										onChange={e => handleOptionalNumberChange(e)}>
										<option value=''>No group</option>
										{props.holidayInstanceGroups.map(group => {
											return (
												<option value={group.id} key={group.id}>
													{group.name}
												</option>
											);
										})}
									</Input>
								</FormGroup>
							</Col>
						</Row>
						{/* holiday_instance.note */}
						<FormGroup>
							<Label for='holidayInstanceNote'>Instance note</Label>
							<Input
								id='holidayInstanceNote'
								name='holidayInstanceNote'
								type='textarea'
								value={state.holidayInstanceNote ?? ''}
								placeholder='Instance note'
								onChange={e => handleStringChange(e)} />
						</FormGroup>
						{/* holidays.note */}
						<FormGroup>
							<Label for='note'>
								<FormattedMessage id='note' />
							</Label>
							<Input
								id='note'
								name='note'
								type='textarea'
								value={state.note ?? ''}
								placeholder='Note'
								onChange={e => handleStringChange(e)} />
						</FormGroup>
					</Container>
				</ModalBody>
				<ModalFooter>
					<Button color='danger' onClick={checkState}>
						Delete Holiday
					</Button>
					{/* Hides the modal */}
					<Button color='secondary' onClick={handleClose}>
						<FormattedMessage id='discard.changes' />
					</Button>
					{/* On click calls the function handleSaveChanges in this component */}
					<Button color='primary' onClick={handleSaveChanges}>
						<FormattedMessage id='save.all' />
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
}
