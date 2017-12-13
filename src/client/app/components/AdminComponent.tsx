/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormControl, Button } from 'react-bootstrap';
import { ChartTypes } from '../types/redux/graph';
import HeaderContainer from '../containers/HeaderContainer';
import FooterComponent from '../components/FooterComponent';
import { ToggleDefaultBarStackingAction, UpdateDefaultChartToRenderAction, UpdateDisplayTitleAction } from '../types/redux/admin';

interface AdminProps {
	displayTitle: string;
	defaultChartToRender: ChartTypes;
	defaultBarStacking: boolean;
	disableSubmitPreferences: boolean;
	updateDisplayTitle(title: string): UpdateDisplayTitleAction;
	updateDefaultChartType(defaultChartToRender: ChartTypes): UpdateDefaultChartToRenderAction;
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
							{/*TODO TYPESCRIPT: This is a bug in the typings. Issue: https://github.com/DefinitelyTyped/DefinitelyTyped/issues/21840*/}
							<FormControl
								type='text'
								placeholder='Name'
								value={this.props.displayTitle}
								onChange={this.handleDisplayTitleChange}
								maxLength={50}
							/>
						</div>
						<div>
							<p style={labelStyle}>Default Chart Type:</p>
							<div className='radio'>
								<label>
									<input
										type='radio'
										name='chartTypes'
										value={ChartTypes.line}
										onChange={this.handleDefaultChartToRenderChange}
										checked={this.props.defaultChartToRender === ChartTypes.line}
									/>
									Line
								</label>
							</div>
							<div className='radio'>
								<label>
									<input
										type='radio'
										name='chartTypes'
										value={ChartTypes.bar}
										onChange={this.handleDefaultChartToRenderChange}
										checked={this.props.defaultChartToRender === ChartTypes.bar}
									/>
									Bar
								</label>
							</div>
							<div className='radio'>
								<label>
									<input
										type='radio'
										name='chartTypes'
										value={ChartTypes.compare}
										onChange={this.handleDefaultChartToRenderChange}
										checked={this.props.defaultChartToRender === ChartTypes.compare}
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


	private handleDisplayTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
		this.props.updateDisplayTitle(e.target.value);
	}

	private handleDefaultChartToRenderChange(e: React.ChangeEvent<HTMLInputElement>) {
		this.props.updateDefaultChartType(e.target.value as ChartTypes);
	}

	private handleDefaultBarStackingChange() {
		this.props.toggleDefaultBarStacking();
	}

	private handleSubmitPreferences() {
		this.props.submitPreferences();
	}
}
