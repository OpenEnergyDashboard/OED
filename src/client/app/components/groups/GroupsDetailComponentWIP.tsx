/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import TooltipHelpComponent from '../../components/TooltipHelpComponent';
import { useAppSelector } from '../../redux/hooks';
import { selectIsLoggedInAsAdmin } from '../../redux/selectors/authSelectors';
import { selectVisibleMetersGroupsDataByID } from '../../redux/selectors/dataSelectors';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import CreateGroupModalComponentWIP from './CreateGroupModalComponentWIP';
import GroupViewComponentWIP from './GroupViewComponentWIP';

/**
 * Defines the groups page card view
 * @returns Groups page element
 */
export default function GroupsDetailComponentWIP() {

	// Check for admin status
	const isAdmin = useAppSelector(state => selectIsLoggedInAsAdmin(state));

	// We only want displayable groups if non-admins because they still have non-displayable in state.
	const { visibleGroups } = useAppSelector(state => selectVisibleMetersGroupsDataByID(state));



	const titleStyle: React.CSSProperties = {
		textAlign: 'center'
	};

	const tooltipStyle = {
		display: 'inline-block',
		fontSize: '50%',
		// Switch help depending if admin or not.
		tooltipGroupView: isAdmin ? 'help.admin.groupview' : 'help.groups.groupview'
	};

	return (
		<div>
			<div>
				<TooltipHelpComponent page='groups' />

				<div className='container-fluid'>
					<h2 style={titleStyle}>
						<FormattedMessage id='groups' />
						<div style={tooltipStyle}>
							<TooltipMarkerComponent page='groups' helpTextId={tooltipStyle.tooltipGroupView} />
						</div>
					</h2>
					{isAdmin &&
						<div className="edit-btn">
							{/* The actual button for create is inside this component. */}
							< CreateGroupModalComponentWIP
							/>
						</div>
					}
					{
						<div className="card-container">
							{/* Create a GroupViewComponent for each groupData in Groups State after sorting by name */}
							{Object.values(visibleGroups)
								.sort((groupA, groupB) => (groupA.name.toLowerCase() > groupB.name.toLowerCase()) ? 1 :
									((groupB.name.toLowerCase() > groupA.name.toLowerCase()) ? -1 : 0))
								.map(groupData => (<GroupViewComponentWIP
									group={groupData}
									key={groupData.id}
								// This prop is used in the edit component (child of view component)
								/>))}
						</div>
					}
				</div>
			</div>
		</div>
	);
}
