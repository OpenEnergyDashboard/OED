/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import HeaderComponent from '../HeaderComponent';
import GroupViewContainer from '../../containers/groups/GroupViewContainer';
import GroupSidebarContainer from '../../containers/groups/GroupSidebarContainer';
import CreateGroupContainer from '../../containers/groups/CreateGroupContainer';
import EditGroupsContainer from '../../containers/groups/EditGroupsContainer';
import { DisplayMode, ChangeDisplayedGroupsAction } from '../../actions/groups';
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
		const divPaddingStyle = {
			paddingTop: '50px'
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
					<div>
						<div className='col-xs-2' style={divPaddingStyle}>
							<GroupSidebarContainer />
						</div>
						<div className='col-xs-4'>
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
				<HeaderComponent title='Groups' />
				<div className='container-fluid'>
					<div className='col-xs-11'>
						{GroupDisplay}
					</div>
				</div>
			</div>
		);
	}
}
