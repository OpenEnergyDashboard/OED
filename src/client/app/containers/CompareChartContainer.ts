/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { connect } from 'react-redux';
import { getComparePeriodLabels, getCompareChangeSummary, calculateCompareShift } from '../utils/calculateCompare';
// When this container gets converted to component,migrate to useTranslate() from componentHooks.ts
import translate from '../utils/translate';
import Plot from 'react-plotly.js';
import Locales from '../types/locales';
import * as moment from 'moment';
import { UnitRepresentType } from '../types/redux/units';
import { getAreaUnitConversion } from '../utils/getAreaUnitConversion';
import { selectUnitDataById } from '../redux/api/unitsApi';
import { RootState } from '../store';
import { selectGroupDataById } from '../redux/api/groupsApi';
import { selectMeterDataById } from '../redux/api/metersApi';
import {
	selectAreaUnit, selectComparePeriod,
	selectCompareTimeInterval, selectGraphAreaNormalization,
	selectSelectedUnit
} from '../redux/slices/graphSlice';
import { selectSelectedLanguage } from '../redux/slices/appStateSlice';

export interface CompareEntity {
	id: number;
	isGroup: boolean;
	name: string;
	identifier: string;
	change: number;
	currUsage: number;
	prevUsage: number;
	prevTotalUsage?: number;
}

interface CompareChartContainerProps {
	entity: CompareEntity;
}

/**
 * Passes the current redux state of the of the chart container and it's props, and turns it into props for the React
 * component, which is what will be visible on the page. Makes it possible to access
 * your reducer state objects from within your React components.
 * @param state The redux state
 * @param ownProps Chart container props
 * @returns The props object
 */
function mapStateToProps(state: RootState, ownProps: CompareChartContainerProps): any {
	const comparePeriod = selectComparePeriod(state);
	const compareTimeInterval = selectCompareTimeInterval(state);
	const datasets: any[] = [];
	const periodLabels = getComparePeriodLabels(comparePeriod);
	// The unit label depends on the unit which is in selectUnit state.
	// Also need to determine if raw.
	const graphingUnit = selectSelectedUnit(state);
	// This container is not called if there is no data of there are not units so this is safe.
	const unitDataById = selectUnitDataById(state);
	const meterDataById = selectMeterDataById(state);
	const groupDataById = selectGroupDataById(state);
	const selectUnitState = unitDataById[graphingUnit];
	const locale = selectSelectedLanguage(state);
	let unitLabel: string = '';
	// If graphingUnit is -99 then none selected and nothing to graph so label is empty.
	// This will probably happen when the page is first loaded.
	if (graphingUnit !== -99) {
		if (selectUnitState !== undefined) {
			// Quantity and flow units have different unit labels.
			// Look up the type of unit if it is for quantity/flow (should not be raw) and decide what to do.
			// Bar graphics are always quantities.
			if (selectUnitState.unitRepresent === UnitRepresentType.quantity) {
				// If it is a quantity unit then that is the unit you are graphing.
				unitLabel = selectUnitState.identifier;
			} else if (selectUnitState.unitRepresent === UnitRepresentType.flow) {
				// If it is a flow meter then you need to multiply by time to get the quantity unit.
				// The quantity/time for flow has varying time so label by multiplying by time.
				// To make sure it is clear, also indicate it is a quantity.
				// Note this should not be used for raw data.
				// It might not be usual to take a flow and make it into a quantity so this label is a little different to
				// catch people's attention. If sites/users don't like OED doing this then we can eliminate flow for these types
				// of graphics as we are doing for rate.
				unitLabel = selectUnitState.identifier + ' * time ≡ quantity';
			}
		}
	}

	// Get the time shift for this comparison as a moment duration
	const compareShift = calculateCompareShift(comparePeriod);
	// The start and end of this time period. Need to create new moment objects since subtraction mutates the original.
	// Only do to start of the hour since OED is using hourly data so fractions of an hour are not given.
	// The start time is always midnight so this is not really needed but do to be safe.
	// It isn't known why you must start from a string to get timezone aware dates but it seems needed.
	// There might be a better way to do this. This is similar to the code used elsewhere where we get the
	// date and time followed by an offset of +00:00 so it is UTC. We then create moment in UTC so it preserves
	// the correct time.
	// If you don't use the string then if you have a meter, add a group and then change the compare interval, it will
	// shift the dates backward by full week(s). One possible explanation is that moment stores the moment used when creating
	// a new moment and this same included moment is used for both the meter and group. Since moment allows modification of a
	// moment object, it may be that they are interacting. Having said this, I could not pin this down and fix it by avoiding it.
	// Thus, this may not be the reason but for now it is fixed as indicated.
	// getStartTimestamp() and getEndTimestamp() should return a moment object in UTC so it is fine to use. It could only be
	// null if it is unbounded but that should never happen with a compare interval.
	const thisStartTime = moment.utc(compareTimeInterval.getStartTimestamp().format('YYYY-MM-DD HH:mm:ss') + '+00:00');
	// Only do to start of the hour since OED is using hourly data so fractions of an hour are not given.
	// The start time is always midnight so this is not needed.
	const thisEndTime = moment.utc(compareTimeInterval.getEndTimestamp().startOf('hour').format('YYYY-MM-DD HH:mm:ss') + '+00:00');

	// The desired label times for this interval that is internationalized and shows day of week, date and time with hours.
	const thisStartTimeLabel: string = thisStartTime.format('llll');
	const thisEndTimeLabel: string = thisEndTime.format('llll');
	// The desired label times for last interval that is earlier by the compareShift.
	const lastStartTimeLabel: string = thisStartTime.subtract(compareShift).format('llll');
	const LastEndTimeLabel: string = thisEndTime.subtract(compareShift).format('llll');
	// X axis label tells the user what time period they are looking at. Label A & B so easier for user to know which applies to which bar.
	// The same A/B labels are used below for the x: value in the plot.
	const xTitle: string = `${lastStartTimeLabel} -<br> ${LastEndTimeLabel} (A) &<br>${thisStartTimeLabel} -<br> ${thisEndTimeLabel} (B)`;

	const colorize = (changeForColorization: number) => {
		if (isNaN(changeForColorization)) {
			return 'black';
		} else if (changeForColorization < 0) {
			return 'green';
		}
		return 'red';
	};

	// Compose the text to display to the user.
	const entity = ownProps.entity;
	const changeSummary = getCompareChangeSummary(entity.change, entity.identifier, periodLabels);

	const barColor = 'rgba(218, 165, 32, 1)';

	let previousPeriod = entity.prevUsage;
	let currentPeriod = entity.currUsage;
	const areaNormalization = selectGraphAreaNormalization(state);
	// Check if there is data to graph.
	if (previousPeriod !== null && currentPeriod !== null) {
		if (areaNormalization) {
			const area = entity.isGroup ? groupDataById[entity.id].area : meterDataById[entity.id].area;
			const areaUnit = entity.isGroup ? groupDataById[entity.id].areaUnit : meterDataById[entity.id].areaUnit;
			const normalization = area * getAreaUnitConversion(areaUnit, selectAreaUnit(state));
			previousPeriod /= normalization;
			currentPeriod /= normalization;
		}

		datasets.push(
			{
				x: [`${periodLabels.prev} (A)`, `${periodLabels.current} (B)`],
				y: [previousPeriod, currentPeriod],
				hovertext: [
					`<b>${previousPeriod.toPrecision(6)} ${unitLabel}</b> ${translate('used.this.time')}<br>${periodLabels.prev.toLowerCase()}`,
					`<b>${currentPeriod.toPrecision(6)} ${unitLabel}</b> ${translate('used.so.far')}<br>${periodLabels.current.toLowerCase()}`
				],
				hoverinfo: 'text',
				type: 'bar',
				marker: { color: barColor },
				text: [`<b>${previousPeriod.toPrecision(6)} ${unitLabel}</b>`, `<b>${currentPeriod.toPrecision(6)} ${unitLabel}</b>`],
				textposition: 'auto',
				textfont: {
					color: 'rgba(0,0,0,1)'
				}
			}
		);
	}

	let layout: any;
	// Customize the layout of the plot
	// See https://community.plotly.com/t/replacing-an-empty-graph-with-a-message/31497 for showing text not plot.
	// added graph unit check to avoid crashing in edge case when traversing history backwards
	if (graphingUnit === -99 || selectUnitState.unitRepresent === UnitRepresentType.raw) {
		// This is a raw type graphing unit so cannot plot
		layout = {
			'xaxis': {
				'visible': false
			},
			'yaxis': {
				'visible': false
			},
			'annotations': [
				{
					'text': `<b>${translate('compare.raw')}</b>`,
					'xref': 'paper',
					'yref': 'paper',
					'showarrow': false,
					'font': {
						'size': 18
					}
				}
			]
		};
	} else {
		layout = {
			title: `<b>${changeSummary}</b>`,
			titlefont: {
				size: 10,
				color: colorize(entity.change)
			},
			hovermode: 'closest',
			autosize: true,
			width: 370,
			height: 450,
			showlegend: false,
			legend: {
			},
			yaxis: {
				title: unitLabel,
				showgrid: true,
				gridcolor: '#ddd',
				fixedrange: true
			},
			xaxis: {
				title: `${xTitle}`,
				showgrid: false,
				gridcolor: '#ddd',
				automargin: true,
				fixedrange: true
			},
			margin: {
				t: 20,
				b: 120,
				l: 60,
				r: 20
			}
		};
	}

	// Assign all the parameters required to create the Plotly object (data, layout, config) to the variable props, returned by mapStateToProps
	// The Plotly toolbar is displayed if displayModeBar is set to true
	const props: any = {
		data: datasets,
		layout,
		config: {
			displayModeBar: false,
			locale,
			locales: Locales // makes locales available for use
		}
	};
	props.config.locale = state.appState.selectedLanguage;
	return props;
}

export default connect(mapStateToProps)(Plot);
