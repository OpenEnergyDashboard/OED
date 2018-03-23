/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Input, Button } from 'reactstrap';
import Dropzone from 'react-dropzone';
import { ImageFile } from 'react-dropzone';
import { ChartTypes } from '../types/redux/graph';
import HeaderContainer from '../containers/HeaderContainer';
import FooterComponent from '../components/FooterComponent';
import { showSuccessNotification, showErrorNotification } from '../utils/notifications';
import {
	ToggleDefaultBarStackingAction,
	UpdateDefaultChartToRenderAction,
	UpdateDisplayTitleAction,
	UpdateDefaultLanguageAction,
	UpdateImportMeterAction } from '../types/redux/admin';
import { SelectOption } from '../types/items';
import SingleSelectComponent from './SingleSelectComponent';
import { metersApi } from '../utils/api';
import { LanguageTypes } from '../types/i18n';

interface AdminProps {
	displayTitle: string;
	defaultChartToRender: ChartTypes;
	defaultBarStacking: boolean;
	defaultLanguage: LanguageTypes;
	disableSubmitPreferences: boolean;
	selectedImportMeter: SelectOption;
	meters: SelectOption[];
	updateSelectedImportMeter(meterID: number): UpdateImportMeterAction;
	updateDisplayTitle(title: string): UpdateDisplayTitleAction;
	updateDefaultChartType(defaultChartToRender: ChartTypes): UpdateDefaultChartToRenderAction;
	updateDefaultLanguage(defaultLanguage: LanguageTypes): UpdateDefaultLanguageAction;
	toggleDefaultBarStacking(): ToggleDefaultBarStackingAction;
	submitPreferences(): Promise<void>;
}

export default class AdminComponent extends React.Component<AdminProps, {}> {
	constructor(props: AdminProps) {
		super(props);
		this.handleDisplayTitleChange = this.handleDisplayTitleChange.bind(this);
		this.handleDefaultChartToRenderChange = this.handleDefaultChartToRenderChange.bind(this);
		this.handleDefaultBarStackingChange = this.handleDefaultBarStackingChange.bind(this);
		this.handleDefaultLanguageChange = this.handleDefaultLanguageChange.bind(this);
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
		const marginBottomStyle: React.CSSProperties = {
			marginBottom: '35px'
		};
		const smallMarginBottomStyle: React.CSSProperties = {
			marginBottom: '5px'
		};
		return (
			<div>
				<HeaderContainer />
				<div className='container-fluid'>
					<div className='row' style={marginBottomStyle}>
						<div className='col-3'>
							<div style={bottomPaddingStyle}>
								<p style={titleStyle}>Default Site Title:</p>
								<Input
									type='text'
									placeholder='Name'
									value={this.props.displayTitle}
									onChange={this.handleDisplayTitleChange}
									maxLength={50}
								/>
							</div>
							<div>
								<p style={labelStyle}>Default Graph Type:</p>
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
							<div>
								<p style={labelStyle}>Default Language:</p>
								<div className='radio'>
									<label>
										<input
											type='radio'
											name='languageTypes'
											value={LanguageTypes.en}
											onChange={this.handleDefaultLanguageChange}
											checked={this.props.defaultLanguage === LanguageTypes.en}
										/>
										English
									</label>
								</div>
								<div className='radio'>
									<label>
										<input
											type='radio'
											name='languageTypes'
											value={LanguageTypes.fr}
											onChange={this.handleDefaultLanguageChange}
											checked={this.props.defaultLanguage === LanguageTypes.fr}
										/>
										French
									</label>
								</div>
							</div>
							<Button
								type='submit'
								onClick={this.handleSubmitPreferences}
								disabled={this.props.disableSubmitPreferences}
							>
								Submit
							</Button>
						</div>
					</div>
					<div className='row'>
						<div className='col-2'>
							<p style={titleStyle}>Import meter readings:</p>
							<SingleSelectComponent
								style={smallMarginBottomStyle}
								options={this.props.meters}
								selectedOption={this.props.selectedImportMeter}
								placeholder='Select meter to import data'
								onValueChange={s => this.props.updateSelectedImportMeter(s.value)}
							/>
							{/* TODO TYPESCRIPT: the dropzone expects onDrop to take an array of ImageFile, which doesn't make sense.*/}
							{ this.props.selectedImportMeter &&
							<Dropzone accept='text/csv, application/vnd.ms-excel,' onDrop={this.handleFileToImport}>
								<div>Upload a CSV file:</div>
							</Dropzone>
							}
						</div>
					</div>
				</div>
				<FooterComponent />
			</div>
		);
	}

	private handleDisplayTitleChange(e: { target: HTMLInputElement; }) {
		this.props.updateDisplayTitle((e.target as HTMLInputElement).value);
	}

	private handleDefaultChartToRenderChange(e: React.FormEvent<HTMLInputElement>) {
		this.props.updateDefaultChartType((e.target as HTMLInputElement).value as ChartTypes);
	}

	private handleDefaultLanguageChange(e: React.FormEvent<HTMLInputElement>) {
		this.props.updateDefaultLanguage((e.target as HTMLInputElement).value as LanguageTypes);
	}

	private handleDefaultBarStackingChange() {
		this.props.toggleDefaultBarStacking();
	}

	private handleSubmitPreferences() {
		this.props.submitPreferences();
	}

	private handleFileToImport(files: ImageFile[]) {
		// token passed as a header
		if (!this.props.selectedImportMeter) {
			showErrorNotification('Please select a meter');
		} else {
			const file = files[0];
			metersApi.submitNewReadings(this.props.selectedImportMeter.value, file)
			.then(() => {
				showSuccessNotification('Successfully uploaded meter data');
			})
			.catch(() => {
				showErrorNotification('Error uploading meter data');
			});
		}
	}
}
