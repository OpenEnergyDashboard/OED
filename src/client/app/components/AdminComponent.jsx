/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { Input, Button } from 'reactstrap';
import Dropzone from 'react-dropzone';
import axios from 'axios';
import { chartTypes } from '../reducers/graph';
import HeaderContainer from '../containers/HeaderContainer';
import FooterComponent from '../components/FooterComponent';
import MultiSelectComponent from './MultiSelectComponent';
import { getToken } from '../utils/token';
import { showSuccessNotification, showErrorNotification } from '../utils/notifications';

export default class AdminComponent extends React.Component {
	constructor(props) {
		super(props);
		this.handleDisplayTitleChange = this.handleDisplayTitleChange.bind(this);
		this.handleDefaultChartToRenderChange = this.handleDefaultChartToRenderChange.bind(this);
		this.handleDefaultBarStackingChange = this.handleDefaultBarStackingChange.bind(this);
		this.handleSubmitPreferences = this.handleSubmitPreferences.bind(this);
		this.handleFileToImport = this.handleFileToImport.bind(this);
		this.handleMeterToImport = this.handleMeterToImport.bind(this);
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
		this.props.submitPreferences();
	}

	handleMeterToImport(files) {
		const file = files[0];
		let jsonObject = [];
		const reader = new FileReader();
		let listValue = [];
		reader.onload = () => {
			const fileAsBinaryString = reader.result;
			listValue = fileAsBinaryString.split(/\r?\n/);
			for (const items of listValue) {
				if (items.length === 0) {
					listValue.splice(listValue.indexOf(items), 1);
				}
			}
			console.log(listValue);
			jsonObject = listValue;
			axios({
				method: 'post',
				url: `/api/fileProcessing/meters`,
				data: jsonObject,
				params: {
					token: getToken(),
				}
			})
				.then(() => {
					showSuccessNotification('Successfully uploaded meters');
				})
				.catch(() => {
					showErrorNotification('Error uploading meters');
				});
		};
		reader.onabort = () => console.log('file reading was aborted');
		reader.onerror = () => console.log('file reading has failed')
		reader.readAsBinaryString(file);
	}

	handleFileToImport(files) {
		// token passed as a header
		if (!this.props.selectedImportMeter) {
			showErrorNotification('Please select a meter');
		} else {
			const file = files[0];
			const data = new FormData();
			data.append('csvFile', file);
			console.log(data);
			axios({
				method: 'post',
				url: `/api/fileProcessing/readings/${this.props.selectedImportMeter.value}`,
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
		const marginBottomStyle = {
			marginBottom: '35px'
		};
		const smallMarginBottomStyle = {
			marginBottom: '5px'
		};
		return (
			<div>
				<HeaderContainer />
				<div className="container-fluid">
					<div className="row" style={marginBottomStyle}>
						<div className="col-3">
							<div style={bottomPaddingStyle}>
								<p style={titleStyle}>Default Site Title:</p>
								<Input
									type="text"
									placeholder="Name"
									value={this.props.displayTitle}
									onChange={this.handleDisplayTitleChange}
									maxLength={50}
								/>
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
								<label>
									<input
										type="checkbox"
										onChange={this.handleDefaultBarStackingChange}
										checked={this.props.defaultBarStacking}
									/>
									Default Bar stacking
								</label>
							</div>
							<Button
								type="submit"
								onClick={this.handleSubmitPreferences}
								disabled={this.props.disableSubmitPreferences}
							>
								Submit
							</Button>
						</div>
					</div>
					<div className="row">
						<div className="col-2">
							<p style={titleStyle}>Import meter readings:</p>
							<MultiSelectComponent
								style={smallMarginBottomStyle}
								options={this.props.meters}
								selectedOptions={this.props.selectedImportMeter}
								placeholder="Select meter to import data"
								onValuesChange={s => this.props.updateSelectedImportMeter(s)}
								singleSelect
							/>
							{this.props.selectedImportMeter &&
								<Dropzone accept="text/csv, application/vnd.ms-excel," onDrop={this.handleFileToImport}>
									<div>Upload energy data (CSV):</div>
								</Dropzone>
							}
						</div>
						<div className="col-2">
							<p style={titleStyle}> Add new meters: </p>
							<Dropzone accept="text/csv, application/vnd.ms-excel," onDrop={this.handleMeterToImport}>
								<div>Upload meters list (CSV):</div>
							</Dropzone>
						</div>
					</div>
				</div>
				<FooterComponent />
			</div>
		);
	}
}
