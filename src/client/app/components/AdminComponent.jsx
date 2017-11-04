/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import axios from 'axios';
import { FormControl, Button } from 'react-bootstrap';
import { chartTypes } from '../reducers/graph';
import HeaderContainer from '../containers/HeaderContainer';

export default class AdminComponent extends React.Component {
	constructor(props) {
		super(props);
		this.handleDisplayTitleChange = this.handleDisplayTitleChange.bind(this);
		this.handleDefaultGraphTypeChange = this.handleDefaultGraphTypeChange.bind(this);
		this.handleDefaultBarStackingChange = this.handleDefaultBarStackingChange.bind(this);
		this.handleSubmitPreferences = this.handleSubmitPreferences.bind(this);
	}

	handleDisplayTitleChange(e) {
		this.props.updateDisplayTitle(e.target.value);
	}

	handleDefaultGraphTypeChange(e) {
		this.props.updateDefaultGraphType(e.target.value);
	}

	handleDefaultBarStackingChange() {
		this.props.toggleDefaultBarStacking();
	}

	handleSubmitPreferences() {
		axios.post('/api/preferences',
			{
				token: localStorage.getItem('token'),
				preferences: {
					displayTitle: this.props.displayTitle,
					defaultGraphType: this.props.defaultGraphType,
					defaultBarStacking: this.props.defaultBarStacking
				}
			})
			.then(() => {
				this.props.showNotification({
					message: 'Updated preferences',
					level: 'success',
					position: 'tr',
					autoDismiss: 3
				});
			})
			.catch(() => {
				this.props.showNotification({
					message: 'Failed to submit changes',
					level: 'error',
					position: 'tr',
					autoDismiss: 3
				});
			}
		);
	}

	render() {
		const labelStyle = {
			fontWeight: 'bold',
			margin: 0,
		};
		const bottomPaddingStyle = {
			paddingBottom: '15px'
		};
		const titleStyle = {
			fontWeight: 'bold',
			margin: 0,
			paddingBottom: '5px'
		};
		return (
			<div>
				<HeaderContainer renderLoginButton={false} renderOptionsButton={false} renderAdminButton={false} />
				<div className="container-fluid">
					<div className="col-xs-3">
						<div style={bottomPaddingStyle}>
							<p style={titleStyle}>Default Site Title:</p>
							<FormControl type="text" placeholder="Name" value={this.props.displayTitle} onChange={this.handleDisplayTitleChange} maxLength={50} />
						</div>
						<div>
							<p style={labelStyle}>Default Graph Type:</p>
							<div className="radio">
								<label><input type="radio" name="chartTypes" value={chartTypes.line} onChange={this.handleDefaultGraphTypeChange} checked={this.props.defaultGraphType === chartTypes.line} />Line</label>
							</div>
							<div className="radio">
								<label><input type="radio" name="chartTypes" value={chartTypes.bar} onChange={this.handleDefaultGraphTypeChange} checked={this.props.defaultGraphType === chartTypes.bar} />Bar</label>
							</div>
							<div className="radio">
								<label><input type="radio" name="chartTypes" value={chartTypes.compare} onChange={this.handleDefaultGraphTypeChange} checked={this.props.defaultGraphType === chartTypes.compare} />Compare</label>
							</div>
						</div>
						<div className="checkbox">
							<label><input type="checkbox" onChange={this.handleDefaultBarStackingChange} checked={this.props.defaultBarStacking} />Default Bar stacking</label>
						</div>
						<Button type="submit" onClick={this.handleSubmitPreferences}>Submit</Button>
					</div>
				</div>
			</div>
		);
	}
}
