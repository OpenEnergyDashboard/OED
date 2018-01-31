/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import axios from 'axios';
import { FormControl, Button } from 'react-bootstrap';
import { ChartTypes } from '../types/redux/graph';
import HeaderContainer from '../containers/HeaderContainer';
import FooterComponent from '../components/FooterComponent';
import { getToken } from '../utils/token';
import { showSuccessNotification, showErrorNotification } from '../utils/notifications';
import {
	ToggleDefaultBarStackingAction,
	UpdateDefaultChartToRenderAction,
	UpdateDisplayTitleAction,
	UpdateImportMeterAction } from '../types/redux/admin';
import { SelectOption } from '../types/items';

interface AdminProps {
	displayTitle: string;
	defaultChartToRender: ChartTypes;
	defaultBarStacking: boolean;
	disableSubmitPreferences: boolean;
	selectedImportMeter: SelectOption;
	meters: SelectOption[];
	updateSelectedImportMeter(meterID: number): UpdateImportMeterAction;
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
		this.handleFileToImport = this.handleFileToImport.bind(this);
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


	private handleDisplayTitleChange(e: React.FormEvent<FormControl>) {
		this.props.updateDisplayTitle((e.target as HTMLInputElement).value);
	}

	private handleDefaultChartToRenderChange(e: React.FormEvent<HTMLInputElement>) {
		this.props.updateDefaultChartType((e.target as HTMLInputElement).value as ChartTypes);
	}

	private handleDefaultBarStackingChange() {
		this.props.toggleDefaultBarStacking();
	}

	private handleSubmitPreferences() {
		this.props.submitPreferences();
	}

	private handleFileToImport(files: string[]) {
		// token passed as a header
		if (!this.props.selectedImportMeter) {
			showErrorNotification('Please select a meter');
		} else {
			const file = files[0];
			const data = new FormData();
			data.append('csvFile', file);
			axios({
				method: 'post',
				url: `/api/fileProcessing/${this.props.selectedImportMeter.value}`,
				data,
				params: {
					token: getToken()
				}
			})
			.then(() => {
				showSuccessNotification('Successfully uploaded meter data');
			})
			.catch(() => {
				showErrorNotification('Error uploading meter data');
			});
		}
	}
}
