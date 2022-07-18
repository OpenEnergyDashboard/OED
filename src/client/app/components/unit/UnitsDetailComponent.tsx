/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import HeaderContainer from '../../containers/HeaderContainer';
import FooterContainer from '../../containers/FooterContainer';
import TooltipHelpContainer from '../../containers/TooltipHelpContainer';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUnitsDetailsIfNeeded } from '../../actions/units';
import { State } from '../../types/redux/state';
import { isRoleAdmin } from '../../utils/hasPermissions';
import { useEffect } from 'react';
import UnitViewComponent from './UnitViewComponent';
import CreateUnitModalComponent from './CreateUnitModalComponent';
import { UnitData } from 'types/redux/units';

// Utilizes useDispatch and useSelector hooks
export default function UnitsDetailComponent() {

	const dispatch = useDispatch();

	useEffect(() => {
		// Makes async call to units API for units details if one has not already been made somewhere else, stores unit ids in state
		dispatch(fetchUnitsDetailsIfNeeded());
	}, []);

	//Units state
	const unitsState = useSelector((state: State) => state.units.units);

	// Check for admin status
	const currentUser = useSelector((state: State) => state.currentUser.profile);
	const loggedInAsAdmin = (currentUser !== null) && isRoleAdmin(currentUser.role);

	const titleStyle: React.CSSProperties = {
		textAlign: 'center'
	};

	const tooltipStyle = {
		display: 'inline-block',
		fontSize: '50%',
		// For now, only an admin can see the unit page.
		tooltipUnitView: 'help.admin.unitview'
	};
	return (
		<div>
			<HeaderContainer />
			<TooltipHelpContainer page='units' />

			<div className='container-fluid'>
				<h2 style={titleStyle}>
					<FormattedMessage id='units' />
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='units' helpTextId={tooltipStyle.tooltipUnitView} />
					</div>
				</h2>
				{loggedInAsAdmin &&
					<div className="edit-btn">
						<CreateUnitModalComponent />
					</div>}
				<div className="card-container">
					{/* Create a UnitViewComponent for each UnitData in Units State after sorting by identifier */}
					{Object.values(unitsState)
						.sort((unitA: UnitData, unitB: UnitData) => (unitA.name.toLowerCase() > unitB.name.toLowerCase()) ? 1 :
							(( unitB.name.toLowerCase() > unitA.name.toLowerCase()) ? -1 : 0))
						.map(unitData => (<UnitViewComponent unit={unitData as UnitData} key={(unitData as UnitData).id} />))}
				</div>
			</div>
			<FooterContainer />
		</div>
	);
}
