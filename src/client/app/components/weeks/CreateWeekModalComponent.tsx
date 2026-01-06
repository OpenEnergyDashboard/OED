/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Col, Container, FormFeedback, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row, Table } from 'reactstrap';
import { daysApi } from '../../redux/api/daysApi';
import { weeksApi } from '../../redux/api/weeksApi';
import { useTranslate } from '../../redux/componentHooks';
import { useAppSelector } from '../../redux/reduxHooks';
import { selectDefaultCreateWeekValues } from '../../redux/selectors/adminSelectors';
import { tooltipBaseStyle } from '../../styles/modalStyle';
import { LocaleDataKey } from '../../translations/data';
import { Week } from '../../types/redux/weeks';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import TooltipHelpComponent from '../TooltipHelpComponent';
import TooltipMarkerComponent from '../TooltipMarkerComponent';

/**
 * Defines a button that opens a modal to create a new weekly conversion pattern.
 * @returns Weekly pattern create element
 */
export default function CreateWeekModalComponent(): React.ReactElement {
	const translate = useTranslate();

	// State to control modal visibility
	const [showModal, setShowModal] = React.useState(false);

	// Fetch days data
	const { data: days = [], isFetching: isFetchingDays } = daysApi.useGetDaysQuery();

	// Sort days by day name to make the dropdown more user-friendly
	const sortedDays = React.useMemo(() => {
		if (!days) {
			return [];
		}
		return [...days].sort((a, b) => a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase()));
	}, [days]);

	// Fetch weeks data (used to check if week name already exists)
	const { data: weeks } = weeksApi.useGetWeeksQuery();

	const [addWeekMutation, { isLoading: isSaving }] = weeksApi.useAddWeekMutation();

	// Default values for the week creation form
	const defaultValues = useAppSelector(selectDefaultCreateWeekValues);

	// State to hold the week details being created. Initialized with default values.
	const [weekDetails, setWeekDetails] = React.useState<Omit<Week, 'id'>>(defaultValues);

	const handleShowModal = () => setShowModal(true);
	const handleCloseModal = () => {
		setShowModal(false);
		resetState();
	};

	const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setWeekDetails({ ...weekDetails, [e.target.name]: e.target.value });
	};

	const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setWeekDetails({ ...weekDetails, [e.target.name]: Number(e.target.value) });
	};

	// Function to handle form submission
	// Validates the week details and submits them to the API
	const handleSubmit = () => {
		setShowModal(false);
		addWeekMutation(weekDetails).unwrap()
			.then(() => {
				showSuccessNotification(translate('week.create.success'));
			})
			.catch(error => {
				showErrorNotification(translate('week.create.failure') + error);
			});
		resetState();
	};

	// Function to reset the week details to default values. Called when modal is closed.
	const resetState = () => {
		setWeekDetails(defaultValues);
	};

	// State to hold validation message for week name
	// This is used to show an error message if the week name is invalid
	const [nameValidationMessageId, setNameValidationMessageId] = React.useState<LocaleDataKey | null>(null);

	// Validate the week name to ensure it is not empty and does not already exist
	const isWeekNameValid = React.useMemo(() => {
		if (weekDetails.name === '') {
			setNameValidationMessageId('error.required');
			return false;
		}

		if (weeks?.some(week => week.name.toLowerCase() === weekDetails.name.toLowerCase())) {
			setNameValidationMessageId('week.validation.name.exists');
			return false;
		}

		setNameValidationMessageId(null);
		return true;
	}, [weekDetails.name, weeks]);

	// Validate the week details to ensure all days are selected and the week name is valid
	// This is used to enable/disable the submit button
	const isWeekValid = React.useMemo(() => {
		return isWeekNameValid &&
			weekDetails.sunday !== -999 &&
			weekDetails.monday !== -999 &&
			weekDetails.tuesday !== -999 &&
			weekDetails.wednesday !== -999 &&
			weekDetails.thursday !== -999 &&
			weekDetails.friday !== -999 &&
			weekDetails.saturday !== -999;
	}, [weekDetails, isWeekNameValid]);

	return (
		<>
			{/* Show create modal button */}
			<Button color="secondary" onClick={handleShowModal}>
				<FormattedMessage id="week.create" />
			</Button>

			<Modal
				isOpen={showModal}
				toggle={handleCloseModal}
			>
				<ModalHeader>
					<FormattedMessage id="week.create" />
					<TooltipHelpComponent page="week-create" />
					<div style={tooltipBaseStyle}>
						<TooltipMarkerComponent page="week-create" helpTextId="help.admin.weekcreate" />
					</div>
				</ModalHeader>
				<ModalBody>
					<Container>
						{/* Name */}
						<Row>
							<Col>
								<FormGroup>
									<Label for="name">{translate('name')}</Label>
									<Input
										id="name"
										type="text"
										name="name"
										required
										value={weekDetails.name}
										invalid={!isWeekNameValid}
										onChange={handleStringChange}
									/>
									<FormFeedback>
										{nameValidationMessageId && <FormattedMessage id={nameValidationMessageId as string} />}
									</FormFeedback>
								</FormGroup>
							</Col>
						</Row>
						{/* Note */}
						<Row>
							<Col>
								<FormGroup>
									<Label for="note">{translate('note')}</Label>
									<Input
										id="note"
										type="textarea"
										name="note"
										value={weekDetails.note}
										onChange={handleStringChange} />
								</FormGroup>
							</Col>
						</Row>
						{/* Days */}
						<Row>
							<Col>
								<Table striped bordered>
									<thead>
										<tr>
											<th><FormattedMessage id="day.of.week" /></th>
											<th><FormattedMessage id="day" /></th>
										</tr>
									</thead>
									<tbody>
										{(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const).map(day => (
											<tr key={day}>
												<td><FormattedMessage id={`day.${day}`} /></td>
												<td>
													<Input
														type="select"
														name={day}
														value={weekDetails[day]}
														invalid={weekDetails[day] === -999}
														disabled={isFetchingDays}
														onChange={handleNumberChange}
													>
														<option value={-999} key="" hidden={weekDetails[day] !== -999} disabled>
															{translate('select.day')}
														</option>

														{sortedDays?.map(day => (
															<option key={day.id} value={day.id} title={day.note}>
																{day.name}
															</option>
														))}
													</Input>
												</td>
											</tr>
										))}
									</tbody>
								</Table>
							</Col>
						</Row>
					</Container>
				</ModalBody>
				<ModalFooter>
					{/* Cancel button */}
					<Button color="secondary" onClick={handleCloseModal}>
						<FormattedMessage id="discard.changes" />
					</Button>
					{/* Submit button */}
					<Button
						color="primary"
						onClick={handleSubmit}
						disabled={!isWeekValid || isSaving}
					>
						<FormattedMessage id="save.all" />
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
}
