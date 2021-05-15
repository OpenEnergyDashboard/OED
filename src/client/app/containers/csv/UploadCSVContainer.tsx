/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import MetersCSVUploadComponent from '../../components/csv/MetersCSVUploadComponent';
import ReadingsCSVUploadComponent from '../../components/csv/ReadingsCSVUploadComponent';
import HeaderContainer from '../HeaderContainer';
import FooterContainer from '../FooterContainer';
import { uploadCSVApi } from '../../utils/api';
import { ReadingsCSVUploadPreferencesItem, MetersCSVUploadPreferencesItem, TimeSortTypes } from '../../types/csvUploadForm';
import { TabContent, TabPane, Nav, NavItem, NavLink } from 'reactstrap';
import { FormattedMessage } from 'react-intl';

const enum MODE {
	meters = 'meters',
	readings = 'readings'
}

interface UploadCSVContainerState {
	uploadReadingsPreferences: ReadingsCSVUploadPreferencesItem;
	uploadMetersPreferences: MetersCSVUploadPreferencesItem;
	activeTab: MODE;
}

export default class UploadCSVContainer extends React.Component<{}, UploadCSVContainerState> {
	constructor(props: {}) {
		super(props);
		this.selectDuplications = this.selectDuplications.bind(this);
		this.selectTimeSort = this.selectTimeSort.bind(this);
		this.setMeterName = this.setMeterName.bind(this);
		this.setCumulativeResetStart = this.setCumulativeResetStart.bind(this);
		this.setCumulativeResetEnd = this.setCumulativeResetEnd.bind(this);
		this.setLength = this.setLength.bind(this);
		this.setLengthVariation = this.setLengthVariation.bind(this);
		this.submitReadings = this.submitReadings.bind(this);
		this.submitMeters = this.submitMeters.bind(this);
		this.toggleCreateMeter = this.toggleCreateMeter.bind(this);
		this.toggleCumulative = this.toggleCumulative.bind(this);
		this.toggleCumulativeReset = this.toggleCumulativeReset.bind(this);
		this.toggleGzip = this.toggleGzip.bind(this);
		this.toggleHeaderRow = this.toggleHeaderRow.bind(this);
		this.toggleRefreshReadings = this.toggleRefreshReadings.bind(this);
		this.toggleUpdate = this.toggleUpdate.bind(this);
		this.toggleTab = this.toggleTab.bind(this);
	}

	state = {
		activeTab: MODE.readings,
		uploadMetersPreferences: {
			gzip: false,
			headerRow: false,
			update: false
		},
		uploadReadingsPreferences: {
			createMeter: false,
			cumulative: false,
			cumulativeReset: false,
			cumulativeResetStart: '',
			cumulativeResetEnd: '',
			duplications: '1',
			gzip: false,
			headerRow: false,
			length: '',
			lengthVariation: '',
			meterName: '',
			refreshReadings: false,
			timeSort: TimeSortTypes.increasing,
			update: false
		}
	}

	private selectDuplications(value: string) {
		this.setState(previousState => ({
			...previousState,
			uploadReadingsPreferences: {
				...previousState.uploadReadingsPreferences,
				duplications: value
			}
		}))
	}
	private selectTimeSort(value: TimeSortTypes) {
		this.setState(previousState => ({
			...previousState,
			uploadReadingsPreferences: {
				...previousState.uploadReadingsPreferences,
				timeSort: value
			}
		}))
	}
	private setMeterName(value: string) {
		this.setState(previousState => ({
			...previousState,
			uploadReadingsPreferences: {
				...previousState.uploadReadingsPreferences,
				meterName: value
			}
		}))
	}
	private setCumulativeResetStart(value: string) {
		this.setState(previousState => ({
			...previousState,
			uploadReadingsPreferences: {
				...previousState.uploadReadingsPreferences,
				cumulativeResetStart: value
			}
		}))
	}
	private setCumulativeResetEnd(value: string) {
		this.setState(previousState => ({
			...previousState,
			uploadReadingsPreferences: {
				...previousState.uploadReadingsPreferences,
				cumulativeResetEnd: value
			}
		}))
	}
	private setLength(value: string) {
		this.setState(previousState => ({
			...previousState,
			uploadReadingsPreferences: {
				...previousState.uploadReadingsPreferences,
				length: value
			}
		}))
	}
	private setLengthVariation(value: string) {
		this.setState(previousState => ({
			...previousState,
			uploadReadingsPreferences: {
				...previousState.uploadReadingsPreferences,
				lengthVariation: value
			}
		}))
	}
	private toggleCreateMeter() {
		this.setState(previousState => ({
			...previousState,
			uploadReadingsPreferences: {
				...previousState.uploadReadingsPreferences,
				createMeter: !previousState.uploadReadingsPreferences.createMeter
			}
		}))
	}
	private toggleCumulative() {
		this.setState(previousState => ({
			...previousState,
			uploadReadingsPreferences: {
				...previousState.uploadReadingsPreferences,
				cumulative: !previousState.uploadReadingsPreferences.cumulative
			}
		}))
	}
	private toggleCumulativeReset() {
		this.setState(previousState => ({
			...previousState,
			uploadReadingsPreferences: {
				...previousState.uploadReadingsPreferences,
				cumulativeReset: !previousState.uploadReadingsPreferences.cumulativeReset
			}
		}))
	}
	private toggleGzip(mode: MODE) {
		const preference = (mode === 'readings') ? 'uploadReadingsPreferences' : 'uploadMetersPreferences';
		return () => {
			this.setState(previousState => ({
				...previousState,
				[preference]: {
					...previousState[preference],
					gzip: !previousState[preference].gzip
				}
			}))
		}
	}
	private toggleHeaderRow(mode: MODE) {
		const preference = (mode === 'readings') ? 'uploadReadingsPreferences' : 'uploadMetersPreferences';
		return () => {
			this.setState(previousState => ({
				...previousState,
				[preference]: {
					...previousState[preference],
					headerRow: !previousState[preference].headerRow
				}
			}))
		}
	}

	private toggleRefreshReadings() {
		this.setState(previousState => ({
			...previousState,
			uploadReadingsPreferences: {
				...previousState.uploadReadingsPreferences,
				refreshReadings: !previousState.uploadReadingsPreferences.refreshReadings
			}
		}))
	}

	private toggleUpdate(mode: MODE) {
		const preference = (mode === 'readings') ? 'uploadReadingsPreferences' : 'uploadMetersPreferences';
		return () => {
			this.setState(previousState => ({
				...previousState,
				[preference]: {
					...previousState[preference],
					update: !previousState[preference].update
				}
			}))
		}
	}

	private async submitReadings(file: File) {
		const uploadPreferences = this.state.uploadReadingsPreferences;
		await uploadCSVApi.submitReadings(uploadPreferences, file);
	}

	private async submitMeters(file: File) {
		const uploadPreferences = this.state.uploadMetersPreferences;
		await uploadCSVApi.submitMeters(uploadPreferences, file);
	}

	private toggleTab(tab: MODE) {
		if (this.state.activeTab !== tab) {
			this.setState({
				activeTab: tab
			});
		}
	}

	public render() {
		const navStyle: React.CSSProperties = {
			cursor: 'pointer'
		}
		return (
			<div>
				<HeaderContainer />
				<Nav tabs style={{ display: 'flex', justifyContent: 'center' }}>
					<NavItem style={navStyle}>
						<NavLink onClick={() => this.toggleTab(MODE.readings)}>
							<FormattedMessage id='csv.tab.readings'/>
						</NavLink>
					</NavItem>
					<NavItem style={navStyle}>
						<NavLink onClick={() => this.toggleTab(MODE.meters)}>
							<FormattedMessage id='csv.tab.meters'/>
						</NavLink>
					</NavItem>
				</Nav>
				<TabContent activeTab={this.state.activeTab}>
					<TabPane tabId={MODE.readings}>
						<ReadingsCSVUploadComponent
							{...this.state.uploadReadingsPreferences}
							selectDuplications={this.selectDuplications}
							selectTimeSort={this.selectTimeSort}
							setMeterName={this.setMeterName}
							setCumulativeResetStart={this.setCumulativeResetStart}
							setCumulativeResetEnd={this.setCumulativeResetEnd}
							setLength={this.setLength}
							setLengthVariation={this.setLengthVariation}
							submitCSV={this.submitReadings}
							toggleCreateMeter={this.toggleCreateMeter}
							toggleCumulative={this.toggleCumulative}
							toggleCumulativeReset={this.toggleCumulativeReset}
							toggleGzip={this.toggleGzip(MODE.readings)}
							toggleHeaderRow={this.toggleHeaderRow(MODE.readings)}
							toggleRefreshReadings={this.toggleRefreshReadings}
							toggleUpdate={this.toggleUpdate(MODE.readings)}
						/>
					</TabPane>
					<TabPane tabId={MODE.meters}>
						<MetersCSVUploadComponent
							{...this.state.uploadMetersPreferences}
							submitCSV={this.submitMeters}
							toggleGzip={this.toggleGzip(MODE.meters)}
							toggleHeaderRow={this.toggleHeaderRow(MODE.meters)}
							toggleUpdate={this.toggleUpdate(MODE.meters)}
						/>
					</TabPane>
				</TabContent>
				<FooterContainer />
			</div>
		)
	}
}