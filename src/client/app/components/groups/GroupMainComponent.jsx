/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import HeaderComponent from '../HeaderComponent';
import FooterComponent from '../FooterComponent';
import GroupViewContainer from '../../containers/groups/GroupViewContainer';
import GroupSidebarContainer from '../../containers/groups/GroupSidebarContainer';
import CreateGroupContainer from '../../containers/groups/CreateGroupContainer';
import EditGroupsContainer from '../../containers/groups/EditGroupsContainer';
import { DISPLAY_MODE } from '../../actions/groups';

export default class GroupMainComponent extends React.Component {
	componentWillMount() {
		this.props.fetchGroupsDetailsIfNeeded();
		this.props.fetchMetersDetailsIfNeeded();
	}

	render() {
		const divPaddingStyle = {
			paddingTop: '50px'
		};
		let GroupDisplay = null;
		switch (this.props.displayMode) {
			case DISPLAY_MODE.CREATE: {
				GroupDisplay = (
					<div>
						<CreateGroupContainer />
					</div>
				);
				break;
			}
			case DISPLAY_MODE.EDIT: {
				GroupDisplay = (
					<div>
						<EditGroupsContainer />
					</div>
				);
				break;
			}
			case DISPLAY_MODE.VIEW: {
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
				break;
			}
			default: {
				console.error('Encountered invalid display mode');
			}
		}

		return (
			<div>
				<HeaderComponent title="Groups" />
				<div className="container-fluid">
					<div className="col-xs-11">
						{ GroupDisplay }
					</div>
				</div>
				<FooterComponent />
			</div>
		);
	}
}
