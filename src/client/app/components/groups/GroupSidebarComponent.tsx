/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Button } from 'react-bootstrap';
import { ChangeDisplayedGroupsAction, ChangeDisplayModeAction } from '../../types/redux/groups';

interface GroupSidebarProps {
	groups: Array<{id: number, name: string}>;
	changeDisplayModeToCreate(): ChangeDisplayModeAction;
	fetchGroupsDetailsIfNeeded(): Promise<any>;
	selectGroups(groups: number[]): ChangeDisplayedGroupsAction;
}

export default class GroupSidebarComponent extends React.Component<GroupSidebarProps, {}> {
	constructor(props: GroupSidebarProps) {
		super(props);
		this.handleGroupSelect = this.handleGroupSelect.bind(this);
		this.handleCreateGroup = this.handleCreateGroup.bind(this);
	}

	public componentWillMount() {
		this.props.fetchGroupsDetailsIfNeeded();
	}

	public render() {
		const labelStyle: React.CSSProperties = {
			fontWeight: 'bold'
		};
		return (
			<div className='form-group'>
				<p style={labelStyle}>View groups:</p>
				<select multiple className='form-control' id='groupList' size={8} onChange={this.handleGroupSelect}>
					{this.props.groups.map(group =>
						<option key={group.id} value={group.id}>{group.name}</option>
					)}
				</select>
				<br />
				<Button bsStyle='default' onClick={this.handleCreateGroup}>Create new group</Button>
			</div>
		);
	}

	private handleGroupSelect(e: React.ChangeEvent<HTMLSelectElement>) {
		e.preventDefault();
		const options = e.target.options;
		const selectedGroups: number[] = [];
		// We can't map or for-of here because this is a collection of DOM elements, not an array.
		for (let i = 0; i < options.length; i++) { // tslint:disable-line prefer-for-of
			if (options[i].selected) {
				selectedGroups.push(parseInt(options[i].value));
			}
		}
		this.props.selectGroups(selectedGroups);
	}

	private handleCreateGroup() {
		this.props.changeDisplayModeToCreate();
	}
}
