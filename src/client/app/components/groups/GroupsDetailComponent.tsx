/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import GroupSidebarContainer from '../../containers/groups/GroupSidebarContainer';
import GroupViewContainer from '../../containers/groups/GroupViewContainer';
import HeaderContainer from '../../containers/HeaderContainer';
import FooterComponent from '../FooterComponent';
import TooltipHelpComponent from '../TooltipHelpComponentAlternative';

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
			<div>
				<HeaderContainer />
				<TooltipHelpComponent page='groups' />
				<div className='container-fluid'>
					<div className='row'>
						<div className='col-12 col-lg-2'>
							<GroupSidebarContainer />
						</div>
						<div className='col-12 col-lg-10' style={flexContainerStyle}>
							{this.props.selectedGroups.map(groupID =>
								<div className='col-12 col-lg-4' style={flexChildStyle} key={groupID}>
									<GroupViewContainer key={groupID} id={groupID} />
								</div>
							)}
						</div>
					</div>
				</div>
				<FooterComponent />
			</div>
		);
	}
}
