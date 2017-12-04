/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import axios from 'axios';
import { FormControl, Button } from 'react-bootstrap';
import { chartTypes } from '../reducers/graph';
import HeaderContainer from '../containers/HeaderContainer';
import FooterComponent from '../components/FooterComponent';
import { showSuccessNotification, showErrorNotification } from '../utils/notifications';

export default class AdminComponent extends React.Component {
	constructor(props) {
		super(props);
		this.handleDisplayTitleChange = this.handleDisplayTitleChange.bind(this);
		this.handleDefaultChartToRenderChange = this.handleDefaultChartToRenderChange.bind(this);
		this.handleDefaultBarStackingChange = this.handleDefaultBarStackingChange.bind(this);
		this.handleSubmitPreferences = this.handleSubmitPreferences.bind(this);
	}

	handleDisplayTitleChange(e) {
		this.props.updateDisplayTitle(e.target.value);
	}

	handleDefaultChartToRenderChange(e) {
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
					defaultChartToRender: this.props.defaultChartToRender,
					defaultBarStacking: this.props.defaultBarStacking
				}
			})
			.then(() => {
				showSuccessNotification('Updated preferences');
			})
			.catch(() => {
				showErrorNotification('Failed to submit changes');
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
				<HeaderContainer />
				<div className="container-fluid">
					<div className="col-xs-3">
						<div style={bottomPaddingStyle}>
							<p style={titleStyle}>Default Site Title:</p>
							<FormControl type="text" placeholder="Name" value={this.props.displayTitle} onChange={this.handleDisplayTitleChange} maxLength={50} />
						</div>
						<div>
							<p style={labelStyle}>Default Graph Type:</p>
							<div className="radio">
								<label>
									<input
										type="radio"
										name="chartTypes"
										value={chartTypes.line}
										onChange={this.handleDefaultChartToRenderChange}
										checked={this.props.defaultChartToRender === chartTypes.line}
									/>
									Line
								</label>
							</div>
							<div className="radio">
								<label>
									<input
										type="radio"
										name="chartTypes"
										value={chartTypes.bar}
										onChange={this.handleDefaultChartToRenderChange}
										checked={this.props.defaultChartToRender === chartTypes.bar}
									/>
									Bar
								</label>
							</div>
							<div className="radio">
								<label>
									<input
										type="radio"
										name="chartTypes"
										value={chartTypes.compare}
										onChange={this.handleDefaultChartToRenderChange}
										checked={this.props.defaultChartToRender === chartTypes.compare}
									/>
									Compare
								</label>
							</div>
						</div>
						<div className="checkbox">
							<label><input type="checkbox" onChange={this.handleDefaultBarStackingChange} checked={this.props.defaultBarStacking} />Default Bar stacking</label>
						</div>
						<Button type="submit" onClick={this.handleSubmitPreferences}>Submit</Button>
					</div>
				</div>
				<FooterComponent />
			</div>
		);
	}
}
