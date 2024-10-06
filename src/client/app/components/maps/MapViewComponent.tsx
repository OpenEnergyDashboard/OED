/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { parseZone } from 'moment';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { selectMapById } from '../../redux/api/mapsApi';
import { useAppSelector } from '../../redux/reduxHooks';
import { localEditsSlice } from '../../redux/slices/localEditsSlice';
import '../../styles/card-page.css';
import translate from '../../utils/translate';
import EditMapModalComponent from './EditMapModalComponent';
interface MapViewProps {
	mapID: number;
}

//TODO: Migrate to RTK
const MapViewComponent: React.FC<MapViewProps> = ({ mapID }) => {

	const apiMap = useAppSelector(state => selectMapById(state, mapID));
	const localEditMap = useAppSelector(state => localEditsSlice.selectors.selectLocalEdit(state, mapID));

	// Use local data first, if any
	const mapToDisplay = localEditMap ?? apiMap;

	// Helper function checks map to see if it's calibrated
	const getCalibrationStatus = () => {
		const isCalibrated = mapToDisplay.origin && mapToDisplay.opposite;
		return {
			color: isCalibrated ? 'black' : 'gray',
			messageId: isCalibrated ? 'map.is.calibrated' : 'map.is.not.calibrated'
		};
	};
	const { color, messageId } = getCalibrationStatus();

	return (
		<div className="card">
			<div className="identifier-container">
				{`${mapToDisplay.name}:${localEditMap ? ' (Unsaved Edits)' : ''}`}
			</div>
			<div className={mapToDisplay.displayable.toString()}>
				<b><FormattedMessage id="map.displayable" /></b> {translate(`TrueFalseType.${mapToDisplay.displayable.toString()}`)}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="map.circle.size" /></b> {mapToDisplay.circleSize}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="note" /></b> {mapToDisplay.note ? mapToDisplay.note.slice(0, 29) + ' ...' : ''}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="map.filename" /></b> {mapToDisplay.filename}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="map.modified.date" /></b>
				{/* TODO I don't think this will properly internationalize. */}
				{parseZone(apiMap.modifiedDate, undefined, true).format('dddd, MMM DD, YYYY hh:mm a')}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="map.calibration" /></b>
				<span style={{ color }}>
					<FormattedMessage id={messageId} />
				</span>
			</div>
			<EditMapModalComponent
				map={mapToDisplay}
			/>
		</div>
	);
};

export default MapViewComponent;
