/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import HeaderComponent from '../HeaderComponent';
import GroupViewContainer from '../../containers/groups/GroupViewContainer';
import GroupSidebarContainer from '../../containers/groups/GroupSidebarContainer';
import CreateGroupContainer from '../../containers/groups/CreateGroupContainer';
import EditGroupsContainer from '../../containers/groups/EditGroupsContainer';

export default class GroupComponent extends React.Component {
	componentWillMount() {
		this.props.fetchGroupsDetailsIfNeeded();
		this.props.fetchMetersDetailsIfNeeded();
		this.props.selectGroups(this.props.selectedGroups);
	}

	render() {
		const divPaddingStyle = {
			paddingTop: '50px'
		};
		let GroupDisplay = null;
		if (this.props.displayMode === 'create') {
			GroupDisplay = (
				<div>
					<CreateGroupContainer />
				</div>
			);
		} else if (this.props.displayMode === 'edit') {
			GroupDisplay = (
				<div>
					<EditGroupsContainer />
				</div>
			);
		} else { // view groups
			GroupDisplay = (
				<div>
					<div className="col-xs-2" style={divPaddingStyle}>
						<GroupSidebarContainer />
					</div>
					<div className="col-xs-4">
						{this.props.selectedGroups.map(groupID =>
							<GroupViewContainer key={groupID} id={groupID} />
						)}
					</div>
				</div>
			);
		}

		return (
			<div>
				<HeaderComponent title="Groups" />
				<div className="container-fluid">
					<div className="col-xs-11">
						{ GroupDisplay }
					</div>
				</div>
			</div>
		);
	}
}
