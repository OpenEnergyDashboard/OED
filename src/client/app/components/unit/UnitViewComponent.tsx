/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
//Realize that * is already imported from react
import { useState } from 'react';
import { Button } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import EditUnitModalComponent from './EditUnitModalComponent';
import '../../styles/card-page.css';
import { UnitData } from 'types/redux/units';
import translate from '../../utils/translate';
import { LocaleDataKey } from 'translations/data';

interface UnitViewComponentProps {
	unit: UnitData;
}

/**
 * Defines the unit info card
 * @param props variables passed in to define
 * @returns Unit info card element
 */
export default function UnitViewComponent(props: UnitViewComponentProps) {
	// Don't check if admin since only an admin is allow to route to this page.

	// Edit Modal Show
	const [showEditModal, setShowEditModal] = useState(false);

	const handleShow = () => {
		setShowEditModal(true);
	};

	const handleClose = () => {
		setShowEditModal(false);
	};

	return (
		<div className="card">
			<div className="identifier-container">
				{props.unit.identifier}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="name" /></b> {props.unit.name}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="unit.type.of.unit" /></b> {props.unit.typeOfUnit}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="unit.represent" /></b> {props.unit.unitRepresent}
			</div>
			<div className={props.unit.displayable.toString()}>
				<b><FormattedMessage id="displayable" /></b> {props.unit.displayable}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="unit.preferred.display" /></b> {translate(`TrueFalseType.${props.unit.preferredDisplay.toString()}` as LocaleDataKey)}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="unit.sec.in.rate" /></b> {props.unit.secInRate}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="unit.suffix" /></b> {props.unit.suffix}
			</div>
			<div className="item-container">
				{/* Only show first 30 characters so card does not get too big. Should limit to one line. Protect against null from DB in note. */}
				<b><FormattedMessage id="note" /></b> {props.unit.note ? props.unit.note.slice(0, 29) : ''}
			</div>
			<div className="edit-btn">
				<Button color='secondary' onClick={handleShow}>
					<FormattedMessage id="edit.unit" />
				</Button>
				{/* Creates a child UnitModalEditComponent */}
				<EditUnitModalComponent
					show={showEditModal}
					unit={props.unit}
					handleShow={handleShow}
					handleClose={handleClose} />
			</div>
		</div>
	);
}
