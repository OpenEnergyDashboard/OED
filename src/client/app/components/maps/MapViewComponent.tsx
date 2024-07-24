/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useState, useEffect } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from 'reactstrap';
import * as moment from 'moment';
import { CalibrationModeTypes, MapMetadata } from '../../types/redux/map';
import { hasToken } from '../../utils/token';
import '../../styles/card-page.css';
import EditMapModalComponent from './EditMapModalComponent';


interface MapViewProps {
	id: number;
	map: MapMetadata;
	isEdited: boolean;
	isSubmitting: boolean;
	editMapDetails(map: MapMetadata): any;
	setCalibration(mode: CalibrationModeTypes, mapID: number): any;
	removeMap(id: number): any;
}

// editMapDetails: (map: MapMetadata) => void;
// setCalibration: (mode: CalibrationModeTypes, mapID: number) => void;
// removeMap: (id: number) => void;

const MapViewComponent: React.FC<MapViewProps> = ({ map, isEdited, isSubmitting, editMapDetails, setCalibration, removeMap }) => {
	const [showEditModal, setShowEditModal] = useState(false);

	useEffect(() => {
		if (isEdited) {
			//updateUnsavedChanges();
		}
	}, [isEdited]);

	const handleShowModal = () => setShowEditModal(true);
	const handleCloseModal = () => setShowEditModal(false);

	return (
		<div className="card">
			<div className="identifier-container">
				{map.name} {isSubmitting ? '(Submitting)' : isEdited ? '(Edited)' : ''}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="map.displayable" /></b>
				<span style={{ color: map.displayable ? 'green' : 'red' }}>
					<FormattedMessage id={map.displayable ? 'map.is.displayable' : 'map.is.not.displayable'} />
				</span>
			</div>
			<div className="item-container">
				<b><FormattedMessage id="map.circle.size" /></b> {map.circleSize}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="map.modified.date" /></b>
				{moment.parseZone(map.modifiedDate, undefined, true).format('dddd, MMM DD, YYYY hh:mm a')}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="map.filename" /></b> {map.filename}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="note" /></b> {map.note}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="map.calibration" /></b>
				<span style={{ color: map.origin && map.opposite ? 'black' : 'gray' }}>
					<FormattedMessage id={map.origin && map.opposite ? 'map.is.calibrated' : 'map.is.not.calibrated'} />
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
				map={map}
				setCalibration={setCalibration}
				editMapDetails={editMapDetails}
				removeMap={removeMap}
			/>
		</div>
	);
};

export default MapViewComponent;