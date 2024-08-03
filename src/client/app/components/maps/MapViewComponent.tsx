/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from 'reactstrap';
import { parseZone } from 'moment';
import '../../styles/card-page.css';
import EditMapModalComponent from './EditMapModalComponent';
import { selectMapById } from '../../redux/selectors/maps';
import { RootState } from '../../store';
import { useAppSelector } from '../../redux/reduxHooks';
import { MapMetadata } from 'types/redux/map';
interface MapViewProps {
	mapID: number;
}

const MapViewComponent: React.FC<MapViewProps> = ({ mapID }) => {
	const [showEditModal, setShowEditModal] = useState(false);
	const handleShow = () => setShowEditModal(true);
	const handleClose = () => setShowEditModal(false);

	const map: MapMetadata = useAppSelector((state: RootState) => selectMapById(state, mapID));

	return (
		<div className="card">
			<div className="identifier-container">
				{map.name}
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
				<b><FormattedMessage id="note" /></b> {map.note ? map.note.slice(0,29) : ''}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="map.filename" /></b> {map.filename}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="map.modified.date" /></b>
				{parseZone(map.modifiedDate, undefined, true).format('dddd, MMM DD, YYYY hh:mm a')}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="map.calibration" /></b>
				<span style={{ color: map.origin && map.opposite ? 'black' : 'gray' }}>
					<FormattedMessage id={map.origin && map.opposite ? 'map.is.calibrated' : 'map.is.not.calibrated'} />
				</span>
			</div>
			{(
				<div className="edit-btn">
					<Button color='secondary' onClick={handleShow}>
						<FormattedMessage id="edit.map" />
					</Button>
				</div>
			)}
			<EditMapModalComponent
				show={showEditModal}
				handleClose={handleClose}
				map={map}
			/>
		</div>
	);
};

export default MapViewComponent;