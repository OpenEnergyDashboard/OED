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
import EditMapModalComponent from './EditMapModalComponent';

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

function MapViewComponent(props: MapViewProps) {
	const [showEditModal, setShowEditModal] = useState(false);
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

	const handleShowModal = () => setShowEditModal(true);
	const handleCloseModal = () => setShowEditModal(false);

	return (
		<div className="map-card">
			<div className="identifier-container">
				{props.map.name} {props.isSubmitting ? '(Submitting)' : props.isEdited ? '(Edited)' : ''}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="map.displayable" /></b>
				<span style={{ color: props.map.displayable ? 'green' : 'red' }}>
					<FormattedMessage id={props.map.displayable ? 'map.is.displayable' : 'map.is.not.displayable'} />
				</span>
			</div>
			<div className="item-container">
				<b><FormattedMessage id="map.circle.size" /></b> {props.map.circleSize}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="map.modified.date" /></b>
				{moment.parseZone(props.map.modifiedDate, undefined, true).format('dddd, MMM DD, YYYY hh:mm a')}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="map.filename" /></b> {props.map.filename}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="note" /></b> {props.map.note}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="map.calibration" /></b>
				<span style={{ color: props.map.origin && props.map.opposite ? 'black' : 'gray' }}>
					<FormattedMessage id={props.map.origin && props.map.opposite ? 'map.is.calibrated' : 'map.is.not.calibrated'} />
				</span>
			</div>
			{hasToken() && (
				<div className="edit-btn">
					<Button color='secondary' onClick={handleShowModal}>
						<FormattedMessage id="edit.map" />
					</Button>
				</div>
			)}
			<EditMapModalComponent
				show={showEditModal}
				handleClose={handleCloseModal}
				map={props.map}
				editMapDetails={props.editMapDetails}
				setCalibration={props.setCalibration}
				removeMap={props.removeMap}
			/>
		</div>
	);
}

export default MapViewComponent;