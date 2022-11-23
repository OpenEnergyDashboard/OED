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
// import GroupXViewComponent from './GroupXViewComponent';
import CreateGroupModalComponent from './CreateGroupModalComponent';
// import { GroupData } from 'types/redux/Groups';

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
		tooltipUnitView: 'help.admin.unitview' // TODO
	};

	return (
		<div>
			<div>
				<HeaderContainer />
				<TooltipHelpContainer page='units' />

				<div className='container-fluid'>
					<h2 style={titleStyle}>
						<FormattedMessage id='groups' />
						<div style={tooltipStyle}>
							<TooltipMarkerComponent page='units' helpTextId={tooltipStyle.tooltipUnitView} />
						</div>
					</h2>
					<div className="edit-btn">
						{/* The actual button for create is inside this component. */}
						< CreateGroupModalComponent />
					</div>
					<div className="card-container">
						{/* Create a GroupXViewComponent for each groupData in Groups State after sorting by identifier */}
						{/* TODO {Object.values(groupsState)
							.sort((groupA: GroupData, groupB: GroupData) => (groupA.name.toLowerCase() > groupB.name.toLowerCase()) ? 1 :
								((groupB.name.toLowerCase() > groupA.name.toLowerCase()) ? -1 : 0))
							.map(groupData => (<GroupXViewComponent group={groupData as
							// TODO GroupData} key={(groupData as GroupData).id} />))}
							GroupData} key={-99} />))} */}
					</div>
				</div>
				<FooterContainer />
			</div>
		</div>
	);
}
