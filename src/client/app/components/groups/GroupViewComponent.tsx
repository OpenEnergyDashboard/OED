/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
//Realize that * is already imported from react
import { useState } from 'react';
import { Button } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
// TODO import EditGroupModalComponent from './EditGroupModalComponent';
import '../../styles/card-page.css';
import { GroupDefinition } from 'types/redux/Groups';
import translate from '../../utils/translate';
import { GPSPoint } from '../../utils/calibration';

// TODO
// Need to put child meters somewhere
// Get design document for other items

// TODO This duplicates code in EditMeterModalComponent. Need to put in some other place (utils? or where others are)
// and then import in both places

// get string value from GPSPoint or null.
function getGPSString(gps: GPSPoint | null) {
	if (gps === null) {
		//  if gps is null return empty string value
		return '';
	}
	else if (typeof gps === 'object') {
		// if gps is an object parse GPSPoint and return string value
		const json = JSON.stringify({ gps });
		const obj = JSON.parse(json);
		return `${obj.gps.latitude}, ${obj.gps.longitude}`;
	}
	else {
		// Assume it is a string that was input.
		return gps
	}
}

interface GroupViewComponentProps {
	group: GroupDefinition;
}

export default function GroupViewComponent(props: GroupViewComponentProps) {
	// Don't check if admin since only an admin is allow to route to this page.

	// Edit Modal Show
	const [showEditModal, setShowEditModal] = useState(false);

	const handleShow = () => {
		setShowEditModal(true);
	}

	const handleClose = () => {
		setShowEditModal(false);
	}

	return (
		<div className="card">
			{/* Use identifier-container since similar and groups only have name */}
			<div className="identifier-container">
				{props.group.name}
			</div>
			<div className={props.group.displayable.toString()}>
				<b><FormattedMessage id="group.displayable" /></b> {translate(`TrueFalseType.${props.group.displayable.toString()}`)}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="group.area" /></b> {props.group.area}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="group.gps" /></b> {getGPSString(props.group.gps)}
			</div>
			{/* Only show first 30 characters so card does not get too big. Should limit to one line */}
			<div className="item-container">
				<b><FormattedMessage id="group.note" /></b> {props.group.note?.slice(0, 29)}
			</div>
			<div className="edit-btn">
				<Button variant="Secondary" onClick={handleShow}>
					<FormattedMessage id="edit.unit" />
				</Button>
				{/* Creates a child UnitModalEditComponent */}
				{/* <EditUnitModalComponent
					show={showEditModal}
					unit={props.unit}
					handleClose={handleClose} /> */}
			</div>
		</div>
	);
}