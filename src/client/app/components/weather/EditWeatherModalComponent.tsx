import * as React from 'react';
import { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Container, FormFeedback, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader} from 'reactstrap';
import TooltipHelpComponent from '../../components/TooltipHelpComponent';
import { weatherLocationApi } from '../../redux/api/weatherLocationApi';
import { useTranslate } from '../../redux/componentHooks';
import '../../styles/modal.css';
import { tooltipBaseStyle } from '../../styles/modalStyle';
import { WeatherLocationData} from '../../types/redux/weather';
import { showErrorNotification, showSuccessNotification, showInfoNotification } from '../../utils/notifications';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import { GPSPoint, isValidGPSInput } from '../../utils/calibration';

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
		gps: `${props.location.latitude},${props.location.longitude}`,
		note: props.location.note,
		id: props.location.id
	};

	/* State */
	// Handlers for each type of input change
	const [state, setState] = useState(values);
	const [localValues] = useState(values);

	const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setState({ ...state, [e.target.name]: e.target.value });
	};

	const handleDeleteLocation = () => {
		// Open delete confirmation modal
		setOpenDeleteConfirmation(true);
	};

	/* Edit WeatherLocation Validation:
        Identifier cannot be blank
        GPS cannot be blank
    */
	const [validLocation, setValidLocation] = useState(false);
	useEffect(() => {
		setValidLocation(state.identifier !== '' && state.gps !== '');
	}, [state.identifier, state.gps]);
	/* End State */

	const resetState = () => {
		setState(values);
	};

	const handleClose = () => {
		props.handleClose();
		resetState();
	};

	const compareLocations = (loc1: { [x: string]: any; }, loc2: { [x: string]: any; }) => {
		// Get the keys of each location
		const keys1 = Object.keys(loc1);
		const keys2 = Object.keys(loc2);

		// Check if the number of keys is the same
		if (keys1.length !== keys2.length) {
			return false;
		}

		// Check if all keys and values are the same
		for (const key of keys1) {
			// If the key is not present in loc2 or values are different, objects are not equal
			if (!(key in loc2) || loc1[key] !== loc2[key]) {
				return false;
			}
		}

		// Objects are equal
		return true;
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

		if(!compareLocations(state, localValues)) {
			const gpsInput = state.gps;

			let gps: GPSPoint | null = null;

			const latitudeIndex = 0;
			const longitudeIndex = 1;
			// If the user input a value then gpsInput should be a string.
			// null came from the DB and it is okay to just leave it - Not a string.
			if (typeof gpsInput === 'string') {
				if (isValidGPSInput(gpsInput)) {
					const gpsValues = gpsInput.split(',').map(value => parseFloat(value));
					// It is valid and needs to be in this format for routing.
					gps = {
						longitude: gpsValues[longitudeIndex],
						latitude: gpsValues[latitudeIndex]
					};
				} else if (gpsInput.length !== 0) {
					// GPS not okay. Only true if some input.
					// TODO isValidGPSInput currently pops up an alert so not doing it here, may change
					// so leaving code commented out.
					// showErrorNotification(translate('input.gps.range') + state.gps + '.');
					inputOk = false;
				}
			}
			// Convert longitude and latitude to numbers
			const longitude = typeof gps?.longitude === 'number' ? parseFloat(gps.longitude.toString()) : 0;
			const latitude = typeof gps?.latitude === 'number' ? parseFloat(gps.latitude.toString()) : 0;

			if (inputOk) {
				// The input passed validation.
				// GPS may have been updated so create updated state to submit.
				submitEditedLocation({
					editedLocation: {
						...state,
						longitude,
						latitude
					}
				})
					.unwrap()
					.then(() => {
						showSuccessNotification(translate('weather.successfully.edited.location'));
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
				showSuccessNotification(translate('weather-location.delete.success'));
				handleClose();
			})
			.catch(error => {
				showErrorNotification(translate('weather-location.delete.failure') + error.data);
			});
	};
	// Toggles Delete Warning Modal
	const toggleDeleteConfirmation = () => {
		setOpenDeleteConfirmation(!openDeleteConfirmation);
	};

	const tooltipStyle = {
		...tooltipBaseStyle,
		tooltipEditWeatherLocationView: 'help.admin.weather-location-edit'
	};


	return (
		<>
			{/* Main Edit Modal */}
			<Modal isOpen={props.show} toggle={handleClose} size='lg'>
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
								placeholder='Identifier'
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
								autoComplete='on'
								onChange={e => handleStringChange(e)}
								value={state.gps}
								placeholder='gps'
								disabled={true}
							/>
							<FormFeedback>
								<FormattedMessage id="error.required" />
							</FormFeedback>
						</FormGroup>
						{/* Note input */}
						<FormGroup>
							<Label for='note'>{translate('note')}</Label>
							<Input
								id='note'
								name='note'
								type='textarea'
								value={state.note}
								placeholder='Note'
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
					<Button color='primary' onClick={handleSaveChanges} disabled={!validLocation}>
						<FormattedMessage id="save.all" />
					</Button>
				</ModalFooter>
			</Modal>

			{/* Delete Confirmation Modal */}
			<Modal isOpen={openDeleteConfirmation} toggle={toggleDeleteConfirmation}>
				<ModalHeader>
					<FormattedMessage id="delete.weather-location" />
					<TooltipHelpComponent page='weatherLocation-edit' />
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='weatherLocation-edit' helpTextId={tooltipStyle.tooltipEditWeatherLocationView} />
					</div>
				</ModalHeader>
				<ModalBody>
					<FormattedMessage id="confirm.delete.weather-location" />
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
