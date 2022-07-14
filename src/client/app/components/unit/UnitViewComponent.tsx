/* This Source Code Form is subject to the terms of the Mozilla Public
  * License, v. 2.0. If a copy of the MPL was not distributed with this
  * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import * as React from 'react';
import { Button } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import EditUnitModalComponent from './EditUnitModalComponent';
import '../../styles/unit-card-page.css';
import { useSelector } from 'react-redux';
import { State } from '../../types/redux/state';
import { isRoleAdmin } from '../../utils/hasPermissions';
// I realize that * is already imported from react
import { useState } from 'react';
import { UnitData } from 'types/redux/units';

interface UnitViewComponentProps {
	unit: UnitData;
}

export default function UnitViewComponent(props: UnitViewComponentProps) {

	// Check for admin status
	const currentUser = useSelector((state: State) => state.currentUser.profile);
	const loggedInAsAdmin = (currentUser !== null) && isRoleAdmin(currentUser.role);

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
			<div className="identifier-container">
				{props.unit.name}
			</div>
			<div className="unit-container">
				<b><FormattedMessage id="unit.identifier" /></b> {props.unit.identifier}
			</div>
			<div className="unit-container">
				<b><FormattedMessage id="unit.type.of.unit" /></b> {props.unit.typeOfUnit}
			</div>
			<div className="unit-container">
				<b><FormattedMessage id="unit.represent" /></b> {props.unit.unitRepresent}
			</div>
			<div className="unit-container">
				<b><FormattedMessage id="unit.displayable" /></b> {props.unit.displayable}
			</div>
			<div className={props.unit.preferredDisplay.toString()}>
				<b><FormattedMessage id="unit.preferred.display" /></b> {props.unit.preferredDisplay.toString()}
			</div>
			<div className="unit-container">
				<b><FormattedMessage id="unit.sec.in.rate" /></b> {props.unit.secInRate}
			</div>
			<div className="unit-container">
				<b><FormattedMessage id="unit.suffix" /></b> {props.unit.suffix}
			</div>
			<div className="unit-container">
				{/* Only show first 30 characters so card does not get too big. Should limit to one line */}
				<b><FormattedMessage id="unit.note" /></b> {props.unit.note.slice(0, 29)}
			</div>
			{loggedInAsAdmin &&
				<div className="edit-btn">
					<Button variant="Secondary" onClick={handleShow}>
						<FormattedMessage id="edit.unit" />
					</Button>
					{/* Creates a child UnitModalEditComponent */}
					<EditUnitModalComponent show={showEditModal} unit={props.unit} handleClose={handleClose} />
				</div>
			}
		</div>
	);
}