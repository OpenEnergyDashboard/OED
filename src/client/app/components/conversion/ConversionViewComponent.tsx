/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
// Realize that * is already imported from react
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from 'reactstrap';
import { ConversionData } from 'types/redux/conversions';
import { selectUnitDataById } from '../../redux/api/unitsApi';
import { useAppSelector } from '../../redux/reduxHooks';
import '../../styles/card-page.css';
import { conversionArrow } from '../../utils/conversionArrow';
import translate from '../../utils/translate';
import EditConversionModalComponent from './EditConversionModalComponent';

interface ConversionViewComponentProps {
	conversion: ConversionData;
}

/**
 * Defines the conversion info card
 * @param props defined above
 * @returns Single conversion element
 */
export default function ConversionViewComponent(props: ConversionViewComponentProps) {
	// Don't check if admin since only an admin is allow to route to this page.

	// Edit Modal Show
	const [showEditModal, setShowEditModal] = useState(false);
	const unitDataById = useAppSelector(selectUnitDataById);

	const handleShow = () => {
		setShowEditModal(true);
	};

	const handleClose = () => {
		setShowEditModal(false);
	};

	// Create header from sourceId, destinationId identifiers
	const conversionIdentifier = String(unitDataById[props.conversion.sourceId]?.identifier + conversionArrow(props.conversion.bidirectional) +
		unitDataById[props.conversion.destinationId]?.identifier);

	// Unlike the details component, we don't check if units are loaded since must come through that page.

	return (
		<div className="card">
			<div className="identifier-container">
				{conversionIdentifier}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="conversion.source" /></b> {unitDataById[props.conversion.sourceId]?.identifier}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="conversion.destination" /></b> {unitDataById[props.conversion.destinationId]?.identifier}
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
				<b><FormattedMessage id="note" /></b> {props.conversion.note.slice(0, 29)}
			</div>
			<div className="edit-btn">
				<Button color='secondary' onClick={handleShow}>
					<FormattedMessage id="conversion.edit.conversion" />
				</Button>
				{/* Creates a child ConversionModalEditComponent */}
				<EditConversionModalComponent
					show={showEditModal}
					conversion={props.conversion}
					conversionIdentifier={conversionIdentifier}
					handleShow={handleShow}
					handleClose={handleClose} />
			</div>
		</div>
	);
}
