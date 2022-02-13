/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { connect } from 'react-redux';
import { State } from '../types/redux/state';
import { getComparePeriodLabels, getCompareChangeSummary, calculateCompareShift } from '../utils/calculateCompare';
import { CompareEntity } from './MultiCompareChartContainer';
import translate from '../utils/translate';
import Plot from 'react-plotly.js';
import Locales from '../types/locales';
import * as moment from 'moment';

interface CompareChartContainerProps {
	entity: CompareEntity;
}

/* Passes the current redux state of the of the chart container and it's props, and turns it into props for the React
*  component, which is what will be visible on the page. Makes it possible to access
*  your reducer state objects from within your React components.
*
*  Returns the props object. */
function mapStateToProps(state: State, ownProps: CompareChartContainerProps): any {
	const comparePeriod = state.graph.comparePeriod;
	const datasets: any[] = [];
	const periodLabels = getComparePeriodLabels(comparePeriod);

	// Get the time shift for this comparison as a moment duration
	const compareShift = calculateCompareShift(comparePeriod);
	// The start and end of this time period. Need to create new moment objects since subtraction mutates the original.
	// It isn't known why you must start from a string to get timezone aware dates but it seems needed.
	// There might be a better way to do this.
	// Use UTC timezone to avoid timezone issues.
	const thisStartTime = moment(state.graph.compareTimeInterval.getStartTimestamp().toString()).utc();
	// Only do to start of the hour since OED is using hourly data so fractions of an hour are not given.
	// The start time is always midnight so this is not needed.
	const thisEndTime = moment(state.graph.compareTimeInterval.getEndTimestamp().startOf('hour').toString()).utc();
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
		if (changeForColorization < 0) {
			return 'green';
		}
		return 'red';
	};

	// Compose the text to display to the user.
	const entity = ownProps.entity;
	const changeSummary = getCompareChangeSummary(entity.change, entity.name, periodLabels);

	const barColor = 'rgba(218, 165, 32, 1)';

	const previousPeriod = entity.prevUsage;
	const currentPeriod = entity.currUsage;

	datasets.push(
		{
			x: [`${periodLabels.prev} (A)`, `${periodLabels.current} (B)`],
			y: [previousPeriod, currentPeriod],
			hovertext: [
				`<b>${previousPeriod} KWh</b> ${translate('used.this.time')}<br>${periodLabels.prev.toLowerCase()}`,
				`<b>${currentPeriod} KWh</b> ${translate('used.so.far')}<br>${periodLabels.current.toLowerCase()}`
			],
			hoverinfo: 'text',
			type: 'bar',
			marker: {color: barColor},
			text: [ `<b>${previousPeriod} kWh</b>`, `<b>${currentPeriod} kWh</b>`],
			textposition: 'auto',
			textfont: {
				color: 'rgba(0,0,0,1)'
			}
		}
	);

	const layout: any = {
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
			title: 'kWh',
			showgrid: true,
			gridcolor: '#ddd'
		},
		xaxis: {
			title: `${xTitle}`,
			showgrid: false,
			gridcolor: '#ddd',
			automargin: true
		},
		margin: {
			t: 20,
			b: 120,
			l: 60,
			r: 20
		}
	};

	// Assign all the parameters required to create the Plotly object (data, layout, config) to the variable props, returned by mapStateToProps
	// The Plotly toolbar is displayed if displayModeBar is set to true
	const props: any = {
		data: datasets,
		layout,
		config: {
			displayModeBar: false,
			locales: Locales // makes locales available for use
		}
	};
	props.config.locale = state.admin.defaultLanguage;
	return props;
}

export default connect(mapStateToProps)(Plot);
