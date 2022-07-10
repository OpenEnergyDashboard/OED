/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import HeaderContainer from '../../containers/HeaderContainer';
import FooterContainer from '../../containers/FooterContainer';
import TooltipHelpContainer from '../../containers/TooltipHelpContainer';
import UnsavedWarningContainer from '../../containers/UnsavedWarningContainer';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import { useDispatch, useSelector } from 'react-redux';
import {fetchUnitsDetailsIfNeeded } from '../../actions/units';
import { State } from '../../types/redux/state';
import { isRoleAdmin } from '../../utils/hasPermissions';
import { useEffect } from 'react';
import UnitViewComponent from './UnitViewComponent';
import CreateUnitModalComponent from './CreateUnitModalComponent';

//Utilizes useDispatch and useSelector hooks
export default function UnitsDetailComponent() {

	const dispatch = useDispatch();

	useEffect(() => {
		//Makes async call to units API for units details if one has not already been made somewhere else, stores unit ids in state
		dispatch(fetchUnitsDetailsIfNeeded());
	}, []);

	//Maps unit id keys from state to const
	const units = Object.keys(useSelector((state: State) => state.units.units)) //Why are we parsing only the unitId from the unitData here if we are just going to retrieve the unitData from state again in the child UnitViewComponent?
						.map(key => parseInt(key))
						.filter(key => !isNaN(key));
	
	//Check for admin status
	const currentUser = useSelector((state: State) => state.currentUser.profile);
	const loggedInAsAdmin = (currentUser !== null) && isRoleAdmin(currentUser.role);

	const titleStyle: React.CSSProperties = {
		textAlign: 'center'
	};

	const tooltipStyle = {
		display: 'inline-block',
		fontSize: '50%',
		// TODO add text for tooltips.
		tooltipUnitView: loggedInAsAdmin? 'help.admin.unitview' : 'help.units.unitview'
	};
	return (
		<div>
			<UnsavedWarningContainer />
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
					<CreateUnitModalComponent/>
				</div>}
				<div className="card-container">
					{ units.map(unitID =>
						( <UnitViewComponent unitId={unitID} key={unitID}/> ))}
				</div>
			</div>
			<FooterContainer />
		</div>
	);
}
