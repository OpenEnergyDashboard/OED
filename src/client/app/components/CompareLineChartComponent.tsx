/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as moment from 'moment';
import * as React from 'react';
import Plot from 'react-plotly.js';
import { readingsApi, stableEmptyLineReadings } from '../redux/api/readingsApi';
import { useAppSelector } from '../redux/reduxHooks';
import { selectCompareLineQueryArgs } from '../redux/selectors/chartQuerySelectors';
import { selectLineUnitLabel } from '../redux/selectors/plotlyDataSelectors';
import { selectSelectedLanguage } from '../redux/slices/appStateSlice';
import Locales from '../types/locales';
import translate from '../utils/translate';
import SpinnerComponent from './SpinnerComponent';
import { selectGraphState, selectShiftAmount } from '../redux/slices/graphSlice';
import ThreeDPillComponent from './ThreeDPillComponent';
import { selectThreeDComponentInfo } from '../redux/selectors/threeDSelectors';
import { selectPlotlyGroupData, selectPlotlyMeterData } from '../redux/selectors/lineChartSelectors';
import { MeterOrGroup, ShiftAmount } from '../types/redux/graph';
import { showInfoNotification, showWarnNotification } from '../utils/notifications';
import { setHelpLayout } from './ThreeDComponent';
import { toast } from 'react-toastify';

/**
 * @returns plotlyLine graphic
 */
export default function CompareLineChartComponent() {
	const graphState = useAppSelector(selectGraphState);
	const meterOrGroupID = useAppSelector(selectThreeDComponentInfo).meterOrGroupID;
	const unitLabel = useAppSelector(selectLineUnitLabel);
	const locale = useAppSelector(selectSelectedLanguage);
	const shiftAmount = useAppSelector(selectShiftAmount);
	const { args, shouldSkipQuery, argsDeps } = useAppSelector(selectCompareLineQueryArgs);
	// getting the time interval of current data
	const timeInterval = graphState.queryTimeInterval;
	const shiftInterval = graphState.shiftTimeInterval;
	// Layout for the plot
	let layout = {};

	// Fetch original data, and derive plotly points
	const { data, isFetching } = graphState.threeD.meterOrGroup === MeterOrGroup.meters ?
		readingsApi.useLineQuery(args,
			{
				skip: shouldSkipQuery,
				selectFromResult: ({ data, ...rest }) => ({
					...rest,
					data: selectPlotlyMeterData(data ?? stableEmptyLineReadings,
						{ ...argsDeps, compatibleEntities: [meterOrGroupID!] })
				})
			})
		:
		readingsApi.useLineQuery(args,
			{
				skip: shouldSkipQuery,
				selectFromResult: ({ data, ...rest }) => ({
					...rest,
					data: selectPlotlyGroupData(data ?? stableEmptyLineReadings,
						{ ...argsDeps, compatibleEntities: [meterOrGroupID!] })
				})
			});

	// Getting the shifted data
	const { data: dataNew, isFetching: isFetchingNew } = graphState.threeD.meterOrGroup === MeterOrGroup.meters ?
		readingsApi.useLineQuery({ ...args, timeInterval: shiftInterval.toString() },
			{
				skip: shouldSkipQuery,
				selectFromResult: ({ data, ...rest }) => ({
					...rest,
					data: selectPlotlyMeterData(data ?? stableEmptyLineReadings,
						{ ...argsDeps, compatibleEntities: [meterOrGroupID!] })
				})
			})
		:
		readingsApi.useLineQuery({ ...args, timeInterval: shiftInterval.toString() },
			{
				skip: shouldSkipQuery,
				selectFromResult: ({ data, ...rest }) => ({
					...rest,
					data: selectPlotlyGroupData(data ?? stableEmptyLineReadings,
						{ ...argsDeps, compatibleEntities: [meterOrGroupID!] })
				})
			});

	// Check if there is at least one valid graph for current data and shifted data
	const enoughData = data.find(data => data.x!.length > 1) && dataNew.find(dataNew => dataNew.x!.length > 1);

	// Customize the layout of the plot
	// See https://community.plotly.com/t/replacing-an-empty-graph-with-a-message/31497 for showing text `not plot.
	if (!meterOrGroupID) {
		layout = setHelpLayout(translate('select.meter.group'));
	} else if (!timeInterval.getIsBounded() || !shiftInterval.getIsBounded()) {
		layout = setHelpLayout(translate('please.set.the.date.range'));
	} else if (shiftAmount === ShiftAmount.none) {
		layout = setHelpLayout(translate('select.shift.amount'));
	} else if (!enoughData) {
		layout = setHelpLayout(translate('no.data.in.range'));
	} else {
		if (!isFetching && !isFetchingNew) {
			// Checks/warnings on received reading data
			checkReceivedData(data[0].x, dataNew[0].x);
		}
		layout = {
			autosize: true, showlegend: true,
			legend: { x: 0, y: 1.1, orientation: 'h' },
			// 'fixedrange' on the yAxis means that dragging is only allowed on the xAxis which we utilize for selecting dateRanges
			yaxis: { title: unitLabel, gridcolor: '#ddd', fixedrange: true },
			xaxis: {
				// Set range for x-axis based on timeIntervalStr so that current data and shifted data is aligned
				range: timeInterval.getIsBounded()
					? [timeInterval.getStartTimestamp(), timeInterval.getEndTimestamp()]
					: undefined
			},
			xaxis2: {
				titlefont: { color: '#1AA5F0' },
				tickfont: { color: '#1AA5F0' },
				overlaying: 'x',
				side: 'top',
				// Set range for x-axis2 based on shiftIntervalStr so that current data and shifted data is aligned
				range: shiftInterval.getIsBounded()
					? [shiftInterval.getStartTimestamp(), shiftInterval.getEndTimestamp()]
					: undefined
			}
		};
	}

	// Adding information to the shifted data so that it can be plotted on the same graph with current data
	const updateDataNew = dataNew.map(item => ({
		...item,
		name: 'Shifted ' + item.name,
		line: { ...item.line, color: '#1AA5F0' },
		xaxis: 'x2',
		text: Array.isArray(item.text)
			? item.text.map(text => text.replace('<br>', '<br>Shifted '))
			: item.text?.replace('<br>', '<br>Shifted ')
	}));

	return (
		<>
			<ThreeDPillComponent />
			{isFetching || isFetchingNew
				? <SpinnerComponent loading height={50} width={50} />
				: <Plot
					// Only plot shifted data if the shiftAmount has been chosen
					data={shiftAmount === ShiftAmount.none ? [] : [...data, ...updateDataNew]}
					style={{ width: '100%', height: '100%', minHeight: '750px' }}
					layout={layout}
					config={{
						responsive: true,
						displayModeBar: false,
						// Current Locale
						locale,
						// Available Locales
						locales: Locales
					}}
				/>
			}

		</>

	);

}

/**
 * If the number of points differs for the original and shifted lines, the data will not appear at the same places horizontally.
 * The time interval in the original and shifted line for the actual readings can have issues.
 * While the requested time ranges should be the same, the actually returned readings may differ.
 * This can happen if there are readings missing including start, end or between. If the number of readings vary then there is an issue.
 * If not, it is unlikely but can happen if there are missing readings in both lines that do not align but there are the same number missing in both.
 * This is an ugly edge case that OED is not going to try to catch now.
 * Use the last index in Redux state as a proxy for the number since need that below.
 * @param originalReading original data to compare
 * @param shiftedReading shifted data to compare
 */
function checkReceivedData(originalReading: any, shiftedReading: any) {
	let numberPointsSame = true;
	if (originalReading.length !== shiftedReading.length) {
		// If the number of points vary then then scales will not line up point by point. Warn the user.
		numberPointsSame = false;
		showWarnNotification(
			`The original line has ${originalReading.length} readings but the shifted line has ${shiftedReading.length}`
			+ ' readings which means the points will not align horizontally.'
		);
	}
	// Now see if the original and shifted lines overlap.
	if (moment(shiftedReading.at(-1).toString()) > moment(originalReading.at(0).toString())) {
		showInfoNotification(
			`The shifted line overlaps the original line starting at ${originalReading[0]}`,
			toast.POSITION.TOP_RIGHT,
			15000
		);
	}

	// Now see if day of the week aligns.
	// If the number of points is not the same then no horizontal alignment so do not tell user.
	const firstOriginReadingDay = moment(originalReading.at(0)?.toString());
	const firstShiftedReadingDay = moment(shiftedReading.at(0)?.toString());
	if (numberPointsSame && firstOriginReadingDay.day() === firstShiftedReadingDay.day()) {
		showInfoNotification('Days of week align (unless missing readings)',
			toast.POSITION.TOP_RIGHT,
			15000
		);
	}
	// Now see if the month and day align. If the number of points is not the same then no horizontal
	// alignment so do not tell user. Check if the first reading matches because only notify if this is true.
	if (numberPointsSame && monthDateSame(firstOriginReadingDay, firstShiftedReadingDay)) {
		// Loop over all readings but the first. Really okay to do first but just checked that one.
		// Note length of original and shifted same so just use original.
		let message = 'The month and day of the month align for the original and shifted readings';
		for (let i = 1; i < originalReading.length; i++) {
			if (!monthDateSame(moment(originalReading.at(i)?.toString()), moment(shiftedReading.at(i)?.toString()))) {
				// Mismatch so inform user. Should be due to leap year crossing and differing leap year.
				// Only tell first mistmatch
				message += ` until original reading at date ${moment(originalReading.at(i)?.toString()).format('ll')}`;
				break;
			}
		}
		showInfoNotification(message, toast.POSITION.TOP_RIGHT, 15000);
	}
}

/**
 * Check if the two dates have the same date and month
 * @param firstDate first date to compare
 * @param secondDate second date to compare
 * @returns true if the month and date are the same
 */
function monthDateSame(firstDate: moment.Moment, secondDate: moment.Moment) {
	// The month (0 up numbering) and date (day of month with 1 up numbering) must match.
	// The time could be checked but the granulatity should be the same for original and
	// shifted readings and only mismatch if there is missing readings. In the unlikely
	// event of having the same number of points but different missing readings then
	// the first one will mismatch the month or day unless those happen to match in which
	// case it is still true that they are generally okay so ignore all this.
	return firstDate.month() === secondDate.month() && firstDate.date() === secondDate.date();
}