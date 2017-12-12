/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormControl, Button } from 'react-bootstrap';
import { chartTypes } from '../reducers/graph';
import HeaderContainer from '../containers/HeaderContainer';
import FooterComponent from '../components/FooterComponent';
import {ToggleDefaultBarStackingAction, UpdateDefaultChartToRenderAction, UpdateDisplayTitleAction} from '../actions/admin';

interface AdminProps {
	displayTitle: string;
	defaultChartToRender: chartTypes;
	defaultBarStacking: boolean;
	disableSubmitPreferences: boolean;
	updateDisplayTitle(title: string): UpdateDisplayTitleAction;
	updateDefaultChartType(defaultChartToRender: chartTypes): UpdateDefaultChartToRenderAction;
	toggleDefaultBarStacking(): ToggleDefaultBarStackingAction;
	submitPreferences(): Promise<void>;
}


export default class AdminComponent extends React.Component<AdminProps, {}> {
	constructor(props: AdminProps) {
		super(props);
		this.handleDisplayTitleChange = this.handleDisplayTitleChange.bind(this);
		this.handleDefaultChartToRenderChange = this.handleDefaultChartToRenderChange.bind(this);
		this.handleDefaultBarStackingChange = this.handleDefaultBarStackingChange.bind(this);
		this.handleSubmitPreferences = this.handleSubmitPreferences.bind(this);
	}

	public render() {
		const labelStyle: React.CSSProperties = {
			fontWeight: 'bold',
			margin: 0
		};
		const bottomPaddingStyle: React.CSSProperties = {
			paddingBottom: '15px'
		};
		const titleStyle: React.CSSProperties = {
			fontWeight: 'bold',
			margin: 0,
			paddingBottom: '5px'
		};
		return (
			<div>
				<HeaderContainer />
				<div className='container-fluid'>
					<div className='col-xs-3'>
						<div style={bottomPaddingStyle}>
							<p style={titleStyle}>Default Site Title:</p>
							<FormControl type='text' placeholder='Name' value={this.props.displayTitle} onChange={this.handleDisplayTitleChange} maxLength={50} />
						</div>
						<div>
							<p style={labelStyle}>Default Chart Type:</p>
							<div className='radio'>
								<label>
									<input
										type='radio'
										name='chartTypes'
										value={chartTypes.line}
										onChange={this.handleDefaultChartToRenderChange}
										checked={this.props.defaultChartToRender === chartTypes.line}
									/>
									Line
								</label>
							</div>
							<div className='radio'>
								<label>
									<input
										type='radio'
										name='chartTypes'
										value={chartTypes.bar}
										onChange={this.handleDefaultChartToRenderChange}
										checked={this.props.defaultChartToRender === chartTypes.bar}
									/>
									Bar
								</label>
							</div>
							<div className='radio'>
								<label>
									<input
										type='radio'
										name='chartTypes'
										value={chartTypes.compare}
										onChange={this.handleDefaultChartToRenderChange}
										checked={this.props.defaultChartToRender === chartTypes.compare}
									/>
									Compare
								</label>
							</div>
						</div>
						<div className='checkbox'>
							<label>
								<input
									type='checkbox'
									onChange={this.handleDefaultBarStackingChange}
									checked={this.props.defaultBarStacking}
								/>
								Default Bar stacking
							</label>
						</div>
						<Button type='submit' onClick={this.handleSubmitPreferences} disabled={this.props.disableSubmitPreferences}>Submit</Button>
					</div>
				</div>
				<FooterComponent />
			</div>
		);
	}


	private handleDisplayTitleChange(e) {
		this.props.updateDisplayTitle(e.target.value);
	}

	private handleDefaultChartToRenderChange(e) {
		this.props.updateDefaultChartType(e.target.value);
	}

	private handleDefaultBarStackingChange() {
		this.props.toggleDefaultBarStacking();
	}

	private handleSubmitPreferences() {
		this.props.submitPreferences();
	}
}
