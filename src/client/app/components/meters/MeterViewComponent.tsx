/* This Source Code Form is subject to the terms of the Mozilla Public
  * License, v. 2.0. If a copy of the MPL was not distributed with this
  * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import * as React from 'react';
import { Button } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import { useState } from 'react';
import EditMeterModalComponent from './EditMeterModalComponent';
import { MeterData } from 'types/redux/meters';
import translate from '../../utils/translate';
import '../../styles/unit-card-page.css';
import { useSelector } from 'react-redux';
import { isRoleAdmin } from '../../utils/hasPermissions';
import { State } from 'types/redux/state';
import { CurrentUserState } from 'types/redux/currentUser';

interface MeterViewComponentProps {
	meter: MeterData;
	currentUser: CurrentUserState;
}

export default function MeterViewComponent(props: MeterViewComponentProps) {
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
	const CurrentUserState = useSelector((state: State) => state.currentUser);

	// Check for admin status
	const currentUser = useSelector((state: State) => state.currentUser.profile);
	const loggedInAsAdmin = (currentUser !== null) && isRoleAdmin(currentUser.role);

	return (
		<div className="card">
			<div className="identifier-container">
				{props.meter.identifier}
			</div>
			<div className="meter-container">
				<b><FormattedMessage id="meter.name" /></b> {props.meter.name}
			</div>
			{loggedInAsAdmin &&
				<div className="meter-container">
					<b><FormattedMessage id="meter.enabled" /></b> {translate(`TrueFalseType.${props.meter.enabled.toString()}`)}
				</div>
			}
			{loggedInAsAdmin &&
				<div className="meter-container">
					<b><FormattedMessage id="meter.displayable" /></b> {translate(`TrueFalseType.${props.meter.displayable.toString()}`)}
				</div>
			}
			{loggedInAsAdmin &&
				<div className="edit-btn">
					<Button variant="Secondary" onClick={handleShow}>
						<FormattedMessage id="edit.meter" />
					</Button>
					{/* Creates a child MeterModalEditComponent */}
					<EditMeterModalComponent show={showEditModal} meter={props.meter} handleClose={handleClose} currentUser={CurrentUserState} />
				</div>
			}
		</div>
	);
}
