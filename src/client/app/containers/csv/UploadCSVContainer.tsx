/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import TooltipMarkerComponent from '../../components/TooltipMarkerComponent';
import MetersCSVUploadComponent from '../../components/csv/MetersCSVUploadComponent';
import ReadingsCSVUploadComponent from '../../components/csv/ReadingsCSVUploadComponent';
import { BooleanMeterTypes, MetersCSVUploadPreferencesItem, ReadingsCSVUploadPreferencesItem, TimeSortTypes } from '../../types/csvUploadForm';
import { uploadCSVApi } from '../../utils/api';
import { MetersCSVUploadDefaults, ReadingsCSVUploadDefaults } from '../../utils/csvUploadDefaults';
import TooltipHelpComponent from '../../components/TooltipHelpComponent';

export const enum MODE {
	meters = 'meters',
	readings = 'readings'
}

interface UploadCSVContainerState {
	uploadReadingsPreferences: ReadingsCSVUploadPreferencesItem;
	uploadMetersPreferences: MetersCSVUploadPreferencesItem;
	activeTab: MODE;
}

const tooltipStyle = {
	display: 'inline-block',
	fontSize: '100%'
};

export default class UploadCSVContainer extends React.Component<{}, UploadCSVContainerState> {
	constructor(props: {}) {
		super(props);
		this.setMeterName = this.setMeterName.bind(this);
		this.selectTimeSort = this.selectTimeSort.bind(this);
		this.selectDuplications = this.selectDuplications.bind(this);
		this.selectCumulative = this.selectCumulative.bind(this);
		this.selectCumulativeReset = this.selectCumulativeReset.bind(this);
		this.setCumulativeResetStart = this.setCumulativeResetStart.bind(this);
		this.setCumulativeResetEnd = this.setCumulativeResetEnd.bind(this);
		this.setLengthGap = this.setLengthGap.bind(this);
		this.setLengthVariation = this.setLengthVariation.bind(this);
		this.selectEndOnly = this.selectEndOnly.bind(this);
		this.submitReadings = this.submitReadings.bind(this);
		this.submitMeters = this.submitMeters.bind(this);
		this.toggleCreateMeter = this.toggleCreateMeter.bind(this);
		this.toggleGzip = this.toggleGzip.bind(this);
		this.toggleHeaderRow = this.toggleHeaderRow.bind(this);
		this.toggleRefreshHourlyReadings = this.toggleRefreshHourlyReadings.bind(this);
		this.toggleRefreshReadings = this.toggleRefreshReadings.bind(this);
		this.toggleUpdate = this.toggleUpdate.bind(this);
		this.toggleTab = this.toggleTab.bind(this);
		this.toggleHonorDst = this.toggleHonorDst.bind(this);
		this.toggleRelaxedParsing = this.toggleRelaxedParsing.bind(this);
		this.toggleUseMeterZone = this.toggleUseMeterZone.bind(this);
	}

	state = {
		activeTab: MODE.readings,
		uploadMetersPreferences: {
			...MetersCSVUploadDefaults
		},
		uploadReadingsPreferences: {
			...ReadingsCSVUploadDefaults
		}
	};

	private setMeterName(mode: MODE, value: string) {
		const preference = (mode === MODE.readings) ? 'uploadReadingsPreferences' : 'uploadMetersPreferences';
		this.setState(previousState => ({
			...previousState,
			[preference]: {
				...previousState[preference],
				meterName: value
			}
		}));
	}
	private selectTimeSort(value: TimeSortTypes) {
		this.setState(previousState => ({
			...previousState,
			uploadReadingsPreferences: {
				...previousState.uploadReadingsPreferences,
				timeSort: value
			}
		}));
	}
	private selectDuplications(value: string) {
		this.setState(previousState => ({
			...previousState,
			uploadReadingsPreferences: {
				...previousState.uploadReadingsPreferences,
				duplications: value
			}
		}));
	}
	private selectCumulative(value: BooleanMeterTypes) {
		this.setState(previousState => ({
			...previousState,
			uploadReadingsPreferences: {
				...previousState.uploadReadingsPreferences,
				cumulative: value
			}
		}));
	}
	private selectCumulativeReset(value: BooleanMeterTypes) {
		this.setState(previousState => ({
			...previousState,
			uploadReadingsPreferences: {
				...previousState.uploadReadingsPreferences,
				cumulativeReset: value
			}
		}));
	}
	private setCumulativeResetStart(value: string) {
		this.setState(previousState => ({
			...previousState,
			uploadReadingsPreferences: {
				...previousState.uploadReadingsPreferences,
				cumulativeResetStart: value
			}
		}));
	}
	private setCumulativeResetEnd(value: string) {
		this.setState(previousState => ({
			...previousState,
			uploadReadingsPreferences: {
				...previousState.uploadReadingsPreferences,
				cumulativeResetEnd: value
			}
		}));
	}
	private setLengthGap(value: string) {
		this.setState(previousState => ({
			...previousState,
			uploadReadingsPreferences: {
				...previousState.uploadReadingsPreferences,
				lengthGap: value
			}
		}));
	}
	private setLengthVariation(value: string) {
		this.setState(previousState => ({
			...previousState,
			uploadReadingsPreferences: {
				...previousState.uploadReadingsPreferences,
				lengthVariation: value
			}
		}));
	}
	private selectEndOnly(value: BooleanMeterTypes) {
		this.setState(previousState => ({
			...previousState,
			uploadReadingsPreferences: {
				...previousState.uploadReadingsPreferences,
				endOnly: value
			}
		}));
	}
	private toggleCreateMeter() {
		this.setState(previousState => ({
			...previousState,
			uploadReadingsPreferences: {
				...previousState.uploadReadingsPreferences,
				createMeter: !previousState.uploadReadingsPreferences.createMeter
			}
		}));
	}
	private toggleGzip(mode: MODE) {
		const preference = (mode === MODE.readings) ? 'uploadReadingsPreferences' : 'uploadMetersPreferences';
		return () => {
			this.setState(previousState => ({
				...previousState,
				[preference]: {
					...previousState[preference],
					gzip: !previousState[preference].gzip
				}
			}));
		};
	}
	private toggleHeaderRow(mode: MODE) {
		const preference = (mode === MODE.readings) ? 'uploadReadingsPreferences' : 'uploadMetersPreferences';
		return () => {
			this.setState(previousState => ({
				...previousState,
				[preference]: {
					...previousState[preference],
					headerRow: !previousState[preference].headerRow
				}
			}));
		};
	}

	private toggleRefreshHourlyReadings() {
		this.setState(previousState => ({
			...previousState,
			uploadReadingsPreferences: {
				...previousState.uploadReadingsPreferences,
				refreshHourlyReadings: !previousState.uploadReadingsPreferences.refreshHourlyReadings
			}
		}));
	}

	private toggleRefreshReadings() {
		this.setState(previousState => ({
			...previousState,
			uploadReadingsPreferences: {
				...previousState.uploadReadingsPreferences,
				refreshReadings: !previousState.uploadReadingsPreferences.refreshReadings
			}
		}));
	}

	private toggleHonorDst() {
		this.setState(previousState => ({
			...previousState,
			uploadReadingsPreferences: {
				...previousState.uploadReadingsPreferences,
				honorDst: !previousState.uploadReadingsPreferences.honorDst
			}
		}));
	}

	private toggleRelaxedParsing() {
		this.setState(previousState => ({
			...previousState,
			uploadReadingsPreferences: {
				...previousState.uploadReadingsPreferences,
				relaxedParsing: !previousState.uploadReadingsPreferences.relaxedParsing
			}
		}));
	}

	private toggleUseMeterZone() {
		this.setState(previousState => ({
			...previousState,
			uploadReadingsPreferences: {
				...previousState.uploadReadingsPreferences,
				useMeterZone: !previousState.uploadReadingsPreferences.useMeterZone
			}
		}));
	}

	private toggleUpdate(mode: MODE) {
		const preference = (mode === MODE.readings) ? 'uploadReadingsPreferences' : 'uploadMetersPreferences';
		return () => {
			this.setState(previousState => ({
				...previousState,
				[preference]: {
					...previousState[preference],
					update: !previousState[preference].update
				}
			}));
		};
	}

	private async submitReadings(file: File) {
		const uploadPreferences = this.state.uploadReadingsPreferences;
		return await uploadCSVApi.submitReadings(uploadPreferences, file);
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
		};
		return (
			<div>
				<TooltipHelpComponent page='csv' />
				<Nav tabs style={{ display: 'flex', justifyContent: 'center' }}>
					<NavItem style={navStyle}>
						<NavLink onClick={() => this.toggleTab(MODE.readings)}>
							<FormattedMessage id='csv.tab.readings' />
						</NavLink>
					</NavItem>
					<NavItem style={navStyle}>
						<NavLink onClick={() => this.toggleTab(MODE.meters)}>
							<FormattedMessage id='csv.tab.meters' />
						</NavLink>
					</NavItem>
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='csv' helpTextId='help.csv.header' />
					</div>
				</Nav>
				<TabContent activeTab={this.state.activeTab}>
					<TabPane tabId={MODE.readings}>
						<ReadingsCSVUploadComponent
							{...this.state.uploadReadingsPreferences}
							setMeterName={this.setMeterName}
							selectTimeSort={this.selectTimeSort}
							selectDuplications={this.selectDuplications}
							selectCumulative={this.selectCumulative}
							selectCumulativeReset={this.selectCumulativeReset}
							setCumulativeResetStart={this.setCumulativeResetStart}
							setCumulativeResetEnd={this.setCumulativeResetEnd}
							setLengthGap={this.setLengthGap}
							setLengthVariation={this.setLengthVariation}
							selectEndOnly={this.selectEndOnly}
							submitCSV={this.submitReadings}
							toggleCreateMeter={this.toggleCreateMeter}
							toggleGzip={this.toggleGzip(MODE.readings)}
							toggleHeaderRow={this.toggleHeaderRow(MODE.readings)}
							toggleRefreshHourlyReadings={this.toggleRefreshHourlyReadings}
							toggleRefreshReadings={this.toggleRefreshReadings}
							toggleHonorDst={this.toggleHonorDst}
							toggleRelaxedParsing={this.toggleRelaxedParsing}
							toggleUseMeterZone={this.toggleUseMeterZone}
							toggleUpdate={this.toggleUpdate(MODE.readings)}
						/>
					</TabPane>
					<TabPane tabId={MODE.meters}>
						<MetersCSVUploadComponent
							{...this.state.uploadMetersPreferences}
							submitCSV={this.submitMeters}
							setMeterName={this.setMeterName}
							toggleGzip={this.toggleGzip(MODE.meters)}
							toggleHeaderRow={this.toggleHeaderRow(MODE.meters)}
							toggleUpdate={this.toggleUpdate(MODE.meters)}
						/>
					</TabPane>
				</TabContent>
			</div>
		);
	}
}
