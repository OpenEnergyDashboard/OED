/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import HeaderContainer from '../../containers/HeaderContainer';
import FooterContainer from '../../containers/FooterContainer';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import { FormattedMessage } from 'react-intl';
import TooltipHelpContainer from '../../containers/TooltipHelpContainer';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { State } from '../../types/redux/state';
import { fetchAllGroupChildrenIfNeeded, fetchGroupsDetailsIfNeeded } from '../../actions/groups';
import { fetchMetersDetailsIfNeeded } from '../../actions/meters';
import { isRoleAdmin } from '../../utils/hasPermissions';
import { potentialGraphicUnits } from '../../utils/input';
import GroupViewComponent from './GroupViewComponent';
import CreateGroupModalComponent from './CreateGroupModalComponent';
import { GroupDefinition } from 'types/redux/groups';
import * as _ from 'lodash';

export default function GroupsDetailComponent() {
	const dispatch = useDispatch();

	// Groups state
	const groupsState = useSelector((state: State) => state.groups.byGroupID);
	// Groups state loaded status
	const groupsStateLoaded = useSelector((state: State) => state.groups.hasBeenFetchedOnce);
	// The immediate children of groups is loaded separately.
	const groupsAllChildrenLoaded = useSelector((state: State) => state.groups.hasChildrenBeenFetchedOnce);
	// Check for admin status
	const currentUser = useSelector((state: State) => state.currentUser.profile);
	const loggedInAsAdmin = (currentUser !== null) && isRoleAdmin(currentUser.role);

	// We only want displayable groups if non-admins because they still have
	// non-displayable in state.
	let visibleGroups;
	if (loggedInAsAdmin) {
		visibleGroups = groupsState;
	} else {
		visibleGroups = _.filter(groupsState, (group: GroupDefinition) => {
			return group.displayable === true
		});
	}

	// Units state
	const units = useSelector((state: State) => state.units.units);
	// Units state loaded status
	const unitsStateLoaded = useSelector((state: State) => state.units.hasBeenFetchedOnce);
	// Units state loaded status
	const metersStateLoaded = useSelector((state: State) => state.meters.hasBeenFetchedOnce);

	useEffect(() => {
		// Note each modal is created for each group when the details are created so get all state now for all groups.
		// Get meter details if needed
		dispatch(fetchMetersDetailsIfNeeded())
		// Makes async call to groups API for groups details if one has not already been made somewhere else, stores group ids in state
		dispatch(fetchGroupsDetailsIfNeeded());
		// TODO Is there a good way to integrate this into the actions so it must work correctly?
		// You need the basic group state loaded since going to modify.
		if (groupsStateLoaded) {
			// Get all groups' meter and group immediate children into state. Since all modals done for all groups
			// we get them all here.
			dispatch(fetchAllGroupChildrenIfNeeded());
		}
		// In case the group state was not yet loaded you need to do this again.
	}, [groupsStateLoaded, groupsAllChildrenLoaded]);

	// Possible graphic units to use
	const possibleGraphicUnits = potentialGraphicUnits(units);

	const titleStyle: React.CSSProperties = {
		textAlign: 'center'
	};

	const tooltipStyle = {
		display: 'inline-block',
		fontSize: '50%',
		// Switch help depending if admin or not.
		tooltipGroupView: loggedInAsAdmin ? 'help.admin.groupview' : 'help.groups.groupview'
	};

	return (
		<div>
			<div>
				<HeaderContainer />
				<TooltipHelpContainer page='groups' />

				<div className='container-fluid'>
					<h2 style={titleStyle}>
						<FormattedMessage id='groups' />
						<div style={tooltipStyle}>
							<TooltipMarkerComponent page='groups' helpTextId={tooltipStyle.tooltipGroupView} />
						</div>
					</h2>
					{loggedInAsAdmin && groupsStateLoaded &&
						<div className="edit-btn">
							{/* The actual button for create is inside this component. */}
							< CreateGroupModalComponent
								possibleGraphicUnits={possibleGraphicUnits}
							/>
						</div>
					}
					{groupsAllChildrenLoaded && groupsStateLoaded && unitsStateLoaded && metersStateLoaded &&
						<div className="card-container">
							{/* Create a GroupViewComponent for each groupData in Groups State after sorting by name */}
							{Object.values(visibleGroups)
								.sort((groupA: GroupDefinition, groupB: GroupDefinition) => (groupA.name.toLowerCase() > groupB.name.toLowerCase()) ? 1 :
									((groupB.name.toLowerCase() > groupA.name.toLowerCase()) ? -1 : 0))
								.map(groupData => (<GroupViewComponent
									group={groupData as GroupDefinition}
									key={(groupData as GroupDefinition).id}
									// This prop is used in the edit component (child of view component)
									possibleGraphicUnits={possibleGraphicUnits}
								/>))}
						</div>
					}
				</div>
				<FooterContainer />
			</div>
		</div>
	);
}
