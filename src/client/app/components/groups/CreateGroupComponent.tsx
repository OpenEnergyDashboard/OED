/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormControl, Button } from 'react-bootstrap';
import DatasourceBoxContainer from '../../containers/groups/DatasourceBoxContainer';

interface CreateGroupProps {
	createNewBlankGroup(): void;
	editGroupName(name: string): void;
	submitGroupInEditingIfNeeded(): void;
	changeDisplayModeToView(): void;
}

export default class CreateGroupComponent extends React.Component<CreateGroupProps, {}> {
	constructor(props: CreateGroupProps) {
		super(props);
		this.handleNameChange = this.handleNameChange.bind(this);
		this.handleCreateGroup = this.handleCreateGroup.bind(this);
		this.handleReturnToView = this.handleReturnToView.bind(this);
	}

	public componentWillMount() {
		this.props.createNewBlankGroup();
	}

	public render() {
		const divStyle: React.CSSProperties = {
			paddingTop: '35px'
		};
		const divBottomStyle: React.CSSProperties = {
			marginBottom: '20px'
		};
		const textStyle: React.CSSProperties = {
			fontWeight: 'bold',
			margin: 0
		};
		const centerTextStyle: React.CSSProperties = {
			textAlign: 'center'
		};
		return (
			<div style={divStyle} className='col-xs-6'>
				<h3 style={centerTextStyle}>Create a New Group</h3>
				<div style={divBottomStyle}>
					<p style={textStyle}>Name:</p>
					<FormControl type='text' placeholder='Name' onChange={this.handleNameChange} />
				</div>
				<div style={divBottomStyle}>
					<p style={textStyle}>Select Meters:</p>
					<DatasourceBoxContainer type='meter' selection='all' />
				</div>
				<div style={divBottomStyle}>
					<p style={textStyle}>Select Groups:</p>
					<DatasourceBoxContainer type='group' selection='all' />
				</div>
				<Button type='submit' onClick={this.handleReturnToView}>Cancel</Button>
				<Button type='submit' className='pull-right' onClick={this.handleCreateGroup}>Create group</Button>
			</div>
		);
	}

	private handleNameChange(e: React.ChangeEvent<FormControl>) {
		// TODO: Don't know how to get rid of this?
		// For now, disabled the lint disallowing access by string, so we can fake it up.
		this.props.editGroupName(e.target['value']); // tslint:disable-line no-string-literal
	}

	private handleCreateGroup() {
		this.props.submitGroupInEditingIfNeeded();
	}

	private handleReturnToView() {
		this.props.changeDisplayModeToView();
	}
}
