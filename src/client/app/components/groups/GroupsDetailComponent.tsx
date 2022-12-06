/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { FormattedMessage } from 'react-intl';
import HeaderContainer from '../../containers/HeaderContainer';
import FooterContainer from '../../containers/FooterContainer';
import TooltipHelpContainer from '../../containers/TooltipHelpContainer';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { State } from '../../types/redux/state';
import { fetchGroupsDetailsIfNeeded } from '../../actions/groups';
import GroupViewComponent from './GroupViewComponent';
import CreateGroupModalComponent from './CreateGroupModalComponent';
import { GroupDefinition } from 'types/redux/groups';

export default function GroupsDetailComponent() {
	// TODO The route stops you from getting to this page if not an admin.

	const dispatch = useDispatch();

	useEffect(() => {
		// Makes async call to groups API for groups details if one has not already been made somewhere else, stores group ids in state
		dispatch(fetchGroupsDetailsIfNeeded());
	}, []);

	// Groups state
	const groupsState = useSelector((state: State) => state.groups.byGroupID);

	const titleStyle: React.CSSProperties = {
		textAlign: 'center'
	};

	const tooltipStyle = {
		display: 'inline-block',
		fontSize: '50%',
		tooltipGroupView: 'help.admin.groupview'
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
					<div className="edit-btn">
						{/* The actual button for create is inside this component. */}
						< CreateGroupModalComponent />
					</div>
					<div className="card-container">
						{/* Create a GroupViewComponent for each groupData in Groups State after sorting by identifier */}
						{Object.values(groupsState)
							.sort((groupA: GroupDefinition, groupB: GroupDefinition) => (groupA.name.toLowerCase() > groupB.name.toLowerCase()) ? 1 :
								((groupB.name.toLowerCase() > groupA.name.toLowerCase()) ? -1 : 0))
							.map(groupData => (<GroupViewComponent group={groupData as
								GroupDefinition} key={(groupData as GroupDefinition).id} />))}
					</div>
				</div>
				<FooterContainer />
			</div>
		</div>
	);
}
