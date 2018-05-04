/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import HeaderContainer from '../../containers/HeaderContainer';
import FooterComponent from '../FooterComponent';
import GroupViewContainer from '../../containers/groups/GroupViewContainer';
import GroupSidebarContainer from '../../containers/groups/GroupSidebarContainer';
import CreateGroupContainer from '../../containers/groups/CreateGroupContainer';
import EditGroupsContainer from '../../containers/groups/EditGroupsContainer';
import { DisplayMode, ChangeDisplayedGroupsAction } from '../../types/redux/groups';
import { NamedIDItem } from '../../types/items';

interface GroupMainProps {
	groups: NamedIDItem[];
	meters: NamedIDItem[];
	displayMode: DisplayMode;
	selectedGroups: number[];
	selectGroups(newSelectedGroupIDs: number[]): ChangeDisplayedGroupsAction;
	fetchGroupsDetailsIfNeeded(): Promise<any>;
	fetchMetersDetailsIfNeeded(): Promise<any>;
}

export default class GroupMainComponent extends React.Component<GroupMainProps, {}> {
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

		let GroupDisplay: JSX.Element | undefined;
		switch (this.props.displayMode) {
			case DisplayMode.Create: {
				GroupDisplay = (
					<div>
						<CreateGroupContainer />
					</div>
				);
				break;
			}
			case DisplayMode.Edit: {
				GroupDisplay = (
					<div>
						<EditGroupsContainer />
					</div>
				);
				break;
			}
			case DisplayMode.View: {
				GroupDisplay = (
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
				);
				break;
			}
			default: {
				throw new Error('Encountered invalid display mode');
			}
		}

		return (
			<div>
				<HeaderContainer />
				<div className='container-fluid'>
					{GroupDisplay}
				</div>
				<FooterComponent />
			</div>
		);
	}
}
