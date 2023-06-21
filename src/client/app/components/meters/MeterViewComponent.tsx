/* This Source Code Form is subject to the terms of the Mozilla Public
  * License, v. 2.0. If a copy of the MPL was not distributed with this
  * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Button } from 'reactstrap';
import { State } from 'types/redux/state';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import EditMeterModalComponent from './EditMeterModalComponent';
import { MeterData } from 'types/redux/meters';
import translate from '../../utils/translate';
import { FormattedMessage } from 'react-intl';
import { isRoleAdmin } from '../../utils/hasPermissions';
import { CurrentUserState } from 'types/redux/currentUser';
import '../../styles/card-page.css';
import { UnitData} from '../../types/redux/units';
import { noUnitTranslated } from '../../utils/input';

interface MeterViewComponentProps {
	meter: MeterData;
	currentUser: CurrentUserState;
	// These two aren't used in this component but are passed to the edit component
	// This is done to avoid having to recalculate the possible units sets in each view component
	possibleMeterUnits: Set<UnitData>;
	possibleGraphicUnits: Set<UnitData>;
}

/**
 * Defines the meter info card
 * @param {object} props component props
 * @returns {Element} Meter info card
 */
export default function MeterViewComponent(props: MeterViewComponentProps) {
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

	// Set up to display the units associated with the meter as the unit identifier.
	// current unit state
	const currentUnitState = useSelector((state: State) => state.units.units);
	// This is the unit associated with the meter.
	// The first test of length is because the state may not yet be set when loading. This should not be seen
	// since the state should be set and the page redrawn so just use 'no unit'.
	// The second test of -99 is for meters without units.
	const unitName = (Object.keys(currentUnitState).length === 0 || props.meter.unitId === -99) ?
		noUnitTranslated().identifier : currentUnitState[props.meter.unitId].identifier;
	// This is the default graphic unit associated with the meter. See above for how code works.
	const graphicName = (Object.keys(currentUnitState).length === 0 || props.meter.defaultGraphicUnit === -99) ?
		noUnitTranslated().identifier : currentUnitState[props.meter.defaultGraphicUnit].identifier;

	// Only display limited data if not an admin.
	return (
		<div className="card">
			<div className="identifier-container">
				{props.meter.identifier}
			</div>
			{loggedInAsAdmin &&
				<div className="item-container">
					<b><FormattedMessage id="meter.name" /></b> {props.meter.name}
				</div>
			}
			<div className="item-container">
				<b><FormattedMessage id="meter.unitName" /></b> {unitName}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="meter.defaultGraphicUnit" /></b> {graphicName}
			</div>
			{loggedInAsAdmin &&
				<div className="item-container">
					<b><FormattedMessage id="meter.enabled" /></b> {translate(`TrueFalseType.${props.meter.enabled.toString()}`)}
				</div>
			}
			{loggedInAsAdmin &&
				<div className={props.meter.displayable.toString()}>
					<b><FormattedMessage id="meter.displayable" /></b> {translate(`TrueFalseType.${props.meter.displayable.toString()}`)}
				</div>
			}
			{loggedInAsAdmin &&
				<div className="item-container">
					{/* Only show first 30 characters so card does not get too big. Should limit to one line. Check in case null. */}
					<b><FormattedMessage id="meter.note" /></b> {props.meter.note?.slice(0, 29)}
				</div>
			}
			{loggedInAsAdmin &&
				<div className="edit-btn">
					<Button color="secondary" onClick={handleShow}>
						<FormattedMessage id="edit.meter" />
					</Button>
					{/* Creates a child MeterModalEditComponent */}
					<EditMeterModalComponent
						show={showEditModal}
						meter={props.meter}
						handleClose={handleClose}
						possibleMeterUnits={props.possibleMeterUnits}
						possibleGraphicUnits={props.possibleGraphicUnits} />
				</div>
			}
		</div>
	);
}
