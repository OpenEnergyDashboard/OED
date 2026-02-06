import * as React from 'react';
import { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Container, FormFeedback, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import TooltipHelpComponent from '../../components/TooltipHelpComponent';
import { weatherLocationApi } from '../../redux/api/weatherLocationApi';
import { useTranslate } from '../../redux/componentHooks';
import '../../styles/modal.css';
import { tooltipBaseStyle } from '../../styles/modalStyle';
import { WeatherLocationData } from '../../types/redux/weather';
import { showErrorNotification, showSuccessNotification, showInfoNotification } from '../../utils/notifications';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import { GPSPoint, isValidGPSInput } from '../../utils/calibration';
import { SimpleUnsavedWarningComponent } from '../SimpleUnsavedWarningComponent';

interface EditWeatherModalComponentProps {
	show: boolean;
	location: WeatherLocationData;
	// passed in to handle closing the modal
	handleClose: () => void;
}

/**
 * Defines the edit weather location modal form
 * @param props props for component
 * @returns Weather Location edit element
 */
export default function EditWeatherModalComponent(props: EditWeatherModalComponentProps) {
	const [submitEditedLocation] = weatherLocationApi.useEditLocationMutation();
	const [deleteLocation] = weatherLocationApi.useDeleteWeatherLocationMutation();
	const translate = useTranslate();

	// Set existing weather location values
	const values = {
		identifier: props.location.identifier,
		gps: props.location.gps === null ? '' : props.location.gps.latitude + ',' + props.location.gps.longitude,
		note: props.location.note,
		id: props.location.id
	};

	/* State */
	// Handlers for each type of input change
	const [state, setState] = useState(values);

	// Unsaved changes tracking
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
	// If there are no changes, then save is disabled
	const [canSave, setCanSave] = useState(false);

	const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setState({ ...state, [e.target.name]: e.target.value });
	};

	const handleDeleteLocation = () => {
		// Open delete confirmation modal
		setOpenDeleteConfirmation(true);
	};
	/* End State */

	// Displays the unsaved warning component whenever there's unsaved
	// changes, otherwise closes out of the modal
	const handleToggle = () => {
		if (hasUnsavedChanges) {
			setShowUnsavedWarning(true);
		} else {
			// Proceed to close the modal
			props.handleClose();
		}
	};

	const resetState = () => {
		setState(values);
	};

	const handleClose = () => {
		props.handleClose();
		resetState();
	};

	// Save changes
	// Currently using the old functionality which is to compare inherited prop values to state values
	// If there is a difference between props and state, then a change was made
	// Side note, we could probably just set a boolean when any input
	const handleSaveChanges = () => {
		// Close the modal first to avoid repeat clicks
		props.handleClose();

		// true if inputted values are okay. Then can submit.
		let inputOk = true;

		// Only proceed if there are actual changes
		if (hasUnsavedChanges) {
			// Check GPS entered.
			// Validate GPS is okay and take from string to GPSPoint to submit.
			const gpsInput = state.gps;
			let gps: GPSPoint | null = null;
			const latitudeIndex = 0;
			const longitudeIndex = 1;
			// If the user input a value then gpsInput should be a string.
			// null came from the DB and it is okay to just leave it - Not a string.
			if (typeof gpsInput === 'string') {
				const { validGps, message } = isValidGPSInput(gpsInput);
				if (validGps) {
					// Clearly gpsInput is a string but TS complains about the split so cast.
					const gpsValues = (gpsInput as string).split(',').map((value: string) => parseFloat(value));
					// It is valid and needs to be in this format for routing.
					gps = {
						longitude: gpsValues[longitudeIndex],
						latitude: gpsValues[latitudeIndex]
					};
					// gpsInput must be of type string but TS does not think so so cast.
				} else if ((gpsInput as string).length !== 0) {
					// GPS not okay.
					showErrorNotification(message);
					inputOk = false;
				}
			}

			if (inputOk) {
				// The input passed validation.
				// GPS may have been updated so create updated state to submit.
				submitEditedLocation({
					editedLocation: {
						...state,
						gps: gps
					}
				})
					.unwrap()
					.then(() => {
						showSuccessNotification(translate('weather.successfully.edit.location'));
					})
					.catch(() => {
						showErrorNotification(translate('weather.failed.to.edit.location'));
					});
			}
		} else {
			showInfoNotification(translate('weather.location.no.changes'));
		}
	};

	// Delete Confirmation Modal
	const [openDeleteConfirmation, setOpenDeleteConfirmation] = useState(false);

	const handleDeleteConfirmation = () => {
		deleteLocation(state.id)
			.unwrap()
			.then(() => {
				showSuccessNotification(translate('weather.successfully.delete.location'));
				handleClose();
			})
			.catch(error => {
				showErrorNotification(translate('weather.failed.to.delete.location') + error.data);
			});
	};
	// Toggles Delete Warning Modal
	const toggleDeleteConfirmation = () => {
		setOpenDeleteConfirmation(!openDeleteConfirmation);
	};

	// Checks if edit made.
	useEffect(() => {
		// Compare the local changes to the original values
		const editMade =
			props.location.identifier !== state.identifier
			|| (props.location.gps === null ? '' : props.location.gps.latitude + ',' + props.location.gps.longitude) !== state.gps
			|| props.location.note !== state.note;

		// Check if the current state is valid (identifier and GPS cannot be blank)
		const isValid = state.identifier !== '' && state.gps !== '';

		// Automatically checks for unsaved changes and addresses the issue
		// of having to manually set the setHasUnsavedChanges
		// If editMade is true, then hasUnsavedChanges will be set to true.
		setHasUnsavedChanges(editMade);
		// If editsMade AND valid, then canSave is true (saving is enabled)
		setCanSave(editMade && isValid);
	}, [state, props.location]);

	const tooltipStyle = {
		...tooltipBaseStyle,
		tooltipEditWeatherLocationView: 'help.admin.weatheredit'
	};


	return (
		<>
			{/* Unsaved Warning Component */}
			{showUnsavedWarning && (
				<SimpleUnsavedWarningComponent
					isOpen={showUnsavedWarning}
					onDiscard={() => {
						setShowUnsavedWarning(false);
						setHasUnsavedChanges(false);
						handleClose();
						resetState();
					}}
					onConfirm={() => {
						setShowUnsavedWarning(false);
						setHasUnsavedChanges(false);
						handleSaveChanges();
					}}
					onCancel={() => setShowUnsavedWarning(false)}
					disabled={!canSave}
				/>
			)}

			{/* Main Edit Modal */}
			<Modal isOpen={props.show} toggle={handleToggle} size='lg'>
				<ModalHeader>
					<FormattedMessage id="edit.weather.location" />
					<TooltipHelpComponent page='weatherLocation-edit' />
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='weatherLocation-edit' helpTextId={tooltipStyle.tooltipEditWeatherLocationView} />
					</div>
				</ModalHeader>
				{/* Main Modal Content */}
				<ModalBody>
					<Container>
						{/* Identifier input */}
						<FormGroup>
							<Label for='identifier'>{translate('identifier')}</Label>
							<Input
								id='identifier'
								name='identifier'
								type='text'
								autoComplete='on'
								onChange={e => handleStringChange(e)}
								value={state.identifier}
								invalid={state.identifier === ''}
							/>
							<FormFeedback>
								<FormattedMessage id="error.required" />
							</FormFeedback>
						</FormGroup>
						{/* Gps input */}
						<FormGroup>
							<Label for='gps'>{translate('gps')}</Label>
							<Input
								id='gps'
								name='gps'
								type='text'
								onChange={e => handleStringChange(e)}
								value={state.gps}
								disabled={true}
							/>
						</FormGroup>
						{/* Note input */}
						<FormGroup>
							<Label for='note'>{translate('note')}</Label>
							<Input
								id='note'
								name='note'
								type='textarea'
								value={state.note}
								onChange={e => handleStringChange(e)}
							/>
						</FormGroup>
					</Container>
				</ModalBody>
				<ModalFooter>
					<Button variant="warning" color='danger' onClick={handleDeleteLocation}>
						<FormattedMessage id="weather.delete.location" />
					</Button>
					{/* Hides the modal */}
					<Button color='secondary' onClick={handleClose}>
						<FormattedMessage id="discard.changes" />
					</Button>
					{/* On click calls the function handleSaveChanges in this component */}
					<Button color='primary' onClick={handleSaveChanges} disabled={!canSave}>
						<FormattedMessage id="save.all" />
					</Button>
				</ModalFooter>
			</Modal>

			{/* Delete Confirmation Modal */}
			<Modal isOpen={openDeleteConfirmation} toggle={toggleDeleteConfirmation}>
				<ModalHeader>
					<FormattedMessage id="delete.weather.location" />
					<TooltipHelpComponent page='weatherLocation-edit' />
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='weatherLocation-edit' helpTextId={tooltipStyle.tooltipEditWeatherLocationView} />
					</div>
				</ModalHeader>
				<ModalBody>
					<FormattedMessage id="confirm.delete.weather.location" />
				</ModalBody>
				<ModalFooter>
					<Button color="danger" onClick={handleDeleteConfirmation}>
						<FormattedMessage id="delete" />
					</Button>
					<Button color="secondary" onClick={toggleDeleteConfirmation}>
						<FormattedMessage id="cancel" />
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
}
