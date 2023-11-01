/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import HeaderComponent from '../../components/HeaderComponent';
import FooterContainer from '../../containers/FooterContainer';
import TooltipHelpContainer from '../../containers/TooltipHelpContainer';
import { metersApi } from '../../redux/api/metersApi';
import { useAppSelector } from '../../redux/hooks';
import { selectIsLoggedInAsAdmin } from '../../redux/selectors/authSelectors';
import { selectVisibleMetersGroupsDataByID } from '../../redux/selectors/dataSelectors';
import '../../styles/card-page.css';
import { MeterData } from '../../types/redux/meters';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import CreateMeterModalComponentWIP from './CreateMeterModalComponentWIP';
import MeterViewComponentWIP from './MeterViewComponentWIP';

/**
 * Defines the meters page card view
 * @returns Meters page element
 */
export default function MetersDetailComponent() {

	// Check for admin status
	const isAdmin = useAppSelector(state => selectIsLoggedInAsAdmin(state));
	// We only want displayable meters if non-admins because they still have
	// non-displayable in state.
	const { visibleMeters } = useAppSelector(selectVisibleMetersGroupsDataByID);
	const { isFetching } = metersApi.useGetMetersQuery()

	return (
		<div>
			<HeaderComponent />
			<TooltipHelpContainer page='meters' />

			<div className='container-fluid'>
				<h2 style={titleStyle}>
					<FormattedMessage id='meters' />
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='meters' helpTextId={getToolTipMessage(isAdmin)} />
					</div>
				</h2>
				{isAdmin &&
					<div className="edit-btn">
						<CreateMeterModalComponentWIP />
					</div>
				}
				{
					<div className="card-container">
						{/* Create a MeterViewComponent for each MeterData in Meters State after sorting by identifier */}
						{!isFetching && Object.values(visibleMeters)
							.sort((MeterA: MeterData, MeterB: MeterData) => (MeterA.identifier.toLowerCase() > MeterB.identifier.toLowerCase()) ? 1 :
								((MeterB.identifier.toLowerCase() > MeterA.identifier.toLowerCase()) ? -1 : 0))
							.map(MeterData => (
								<MeterViewComponentWIP
									key={`${MeterData.id}:${MeterData.identifier}`}
									meter={MeterData}
								/>
							))}
					</div>
				}
			</div>
			<FooterContainer />
		</div >
	);
}

const titleStyle: React.CSSProperties = {
	textAlign: 'center'
};



const tooltipStyle = {
	display: 'inline-block',
	fontSize: '50%'
};

// Switch help depending if admin or not.
const getToolTipMessage = (isAdmin: boolean) => isAdmin ? 'help.admin.meterview' : 'help.meters.meterview'