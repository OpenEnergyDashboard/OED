/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useEffect, useState } from 'react';
import { Button, Container, FormFeedback, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import '../../styles/modal.css';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import TooltipHelpComponent from '../../components/TooltipHelpComponent';
import { weatherLocationApi } from '../../redux/api/weatherLocationApi';
import { tooltipBaseStyle } from '../../styles/modalStyle';
import { useTranslate } from '../../redux/componentHooks';
import { showSuccessNotification, showErrorNotification } from '../../utils/notifications';
import { GPSPoint, isValidGPSInput } from '../../utils/calibration';
import { SimpleUnsavedWarningComponent } from '../SimpleUnsavedWarningComponent';

/**
 * Defines the create weather modal form
 * @returns Weather create element
 */
export default function CreateWeatherModalComponent() {
	const [submitCreateWeatherLocation] = weatherLocationApi.useAddWeatherLocationMutation();
	const translate = useTranslate();

	// Boolean that updates if any change is made to the modal
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

	const defaultValues = {
		identifier: '',
		gps: '',
		note: '',
		// The client code makes the id for the new weather location be -99
		id: -99
	};

	const [showModal, setShowModal] = useState(false);

	// Displays the unsaved warning component whenever there's unsaved
	// changes, otherwise closes out of the modal
	const handleToggle = () => {
		if (hasUnsavedChanges) {
			setShowUnsavedWarning(true);
		}
		else {
			// Proceed to close the modal
			handleClose();
		}
	};

	const handleClose = () => {
		setShowModal(false);
		resetState();
	};

	const handleShow = () => setShowModal(true);

	// Handlers for each type of input change
	const [state, setState] = useState(defaultValues);

	const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setState({ ...state, [e.target.name]: e.target.value });
	};


	/* Create Weather Location Validation:
		Identifier cannot be blank
		Gps cannot be blank
	*/

	const [validWeather, setValidWeather] = useState(false);
	useEffect(() => {
		setValidWeather(state.identifier !== '' && state.gps !== '');

		// Check if any changes were made compared to default values
		const editMade =
			state.identifier !== defaultValues.identifier
			|| state.gps !== defaultValues.gps
			|| state.note !== defaultValues.note;

		// Automatically checks for unsaved changes
		// If editMade is true, then hasUnsavedChanges will be set to true.
		setHasUnsavedChanges(editMade);
	}, [state.identifier, state.gps]);

	const resetState = () => {
		setState(defaultValues);
	};

	// Submit
	const handleSubmit = () => {
		// Close modal first to avoid repeat clicks
		setShowModal(false);

		// true if inputted values are okay. Then can submit.
		let inputOk = true;

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
				const gpsValues = gpsInput.split(',').map(value => parseFloat(value));
				// It is valid and needs to be in this format for routing.
				gps = {
					longitude: gpsValues[longitudeIndex],
					latitude: gpsValues[latitudeIndex]
				};
			} else if (gpsInput.length !== 0) {
				// GPS not okay. Only true if some input.
				showErrorNotification(message);
				inputOk = false;
			}
		}

		// Submit the form with updated state
		if (inputOk) {
			submitCreateWeatherLocation({
				...state,
				gps: gps
			})
				.unwrap()
				.then(() => {
					showSuccessNotification(translate('weather.successfully.create.location'));
				})
				.catch(() => {
					showErrorNotification(translate('weather.failed.to.create.location'));
				});
			resetState();
		} else {
			// Tell user that not going to update due to input issues.
			showErrorNotification(translate('weather.input.error'));
		}
	};


	const tooltipStyle = {
		...tooltipBaseStyle,
		tooltipCreateWeatherView: 'help.admin.weathercreate'
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
						handleSubmit();
						handleClose();
					}}
					onCancel={() => setShowUnsavedWarning(false)}
					disabled={!validWeather}
				/>
			)}
			<Button color='secondary' onClick={handleShow}>
				<FormattedMessage id="create.weather" />
			</Button>
			<Modal isOpen={showModal} toggle={handleToggle} size='lg'>
				<ModalHeader>
					<FormattedMessage id="create.weather" />
					<TooltipHelpComponent page='weather-create' />
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='weather-create' helpTextId={tooltipStyle.tooltipCreateWeatherView} />
					</div>
				</ModalHeader>
				<ModalBody>
					<Container>
						<FormGroup>
							<Label for='identifier'>{translate('identifier')}</Label>
							<Input
								id='identifier'
								name='identifier'
								type='text'
								autoComplete='on'
								onChange={e => handleStringChange(e)}
								value={state.identifier}
								invalid={state.identifier === ''} />
							<FormFeedback>
								<FormattedMessage id="error.required" />
							</FormFeedback>
						</FormGroup>
						<FormGroup>
							<Label for='gps'>{translate('gps')}</Label>
							<Input
								id='gps'
								name='gps'
								type='text'
								autoComplete='on'
								onChange={e => handleStringChange(e)}
								value={state.gps.toString()}
								invalid={state.gps == ''} />
							<FormFeedback>
								<FormattedMessage id="error.required" />
							</FormFeedback>
						</FormGroup>
						<FormGroup>
							<Label for='note'>{translate('note')}</Label>
							<Input
								id='note'
								name='note'
								type='textarea'
								onChange={e => handleStringChange(e)}
								value={state.note} />
						</FormGroup>
					</Container>
				</ModalBody>
				<ModalFooter>
					<Button color='secondary' onClick={handleClose}>
						<FormattedMessage id="discard.changes" />
					</Button>
					<Button color='primary' onClick={handleSubmit} disabled={!validWeather}>
						<FormattedMessage id="save.all" />
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
}
