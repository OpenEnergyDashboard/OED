/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import GroupViewContainer from '../../containers/groups/GroupViewContainer';
import GroupSidebarContainer from '../../containers/groups/GroupSidebarContainer';
import HeaderComponent from '../HeaderComponent';

export default class GroupComponent extends React.Component {
	componentWillMount() {
		this.props.fetchGroupsDetailsIfNeeded();
		this.props.fetchMetersDetailsIfNeeded();
		this.props.selectGroups(this.props.selectedGroups);
	}

	render() {
		return (
			<div>
				<HeaderComponent title="Groups" />
				<div className="container-fluid">
					<div className="col-xs-11">
						<div className="col-xs-2">
							<GroupSidebarContainer />
						</div>
						<div className="col-xs-4">
							{this.props.selectedGroups.map(groupID =>
								<GroupViewContainer key={groupID} id={groupID} />
							)}
						</div>
					</div>
				</div>
			</div>
		);
	}
}
