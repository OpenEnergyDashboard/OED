/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import TooltipHelpComponent from '../../components/TooltipHelpComponent';
import { useAppSelector } from '../../redux/hooks';
import { selectVisibleMeterAndGroupData } from '../../redux/selectors/adminSelectors';
import '../../styles/card-page.css';
import { MeterData } from '../../types/redux/meters';
import { UnitData, UnitType } from '../../types/redux/units';
import { noUnitTranslated, potentialGraphicUnits } from '../../utils/input';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import CreateMeterModalComponent from './CreateMeterModalComponent';
import MeterViewComponent from './MeterViewComponent';

import { selectCurrentUser, selectIsAdmin } from '../../reducers/currentUser';
import { selectUnitDataById } from '../../redux/api/unitsApi';

/**
 * Defines the meters page card view
 * @returns Meters page element
 */
export default function MetersDetailComponent() {
	// current user state
	const currentUserState = useAppSelector(selectCurrentUser);

	// Check for admin status
	const isAdmin = useAppSelector(selectIsAdmin);

	// We only want displayable meters if non-admins because they still have
	// non-displayable in state.
	const { visibleMeters } = useAppSelector(selectVisibleMeterAndGroupData);

	// Units state
	const unitDataById = useAppSelector(selectUnitDataById);

	// TODO? Convert into Selector?
	// Possible Meter Units to use
	let possibleMeterUnits = new Set<UnitData>();
	// The meter unit can be any unit of type meter.
	Object.values(unitDataById).forEach(unit => {
		if (unit.typeOfUnit == UnitType.meter) {
			possibleMeterUnits.add(unit);
		}
	});
	// Put in alphabetical order.
	possibleMeterUnits = new Set(_.sortBy(Array.from(possibleMeterUnits), unit => unit.identifier.toLowerCase(), 'asc'));
	// The default graphic unit can also be no unit/-99 but that is not desired so put last in list.
	possibleMeterUnits.add(noUnitTranslated());

	// Possible graphic units to use
	const possibleGraphicUnits = potentialGraphicUnits(unitDataById);

	const titleStyle: React.CSSProperties = {
		textAlign: 'center'
	};

	const tooltipStyle = {
		display: 'inline-block',
		fontSize: '50%',
		// Switch help depending if admin or not.
		tooltipMeterView: isAdmin ? 'help.admin.meterview' : 'help.meters.meterview'
	};

	return (
		<div>
			<TooltipHelpComponent page='meters' />

			<div className='container-fluid'>
				<h2 style={titleStyle}>
					<FormattedMessage id='meters' />
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='meters' helpTextId={tooltipStyle.tooltipMeterView} />
					</div>
				</h2>
				{isAdmin &&
					<div className="edit-btn">
						{/* The actual button for create is inside this component. */}
						<CreateMeterModalComponent
							possibleMeterUnits={possibleMeterUnits}
							possibleGraphicUnits={possibleGraphicUnits}
						/>
					</div>
				}
				{
					<div className="card-container">
						{visibleMeters.map(MeterData => (
							<MeterViewComponent
								meter={MeterData as MeterData}
								key={(MeterData as MeterData).id}
								currentUser={currentUserState}
								// These two props are used in the edit component (child of view component)
								possibleMeterUnits={possibleMeterUnits}
								possibleGraphicUnits={possibleGraphicUnits}
							/>
						))}
					</div>
				}
			</div>
		</div >
	);
}
