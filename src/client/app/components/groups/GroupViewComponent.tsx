/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
//Realize that * is already imported from react
import { State } from 'types/redux/state';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Button } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import EditGroupModalComponent from './EditGroupModalComponent';
import '../../styles/card-page.css';
import { GroupDefinition } from 'types/redux/groups';
import { isRoleAdmin } from '../../utils/hasPermissions';
import { CurrentUserState } from 'types/redux/currentUser';
import translate from '../../utils/translate';
import { UnitData } from '../../types/redux/units';

// TODO
// Need to put child meters somewhere
// Get design document for other items
// protect some items to admin only

// TODO This duplicates code in EditMeterModalComponent. Need to put in some other place (utils? or where others are)
// and then import in both places

interface GroupViewComponentProps {
	group: GroupDefinition;
	currentUser: CurrentUserState;
	// This isn't used in this component but are passed to the edit component
	// This is done to avoid having to recalculate the possible units sets in each view component
	possibleGraphicUnits: Set<UnitData>;
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

	// current user state
	const currentUser = useSelector((state: State) => state.currentUser.profile);
	// Check for admin status
	const loggedInAsAdmin = (currentUser !== null) && isRoleAdmin(currentUser.role);

	// Set up to display the units associated with the group as the unit identifier.
	// current unit state
	const currentUnitState = useSelector((state: State) => state.units.units);
	// TODO-fix comment This is the default graphic unit associated with the group. See above for how code works.
	const graphicName = (Object.keys(currentUnitState).length === 0 || props.group.defaultGraphicUnit === -99) ?
		'no unit' : currentUnitState[props.group.defaultGraphicUnit].identifier;

	return (
		<div className="card">
			{/* Use identifier-container since similar and groups only have name */}
			<div className="identifier-container">
				{props.group.name}
			</div>
			<div className="item-container">
				{/* Use meter translation id string since same one wanted. */}
				<b><FormattedMessage id="meter.defaultGraphicUnit" /></b> {graphicName}
			</div>
			{loggedInAsAdmin &&
				<div className={props.group.displayable.toString()}>
					<b><FormattedMessage id="group.displayable" /></b> {translate(`TrueFalseType.${props.group.displayable.toString()}`)}
				</div>
			}
			{/* Only show first 30 characters so card does not get too big. Should limit to one line */}
			{loggedInAsAdmin &&
				<div className="item-container">
					<b><FormattedMessage id="group.note" /></b> {props.group.note?.slice(0, 29)}
				</div>
			}
			<div className="edit-btn">
				<Button variant="Secondary" onClick={handleShow}>
					{/* admins can edit a group but others can only view the details */}
					{loggedInAsAdmin ? <FormattedMessage id="edit.group" /> : <FormattedMessage id="group.details" />}
				</Button>
				{/* Creates a child GroupModalEditComponent */}
				<EditGroupModalComponent
					show={showEditModal}
					groupId={props.group.id}
					handleClose={handleClose}
					possibleGraphicUnits={props.possibleGraphicUnits} />
			</div>
		</div>
	);
}