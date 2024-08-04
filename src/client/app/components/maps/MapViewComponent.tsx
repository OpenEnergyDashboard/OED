/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { parseZone } from 'moment';
import '../../styles/card-page.css';
import EditMapModalComponent from './EditMapModalComponent';
import { selectMapById } from '../../redux/selectors/maps';
import { useAppSelector } from '../../redux/reduxHooks';
import { MapMetadata } from 'types/redux/map';
import translate from '../../utils/translate';
import { LocaleDataKey } from 'translations/data';
interface MapViewProps {
	mapID: number;
}

const MapViewComponent: React.FC<MapViewProps> = ({ mapID }) => {

	const map: MapMetadata = useAppSelector(selectMapById(mapID));

	// Helper function checks map to see if it's calibrated
	const getCalibrationStatus = () => {
		const isCalibrated = map.origin && map.opposite;
		return {
			color: isCalibrated ? 'black' : 'gray',
			messageId: isCalibrated ? 'map.is.calibrated' : 'map.is.not.calibrated'
		};
	};
	const { color, messageId } = getCalibrationStatus();

	return (
		<div className="card">
			<div className="identifier-container">
				{map.name}
			</div>
			<div className={map.displayable.toString()}>
				<b><FormattedMessage id="map.displayable" /></b> {translate(`TrueFalseType.${map.displayable.toString()}` as LocaleDataKey)}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="map.circle.size" /></b> {map.circleSize}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="note" /></b> {map.note ? map.note.slice(0, 29) : ''}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="map.filename" /></b> {map.filename}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="map.modified.date" /></b>
				{/* TODO I don't think this will properly internationalize. */}
				{parseZone(map.modifiedDate, undefined, true).format('dddd, MMM DD, YYYY hh:mm a')}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="map.calibration" /></b>
				<span style={{ color }}>
					<FormattedMessage id={messageId} />
				</span>
			</div>
			<EditMapModalComponent
				map={map}
			/>
		</div>
	);
};

export default MapViewComponent;