/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Col, Container, FormFeedback, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row, Table } from 'reactstrap';
import { daysApi } from '../../redux/api/daysApi';
import { weeksApi } from '../../redux/api/weeksApi';
import { useTranslate } from '../../redux/componentHooks';
import { tooltipBaseStyle } from '../../styles/modalStyle';
import { LocaleDataKey } from '../../translations/data';
import { Week } from '../../types/redux/weeks';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import ConfirmActionModalComponent from '../ConfirmActionModalComponent';
import TooltipHelpComponent from '../TooltipHelpComponent';
import TooltipMarkerComponent from '../TooltipMarkerComponent';

interface EditWeekModalComponentProps {
	/**
	 * Whether the modal is visible or not
	 */
	show: boolean;

	/**
	 * The week to edit
	 */
	week: Week;

	/**
	 * Function to run when edit modal closes
	 */
	handleClose: () => void;
}

/**
 * Defines a modal that allows editing of an existing weekly conversion pattern.
 * @param props - The properties for the component
 * @returns Weekly pattern edit element
 */
export default function EditWeekModalComponent(props: EditWeekModalComponentProps): React.ReactElement {
	const translate = useTranslate();

	// State to hold the week details being edited. Initialized with the week passed in through props
	const [weekDetails, setWeekDetails] = React.useState({ ...props.week });

	// Fetch days data
	const { data: days, isFetching: isFetchingDays } = daysApi.useGetDaysQuery();

	// Sort days by day name to make the dropdown more user-friendly
	const sortedDays = React.useMemo(() => {
		if (!days) {
			return [];
		}
		return [...days].sort((a, b) => a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase()));
	}, [days]);

	// Fetch weeks data (used to check if week name already exists)
	const { data: weeks } = weeksApi.useGetWeeksQuery();

	const [editWeekMutation, { isLoading: isSaving }] = weeksApi.useEditWeekMutation();

	const resetState = () => {
		setWeekDetails({ ...props.week });
	};

	const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setWeekDetails({ ...weekDetails, [e.target.name]: e.target.value });
	};

	const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setWeekDetails({ ...weekDetails, [e.target.name]: Number(e.target.value) });
	};

	const isWeekUnchanged = React.useMemo(() => {
		return weekDetails.name === props.week.name &&
			weekDetails.note === props.week.note &&
			weekDetails.sunday === props.week.sunday &&
			weekDetails.monday === props.week.monday &&
			weekDetails.tuesday === props.week.tuesday &&
			weekDetails.wednesday === props.week.wednesday &&
			weekDetails.thursday === props.week.thursday &&
			weekDetails.friday === props.week.friday &&
			weekDetails.saturday === props.week.saturday;
	}, [weekDetails, props.week]);

	// Function to handle form submission. Validates the week details and submits them to the API
	const handleSubmit = () => {
		props.handleClose();
		editWeekMutation(weekDetails).unwrap()
			.then(() => {
				showSuccessNotification(translate('week.edit.success'));
			})
			.catch(error => {
				showErrorNotification(translate('week.edit.failure') + error);
			});
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
		if (weeks?.some(week => week.name.toLowerCase() === weekDetails.name.toLowerCase() && week.id !== weekDetails.id)) {
			setNameValidationMessageId('week.validation.name.exists');
			return false;
		}

		setNameValidationMessageId(null);
		return true;
	}, [weekDetails.name, weeks, weekDetails.id]);


	// Delete confirmation dialog visibility
	const [showDeleteModal, setShowDeleteModal] = React.useState(false);
	const [deleteWeekMutation, { isLoading: isDeleting }] = weeksApi.useDeleteWeekMutation();

	// Function to delete the week
	const handleDelete = () => {
		setShowDeleteModal(false);
		deleteWeekMutation({ id: weekDetails.id }).unwrap()
			.then(() => {
				showSuccessNotification(translate('week.delete.success'));
				props.handleClose();
			})
			.catch(error => {
				showErrorNotification(translate('week.delete.failure') + error);
			});
	};

	return (
		<>
			<Modal isOpen={props.show} toggle={props.handleClose} onClosed={resetState}>
				<ModalHeader>
					<FormattedMessage id="week.edit" />
					<TooltipHelpComponent page="week-edit" />
					<div style={tooltipBaseStyle}>
						<TooltipMarkerComponent page="week-edit" helpTextId="help.admin.weekedit" />
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
										onChange={handleStringChange} />
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
														disabled={isFetchingDays}
														onChange={handleNumberChange}
													>
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
					{/* Delete week */}
					<Button
						color="danger"
						onClick={() => setShowDeleteModal(true)}
						disabled={isSaving || isDeleting}>
						<FormattedMessage id="delete.week" />
					</Button>
					{/* Discard changes */}
					<Button color="secondary" onClick={props.handleClose}>
						<FormattedMessage id="discard.changes" />
					</Button>
					{/* Save changes */}
					<Button
						color="primary"
						onClick={handleSubmit}
						disabled={isWeekUnchanged || !isWeekNameValid || isSaving || isDeleting}
					>
						<FormattedMessage id="save.all" />
					</Button>
				</ModalFooter>

				{/* Delete confirmation modal */}
				<ConfirmActionModalComponent
					show={showDeleteModal}
					actionConfirmMessage={translate('week.delete.confirm')}
					actionFunction={handleDelete}
					handleClose={() => setShowDeleteModal(false)}
					actionConfirmText={translate('week.delete')}
					actionRejectText={translate('cancel')} />
			</Modal>
		</>
	);
}
