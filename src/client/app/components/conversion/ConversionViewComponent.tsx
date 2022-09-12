/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
// Realize that * is already imported from react
import { useState } from 'react';
import { Button } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';
import EditConversionModalComponent from './EditConversionModalComponent';
import '../../styles/card-page.css';
import { ConversionData } from 'types/redux/conversions';
import { UnitDataById } from 'types/redux/units';
import translate from '../../utils/translate';

interface ConversionViewComponentProps {
	conversion: ConversionData;
	units: UnitDataById;
}

export default function ConversionViewComponent(props: ConversionViewComponentProps) {
	// Don't check if admin since only an admin is allow to route to this page.

	// Edit Modal Show
	const [showEditModal, setShowEditModal] = useState(false);

	const handleShow = () => {
		setShowEditModal(true);
	}

	const handleClose = () => {
		setShowEditModal(false);
	}

	// Create header from sourceId, destinationId identifiers
	// Arrow is bidirectional if conversion is bidirectional and one way if not.
	let arrowShown: string;
	if (props.conversion.bidirectional) {
		arrowShown = ' ↔ ';
	} else {
		arrowShown = ' → ';
	}
	const header = String(props.units[props.conversion.sourceId].identifier + arrowShown + props.units[props.conversion.destinationId].identifier);

	// Unlike the details component, we don't check if units are loaded since must come through that page.

	return (
		<div className="card">
			<div className="identifier-container">
				{header}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="conversion.source" /></b> {props.units[props.conversion.sourceId].identifier}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="conversion.destination" /></b> {props.units[props.conversion.destinationId].identifier}
			</div>
			<div className={props.conversion.bidirectional.toString()}>
				<b><FormattedMessage id="conversion.bidirectional" /></b> {translate(`TrueFalseType.${props.conversion.bidirectional.toString()}`)}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="conversion.slope" /></b> {props.conversion.slope}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="conversion.intercept" /></b> {props.conversion.intercept}
			</div>
			<div className="item-container">
				{/* Only show first 30 characters so card does not get too big. Should limit to one line */}
				<b><FormattedMessage id="conversion.note" /></b> {props.conversion.note.slice(0, 29)}
			</div>
			<div className="edit-btn">
				<Button variant="secondary" onClick={handleShow}>
					<FormattedMessage id="conversion.edit.conversion" />
				</Button>
				{/* Creates a child ConversionModalEditComponent */}
				<EditConversionModalComponent
					show={showEditModal}
					conversion={props.conversion}
					unitsState={props.units}
					header={header}
					handleShow={handleShow}
					handleClose={handleClose} />
			</div>
		</div>
	);
}
