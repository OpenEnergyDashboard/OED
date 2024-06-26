/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useState, useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { Button } from 'reactstrap';
import * as moment from 'moment';
import { CalibrationModeTypes, MapMetadata } from '../../types/redux/map';
import { hasToken } from '../../utils/token';
import { showErrorNotification } from '../../utils/notifications';
import '../../styles/card-page.css';
//import { useAppDispatch } from '../../redux/reduxHooks';
//import { confirmEditedMaps, fetchMapsDetails, submitEditedMaps } from '../../redux/slices/mapSlice';
//import { updateUnsavedChanges } from '../../redux/slices/unsavedWarningSlice';

// TODO: create mapSlice and unsavedWarningSlice and properly set up in the Redux store
// with all necessary actions (confirmEditedMaps, fetchMapsDetails, submitEditedMaps, updateUnsavedChanges)
// correctly implemented in their respective slices.

interface MapViewProps {
	id: number;
	map: MapMetadata;
	isEdited: boolean;
	isSubmitting: boolean;
	editMapDetails(map: MapMetadata): any;
	setCalibration(mode: CalibrationModeTypes, mapID: number): any;
	removeMap(id: number): any;
}

/**
 * Defines the maps info card
 * @param props component props
 * @returns Maps info card element
 */
function MapViewComponent(props: MapViewProps) {
	const [nameInput, setNameInput] = useState(props.map.name);
	const [noteInput, setNoteInput] = useState(props.map.note || '');
	const [circleInput, setCircleInput] = useState(props.map.circleSize.toString());
	const [isEditingName, setIsEditingName] = useState(false);
	const [isEditingNote, setIsEditingNote] = useState(false);
	const [isEditingCircle, setIsEditingCircle] = useState(false);

	//const dispatch = useAppDispatch();
	const intl = useIntl();

	useEffect(() => {
		if (props.isEdited) {
			//updateUnsavedChanges();
		}
	}, [props.isEdited]);

	/*
	// Function to remove unsaved changes
	const removeUnsavedChangesFunction = async (callback: () => void) => {
		// Dispatch action to confirm edited maps
		await dispatch(confirmEditedMaps());
		// Fetch updated map details
		await dispatch(fetchMapsDetails());
		callback();
	};

	// Function to submit unsaved changes
	const submitUnsavedChangesFunction = async (successCallback: () => void, failureCallback: () => void) => {
		try {
			// Dispatch action to submit edited maps
			await dispatch(submitEditedMaps());
			// Call success callback if submission is successful
			successCallback();
		} catch (error) {
			// Call failure callback if submission fails
			failureCallback();
		}
	};

	// Function to update unsaved changes
	const updateUnsavedChanges = () => {
	// Dispatch action to update unsaved changes with remove and submit functions
		dispatch(updateUnsavedChanges({
			removeFunction: removeUnsavedChangesFunction,
			submitFunction: submitUnsavedChangesFunction
		}));
	};
	*/

	const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setNameInput(event.target.value);
	};

	const handleNoteChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		setNoteInput(event.target.value);
	};

	const handleCircleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setCircleInput(event.target.value);
	};

	const toggleNameEdit = () => {
		if (isEditingName) {
			props.editMapDetails({ ...props.map, name: nameInput });
		}
		setIsEditingName(!isEditingName);
	};

	const toggleNoteEdit = () => {
		if (isEditingNote) {
			props.editMapDetails({ ...props.map, note: noteInput });
		}
		setIsEditingNote(!isEditingNote);
	};

	const toggleCircleEdit = () => {
		if (isEditingCircle) {
			const regtest = /^\d+(\.\d+)?$/;
			if (regtest.test(circleInput) && parseFloat(circleInput) <= 2.0) {
				props.editMapDetails({ ...props.map, circleSize: parseFloat(circleInput) });
			} else {
				showErrorNotification(intl.formatMessage({ id: 'invalid.number' }));
				return;
			}
		}
		setIsEditingCircle(!isEditingCircle);
	};

	const toggleMapDisplayable = () => {
		props.editMapDetails({ ...props.map, displayable: !props.map.displayable });
	};

	const handleDelete = () => {
		const consent = window.confirm(intl.formatMessage({ id: 'map.confirm.remove' }, { name: props.map.name }));
		if (consent) {
			props.removeMap(props.id);
		}
	};

	const handleCalibrationSetting = (mode: CalibrationModeTypes) => {
		props.setCalibration(mode, props.id);
	};

	return (
		<div className="map-card">
			<div className="identifier-container">
				{props.map.id} {props.isSubmitting ? '(Submitting)' : props.isEdited ? '(Edited)' : ''}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="map.name" /></b>
				{isEditingName ?
					<input value={nameInput} onChange={handleNameChange} /> :
					nameInput}
				<Button color='primary' onClick={toggleNameEdit}>
					<FormattedMessage id={isEditingName ? 'update' : 'edit'} />
				</Button>
			</div>
			{hasToken() && (
				<>
					<div className="item-container">
						<b><FormattedMessage id="map.displayable" /></b>
						<span style={{ color: props.map.displayable ? 'green' : 'red' }}>
							<FormattedMessage id={props.map.displayable ? 'map.is.displayable' : 'map.is.not.displayable'} />
						</span>
						<Button color='primary' onClick={toggleMapDisplayable}>
							<FormattedMessage id={props.map.displayable ? 'hide' : 'show'} />
						</Button>
					</div>
					<div className="item-container">
						<b><FormattedMessage id="map.circle.size" /></b>
						{isEditingCircle ?
							<input value={circleInput} onChange={handleCircleChange} /> :
							circleInput}
						<Button color='primary' onClick={toggleCircleEdit}>
							<FormattedMessage id={isEditingCircle ? 'update' : 'edit'} />
						</Button>
					</div>
					<div className="item-container">
						<b><FormattedMessage id="map.modified.date" /></b>
						{moment.parseZone(props.map.modifiedDate, undefined, true).format('dddd, MMM DD, YYYY hh:mm a')}
					</div>
					<div className="item-container">
						<b><FormattedMessage id="map.filename" /></b>
						{props.map.filename}
						<Link to='/calibration' onClick={() => handleCalibrationSetting(CalibrationModeTypes.initiate)}>
							<Button color='primary'>
								<FormattedMessage id='map.upload.new.file' />
							</Button>
						</Link>
					</div>
					<div className="item-container">
						<b><FormattedMessage id="note" /></b>
						{isEditingNote ?
							<textarea value={noteInput} onChange={handleNoteChange} /> :
							noteInput}
						<Button color='primary' onClick={toggleNoteEdit}>
							<FormattedMessage id={isEditingNote ? 'update' : 'edit'} />
						</Button>
					</div>
					<div className="item-container">
						<b><FormattedMessage id="map.calibration" /></b>
						<span style={{ color: props.map.origin && props.map.opposite ? 'black' : 'gray' }}>
							<FormattedMessage id={props.map.origin && props.map.opposite ? 'map.is.calibrated' : 'map.is.not.calibrated'} />
						</span>
						<Link to='/calibration' onClick={() => handleCalibrationSetting(CalibrationModeTypes.calibrate)}>
							<Button color='primary'>
								<FormattedMessage id='map.calibrate' />
							</Button>
						</Link>
					</div>
					<div className="edit-btn">
						<Button color='danger' onClick={handleDelete}>
							<FormattedMessage id='delete.map' />
						</Button>
					</div>
				</>
			)}
		</div>
	);
}

export default MapViewComponent;