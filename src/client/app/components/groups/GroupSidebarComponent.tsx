/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Button } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import { ChangeDisplayedGroupsAction } from '../../types/redux/groups';
import { Link } from 'react-router';

interface GroupSidebarProps {
	/* tslint:disable:array-type */
	groups: Array<{ id: number, name: string }>;
	loggedInAsAdmin: boolean;
	/* tslint:enable:array-type */
	selectGroups(groups: number[]): ChangeDisplayedGroupsAction;
}

export default class GroupSidebarComponent extends React.Component<GroupSidebarProps, {}> {
	constructor(props: GroupSidebarProps) {
		super(props);
		this.handleGroupSelect = this.handleGroupSelect.bind(this);
	}

	public render() {
		const renderCreateNewGroupButton = this.props.loggedInAsAdmin;
		const labelStyle: React.CSSProperties = {
			fontWeight: 'bold',
			margin: '0px'
		};
		const createGroupStyle: React.CSSProperties = {
			display: renderCreateNewGroupButton ? 'inline' : 'none',
			paddingLeft: '5px'
		};

		return (
			<div className='form-group'>
				<p style={labelStyle}>
					<FormattedMessage id='view.groups' />:
				</p>
				<select multiple className='form-control' id='groupList' size={8} onChange={this.handleGroupSelect}>
					{this.props.groups.map(group =>
						<option key={group.id} value={group.id}>{group.name}</option>
					)}
				</select>
				<br />
				<Link style={createGroupStyle} to='/createGroup'>
					<Button outline>
						<FormattedMessage id='create.group' />
					</Button>
				</Link>
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
}
