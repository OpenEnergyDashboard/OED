/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import GroupSidebarContainer from '../../containers/groups/GroupSidebarContainer';
import GroupViewContainer from '../../containers/groups/GroupViewContainer';


/**
 * Top-level React component that controls the home page
 * @return JSX to create the home page
 */

interface GroupsDetailProps {
	selectedGroups: number[];
	fetchGroupsDetailsIfNeeded(): Promise<any>;
	fetchMetersDetailsIfNeeded(): Promise<any>;
}
export default class GroupsDetailComponent extends React.Component<GroupsDetailProps, {}> {
	public componentWillMount() {
		this.props.fetchGroupsDetailsIfNeeded();
		this.props.fetchMetersDetailsIfNeeded();
	}
	public render() {
		const flexContainerStyle = {
			display: 'flex',
			flexFlow: 'row wrap'
		};
		const flexChildStyle = {
			marginRight: '10px'
		};
		return (
			<div className='row'>
				<div className='col-12 col-lg-12'>
					<GroupSidebarContainer />
				</div>
				<div className='col-12 col-lg-10' style={flexContainerStyle}>
					{this.props.selectedGroups.map(groupID => <div className='col-12 col-lg-4' style={flexChildStyle} key={groupID}>
							<GroupViewContainer key={groupID} id={groupID} />
						</div>
					)}
				</div>
			</div>
		);
	}
}

