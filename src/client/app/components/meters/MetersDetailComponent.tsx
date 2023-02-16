/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import HeaderContainer from '../../containers/HeaderContainer';
import FooterContainer from '../../containers/FooterContainer';
import TooltipHelpContainer from '../../containers/TooltipHelpContainer';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import { State } from '../../types/redux/state';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { fetchMetersDetailsIfNeeded } from '../../actions/meters';
import { isRoleAdmin } from '../../utils/hasPermissions';
import MeterViewComponent from './MeterViewComponent';
import CreateMeterModalComponent from './CreateMeterModalComponent';
import { MeterData } from 'types/redux/meters';
import '../../styles/card-page.css';
import { UnitData, DisplayableType, UnitRepresentType, UnitType } from '../../types/redux/units';
import * as _ from 'lodash';

export default function MetersDetailComponent() {

	const dispatch = useDispatch();

	useEffect(() => {
		// Makes async call to Meters API for Meters details if one has not already been made somewhere else, stores Meter ids in state
		dispatch(fetchMetersDetailsIfNeeded());
	}, []);

	// Meters state
	const MetersState = useSelector((state: State) => state.meters.byMeterID);
	// Meters state loaded status
	const metersStateLoaded = useSelector((state: State) => state.meters.hasBeenFetchedOnce);
	// current user state
	const currentUserState = useSelector((state: State) => state.currentUser);

	// Check for admin status
	const currentUser = useSelector((state: State) => state.currentUser.profile);
	const loggedInAsAdmin = (currentUser !== null) && isRoleAdmin(currentUser.role);

	// We only want displayable meters if non-admins because they still have
	// non-displayable in state.
	let visibleMeters
	if (loggedInAsAdmin) {
		visibleMeters = MetersState;
	} else {
		visibleMeters = _.filter(MetersState, (meter: MeterData) => {
			return meter.displayable === true
		});
	}

	// Units state
	const units = useSelector((state: State) => state.units.units);
	// Units state loaded status
	const unitsStateLoaded = useSelector((state: State) => state.units.hasBeenFetchedOnce);

	// A non-unit
	const noUnit: UnitData = {
		// Only needs the id and identifier, others are dummy values.
		id: -99,
		name: '',
		identifier: 'no unit',
		unitRepresent: UnitRepresentType.unused,
		secInRate: 99,
		typeOfUnit: UnitType.unit,
		unitIndex: -99,
		suffix: '',
		displayable: DisplayableType.none,
		preferredDisplay: false,
		note: ''
	}
	// Possible Meter Units
	let possibleMeterUnits = new Set<UnitData>();
	let possibleGraphicUnits = new Set<UnitData>();
	let possibleMeterAreaUnits = new Set<UnitData>();

	// The meter unit can be any unit of type meter.
	Object.values(units).forEach(unit => {
		if (unit.typeOfUnit == UnitType.meter) {
			possibleMeterUnits.add(unit);
		}
	});
	// Put in alphabetical order.
	possibleMeterUnits = new Set(_.sortBy(Array.from(possibleMeterUnits), unit => unit.identifier.toLowerCase(), 'asc'));
	// The default graphic unit can also be no unit/-99 but that is not desired so put last in list.
	possibleMeterUnits.add(noUnit);

	// Possible Graphic Units
	// The default graphic unit can be any unit of type unit or suffix.
	Object.values(units).forEach(unit => {
		if (unit.typeOfUnit == UnitType.unit || unit.typeOfUnit == UnitType.suffix) {
			possibleGraphicUnits.add(unit);
		}
	});
	// Put in alphabetical order.
	possibleGraphicUnits = new Set(_.sortBy(Array.from(possibleGraphicUnits), unit => unit.identifier.toLowerCase(), 'asc'));
	// The default graphic unit can also be no unit/-99 but that is not desired so put last in list.
	possibleGraphicUnits.add(noUnit);

	// The meter area unit can be any unit of type area.
	Object.values(units).forEach(unit => {
		if (unit.typeOfUnit == UnitType.area) {
			possibleMeterAreaUnits.add(unit);
		}
	});
	// Put in alphabetical order.
	possibleMeterAreaUnits = new Set(_.sortBy(Array.from(possibleMeterAreaUnits), unit => unit.identifier.toLowerCase(), 'asc'));
	// The default graphic unit can also be no unit/-99 but that is not desired so put last in list.
	possibleMeterAreaUnits.add(noUnit);

	const titleStyle: React.CSSProperties = {
		textAlign: 'center'
	};

	const tooltipStyle = {
		display: 'inline-block',
		fontSize: '50%',
		// Switch help depending if admin or not.
		tooltipMeterView: loggedInAsAdmin ? 'help.admin.meterview' : 'help.meters.meterview'
	};

	return (
		<div>
			<HeaderContainer />
			<TooltipHelpContainer page='meters' />

			<div className='container-fluid'>
				<h2 style={titleStyle}>
					<FormattedMessage id='meters' />
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='meters' helpTextId={tooltipStyle.tooltipMeterView} />
					</div>
				</h2>
				{loggedInAsAdmin && metersStateLoaded && unitsStateLoaded &&
					<div className="edit-btn">
						{/* The actual button for create is inside this component. */}
						<CreateMeterModalComponent
							possibleMeterUnits={possibleMeterUnits}
							possibleGraphicUnits={possibleGraphicUnits}
							possibleMeterAreaUnits={possibleMeterAreaUnits}
						/>
					</div>
				}
				{metersStateLoaded && unitsStateLoaded &&
					<div className="card-container">
						{/* Create a MeterViewComponent for each MeterData in Meters State after sorting by identifier */}
						{Object.values(visibleMeters)
							.sort((MeterA: MeterData, MeterB: MeterData) => (MeterA.identifier.toLowerCase() > MeterB.identifier.toLowerCase()) ? 1 :
								((MeterB.identifier.toLowerCase() > MeterA.identifier.toLowerCase()) ? -1 : 0))
							.map(MeterData => (<MeterViewComponent
								meter={MeterData as MeterData}
								key={(MeterData as MeterData).id}
								currentUser={currentUserState}
								// These two props are used in the edit component (child of view component)
								possibleMeterUnits={possibleMeterUnits}
								possibleGraphicUnits={possibleGraphicUnits}
								possibleMeterAreaUnits={possibleMeterAreaUnits} />))}
					</div>
				}
			</div>
			<FooterContainer />
		</div>
	);
}
