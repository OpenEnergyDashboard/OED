/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
// Realize that * is already imported from react
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from 'reactstrap';
import { GroupData } from 'types/redux/groups';
import { selectUnitDataById } from '../../redux/api/unitsApi';
import { useAppSelector } from '../../redux/reduxHooks';
import { selectIsAdmin } from '../../redux/slices/currentUserSlice';
import '../../styles/card-page.css';
import { noUnitTranslated } from '../../utils/input';
import { useTranslate } from '../../redux/componentHooks';
import EditGroupModalComponent from './EditGroupModalComponent';

interface GroupViewComponentProps {
	group: GroupData;
}

/**
 * Defines the group info card
 * @param props variables passed in to define
 * @returns Group info card element
 */
export default function GroupViewComponent(props: GroupViewComponentProps) {
	const translate = useTranslate();
	// Don't check if admin since only an admin is allowed to route to this page.

	// Edit Modal Show
	const [showEditModal, setShowEditModal] = useState(false);

	const handleShow = () => {
		setShowEditModal(true);
	};

	const handleClose = () => {
		setShowEditModal(false);
	};

	// Check for admin status
	const loggedInAsAdmin = useAppSelector(selectIsAdmin);

	// Set up to display the units associated with the group as the unit identifier.
	// unit state
	const unitDataById = useAppSelector(selectUnitDataById);


	return (
		<div className="card">
			{/* Use identifier-container since similar and groups only have name */}
			<div className="identifier-container">
				{props.group.name}
			</div>
			<div className="item-container">
				{/* Use meter translation id string since same one wanted. */}
				<b><FormattedMessage id="defaultGraphicUnit" /></b>
				{/* This is the default graphic unit associated with the group or no unit if none. */}
				{props.group.defaultGraphicUnit === -99 ? ' ' + noUnitTranslated().identifier : ' ' + unitDataById[props.group.defaultGraphicUnit].identifier}
			</div>
			{loggedInAsAdmin &&
				<div className={props.group.displayable.toString()}>
					<b><FormattedMessage id="displayable" /></b> {translate(`TrueFalseType.${props.group.displayable.toString()}`)}
				</div>
			}
			{/* Only show first 30 characters so card does not get too big. Should limit to one line */}
			{loggedInAsAdmin &&
				<div className="item-container">
					<b><FormattedMessage id="note" /> </b> {props.group.note?.slice(0, 29)}
				</div>
			}
			<div className="edit-btn">
				<Button color='secondary' onClick={handleShow}>
					{/* admins can edit a group but others can only view the details */}
					{loggedInAsAdmin ? <FormattedMessage id="edit.group" /> : <FormattedMessage id="group.details" />}
				</Button>
				{/* Creates a child GroupModalEditComponent */}
				<EditGroupModalComponent
					show={showEditModal}
					groupId={props.group.id}
					handleShow={handleShow}
					handleClose={handleClose} />
			</div>
		</div>
	);
}
