/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from 'reactstrap';
import { Baseline } from '../../types/redux/baselines';
import '../../styles/card-page.css';
import { useTranslate } from '../../redux/componentHooks';
import EditBaselineModalComponent from './EditBaselineModalComponent';



interface BaselineViewComponentProps {
    baseline: Baseline;
}

/**
 * Defines the baseline info card
 * @param props defined above
 * @returns Baseline element
 */
export default function BaselineViewComponent(props: BaselineViewComponentProps) {
	const translate = useTranslate();
	// Don't check if admin since only an admin is allow to route to this page.

	// Edit Modal Show
	const [showEditModal, setShowEditModal] = useState(false);

	const handleShow = () => {
		setShowEditModal(true);
	};

	const handleClose = () => {
		setShowEditModal(false);
	};

	// // Create header from sourceId, destinationId identifiers
	// const conversionIdentifier = String(unitDataById[props.conversion.sourceId]?.identifier + conversionArrow(props.conversion.bidirectional) +
	// 	unitDataById[props.conversion.destinationId]?.identifier);


	return (
		<div className="card">
			{/* <div className="identifier-container">
				{conversionIdentifier}
			</div> */}
			<div className="item-container">
				<b><FormattedMessage id="baseline.value" /></b> {props.baseline.baselineValue}
			</div>
			<div className={props.baseline.isActive.toString()}>
				<b><FormattedMessage id="baseline.active" /></b> {translate(`TrueFalseType.${props.baseline.isActive.toString()}`)}
			</div>
			<div className="item-container">
				{/* Only show first 30 characters so card does not get too big. Should limit to one line */}
				<b><FormattedMessage id="note" /></b> {props.baseline.note.slice(0, 29)}
			</div>
			<div className="edit-btn">
				<Button color='secondary' onClick={handleShow}>
					<FormattedMessage id="baseline.edit.baseline" />
				</Button>
				{/* Creates a child ConversionModalEditComponent */}
				<EditBaselineModalComponent
					show={showEditModal}
					baseline={props.baseline}
					handleClose={handleClose}
					baselineIdentifier={props.baseline.meterId.toString()}
					handleShow={handleShow} />
			</div>
		</div>
	);
}