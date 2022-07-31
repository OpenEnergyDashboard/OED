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
import { fetchMetersDetailsIfNeeded } from '../../actions/meters';
import { State } from '../../types/redux/state';
import { isRoleAdmin } from '../../utils/hasPermissions';
import { useEffect } from 'react';
import MeterViewComponent from './MeterViewComponent';
import CreateMeterModalComponent from './CreateMeterModalComponent';
import { MeterData } from 'types/redux/meters';

// Utilizes useDispatch and useSelector hooks
export default function MetersDetailComponent() {

	const dispatch = useDispatch();

	useEffect(() => {
		// Makes async call to Meters API for Meters details if one has not already been made somewhere else, stores Meter ids in state
		dispatch(fetchMetersDetailsIfNeeded());
	}, []);

	//Meters state
	const MetersState = useSelector((state: State) => state.meters.meters);

	// current user state
	const CurrentUserState = useSelector((state: State) => state.currentUser);

	// Check for admin status
	const currentUser = useSelector((state: State) => state.currentUser.profile);
	const loggedInAsAdmin = (currentUser !== null) && isRoleAdmin(currentUser.role);

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
				{loggedInAsAdmin &&
					<div className="edit-btn">
						<CreateMeterModalComponent />
					</div>}
				<div className="card-container">
					{/* Create a MeterViewComponent for each MeterData in Meters State after sorting by identifier */}
					{Object.values(MetersState)
						.sort((MeterA: MeterData, MeterB: MeterData) => (MeterA.identifier.toLowerCase() > MeterB.identifier.toLowerCase()) ? 1 :
							(( MeterB.identifier.toLowerCase() > MeterA.identifier.toLowerCase()) ? -1 : 0))
						.map(MeterData => (<MeterViewComponent meter={MeterData as MeterData} key={(MeterData as MeterData).id} currentUser={CurrentUserState}/>))}
				</div>
			</div>
			<FooterContainer />
		</div>
	);
}

