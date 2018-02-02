/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import HeaderContainer from '../../containers/HeaderContainer';
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
		const flexContainerStyle = {
			display: 'flex',
			flexFlow: 'row wrap',
		};
		const flexChildStyle = {
			marginRight: '10px'
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
					<div className="row">
						<div className="col-12 col-lg-2">
							<GroupSidebarContainer />
						</div>
						<div className="col-12 col-lg-10" style={flexContainerStyle}>
							{this.props.selectedGroups.map(groupID =>
								<div className="col-12 col-lg-4" style={flexChildStyle} key={groupID}>
									<GroupViewContainer key={groupID} id={groupID} />
								</div>
							)}
						</div>
					</div>
				);
				break;
			}
			default: {
				console.error('Encountered invalid display mode'); // eslint-disable no-console
			}
		}

		return (
			<div>
				<HeaderContainer />
				<div className="container-fluid">
					{ GroupDisplay }
				</div>
				<FooterComponent />
			</div>
		);
	}
}
