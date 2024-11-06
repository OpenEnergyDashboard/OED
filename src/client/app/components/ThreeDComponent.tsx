/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as moment from 'moment';
import * as React from 'react';
import { selectGroupDataById } from '../redux/api/groupsApi';
import { selectMeterDataById } from '../redux/api/metersApi';
import { readingsApi } from '../redux/api/readingsApi';
import { selectUnitDataById } from '../redux/api/unitsApi';
import { useAppSelector } from '../redux/reduxHooks';
import { selectThreeDQueryArgs } from '../redux/selectors/chartQuerySelectors';
import { selectThreeDComponentInfo } from '../redux/selectors/threeDSelectors';
import { selectScalingFromEntity } from '../redux/selectors/entitySelectors';
import { selectGraphState } from '../redux/slices/graphSlice';
import { ThreeDReading } from '../types/readings';
import { GraphState, MeterOrGroup } from '../types/redux/graph';
import { GroupDataByID } from '../types/redux/groups';
import { MeterDataByID } from '../types/redux/meters';
import { UnitDataById } from '../types/redux/units';
import { isValidThreeDInterval, roundTimeIntervalForFetch } from '../utils/dateRangeCompatibility';
import { AreaUnitType } from '../utils/getAreaUnitConversion';
import { lineUnitLabel } from '../utils/graphics';
// Both translates are used since some are in the function component where the React Hook is okay
// and some are in other functions where the older method is needed.
import { useTranslate } from '../redux/componentHooks';
import translate from '../utils/translate';
import SpinnerComponent from './SpinnerComponent';
import ThreeDPillComponent from './ThreeDPillComponent';
import Plot from 'react-plotly.js';
import { selectSelectedLanguage } from '../redux/slices/appStateSlice';
import Locales from '../types/locales';

/**
 * Component used to render 3D graphics
 * @returns 3D Plotly 3D Surface Graph
 */
export default function ThreeDComponent() {
	const translate = useTranslate();
	const { args, shouldSkipQuery } = useAppSelector(selectThreeDQueryArgs);
	const { data, isFetching } = readingsApi.endpoints.threeD.useQuery(args, { skip: shouldSkipQuery });
	const meterDataById = useAppSelector(selectMeterDataById);
	const groupDataById = useAppSelector(selectGroupDataById);
	const unitDataById = useAppSelector(selectUnitDataById);
	const graphState = useAppSelector(selectGraphState);
	const locale = useAppSelector(selectSelectedLanguage);
	const { meterOrGroupID, meterOrGroupName, isAreaCompatible } = useAppSelector(selectThreeDComponentInfo);


	// Initialize Default values
	const threeDData = data;
	let layout = {};
	let dataToRender = null;


	if (!meterOrGroupID) {
		// No selected Meters
		layout = setHelpLayout(translate('select.meter.group'));
	} else if (graphState.areaNormalization && !isAreaCompatible) {
		layout = setHelpLayout(`${meterOrGroupName}${translate('threeD.area.incompatible')}`);
	} else if (!isValidThreeDInterval(roundTimeIntervalForFetch(graphState.queryTimeInterval))) {
		// Not a valid time interval. ThreeD can only support up to 1 year of readings
		layout = setHelpLayout(translate('threeD.date.range.too.long'));
	} else if (!threeDData) {
		// Not actually 'rendering', but from the user perspective should make sense.
		layout = setHelpLayout(translate('threeD.rendering'));
	} else if (threeDData.zData.length === 0) {
		// There is no data in the selected date range.
		layout = setHelpLayout(translate('no.data.in.range'));
	} else if (threeDData.zData[0][0] && threeDData.zData[0][0] < 0) {
		// Special Case where meter frequency is greater than 12 hour intervals
		layout = setHelpLayout(translate('threeD.incompatible'));
	} else {
		[dataToRender, layout] = formatThreeDData(threeDData, meterOrGroupID, meterDataById, groupDataById, graphState, unitDataById);
	}

	return (
		<>
			<ThreeDPillComponent />
			{isFetching
				? <SpinnerComponent loading width={50} height={50} />
				: <Plot
					style={{ width: '100%', height: '100%', minHeight: '700px' }}
					data={dataToRender as Plotly.PlotData[]}
					layout={layout as Plotly.Layout}
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
 * Formats Readings for plotly 3d surface
 * @param data 3D data to be formatted
 * @param selectedMeterOrGroupID meter or group id to lookup data for
 * @param meterDataById redux meters state
 * @param groupDataById redux groups state
 * @param graphState redux graph state
 * @param unitDataById redux units state
 * @returns Data, and Layout objects for a 3D Plotly Graph
 */
function formatThreeDData(
	data: ThreeDReading,
	selectedMeterOrGroupID: number,
	meterDataById: MeterDataByID,
	groupDataById: GroupDataByID,
	graphState: GraphState,
	unitDataById: UnitDataById
) {
	// Initialize Plotly Data
	const xDataToRender: string[] = [];
	const yDataToRender: string[] = [];
	let zDataToRender = data.zData;

	// Variable helps when looking into state readings....byMeterID or readings...byGroupID
	const meterOrGroup = graphState.threeD.meterOrGroup;

	// The unit label depends on the unit which is in selectUnit state.
	const graphingUnit = graphState.selectedUnit;
	// The current selected rate
	const currentSelectedRate = graphState.lineGraphRate;
	let unitLabel = '';
	let needsRateScaling = false;
	if (graphingUnit !== -99) {
		const selectUnitState = unitDataById[graphState.selectedUnit];
		if (selectUnitState !== undefined) {
			// Determine the y-axis label and if the rate needs to be scaled.
			const returned = lineUnitLabel(selectUnitState, currentSelectedRate, graphState.areaNormalization, graphState.selectedAreaUnit);
			unitLabel = returned.unitLabel;
			needsRateScaling = returned.needsRateScaling;
			// The rate will be 1 if it is per hour (since state readings are per hour) or no rate scaling so no change.
			const rateScaling = needsRateScaling ? currentSelectedRate.rate : 1;

			const entity = meterOrGroup === MeterOrGroup.meters ?
				meterDataById[selectedMeterOrGroupID]
				:
				groupDataById[selectedMeterOrGroupID];
			const scaling = selectScalingFromEntity(entity, graphState.selectedAreaUnit, graphState.areaNormalization, rateScaling);

			if (!graphState.areaNormalization || (entity.area > 0 && entity.areaUnit != AreaUnitType.none)) {
				zDataToRender = data.zData.map(day => day.map(reading => reading === null ? null : reading * scaling));
			}
		}
	}

	// Calculate Hover Text, and populate xLabels/yLabels
	const hoverText = zDataToRender.map((day, i) => day.map((readings, j) => {
		const startTS = moment.utc(data.xData[j].startTimestamp);
		const endTS = moment.utc(data.xData[j].endTimestamp);
		const midpointTS = moment.utc(startTS.clone().add(endTS.clone().diff(startTS) / 2));
		const dateTS = moment.utc(data.yData[i]);

		// Use first day's values to populate xData Labels
		if (i === 0) {
			xDataToRender.push(midpointTS.format('LT'));
		}

		// Use the first index of each row/day to extract the dates for the yLabels
		if (j === 0) {
			yDataToRender.push(dateTS.format('YYYY-MM-DD HH:mm:ss'));
		}

		const time = midpointTS.format('LT');
		const date = dateTS.format('LL');
		// ThreeD graphic readings can be null. If not null round to a precision.
		const readingValue = readings === null ? null : readings.toPrecision(6);
		return `${translate('threeD.date')}: ${date}<br>${translate('threeD.time')}: ${time}<br>${unitLabel}: ${readingValue}`;
	}));

	const formattedData = [{
		type: 'surface',
		showlegend: false,
		showscale: false,
		x: xDataToRender,
		y: yDataToRender,
		z: zDataToRender,
		hoverinfo: 'text',
		hovertext: hoverText
	}];
	const layout = setThreeDLayout(unitLabel, yDataToRender);
	return [formattedData, layout];
}

/**
 * Utility to get/ set help text plotlyLayout
 * @param helpText 3D data to be formatted
 * @param fontSize current application state
 * @returns plotly layout object.
 */
function setHelpLayout(helpText: string = 'Help Text Goes Here', fontSize: number = 28) {
	return {
		'xaxis': {
			'visible': false
		},
		'yaxis': {
			'visible': false
		},
		'annotations': [
			{
				'text': helpText,
				'xref': 'paper',
				'yref': 'paper',
				'showarrow': false,
				'font': { 'size': fontSize }
			}
		]
	};
}

/**
 * Utility to get / set 3D graphic plotlyLayout
 * @param zLabelText 3D data to be formatted
 * @param yDataToRender Data range for yaxis
 * @returns plotly layout object.
 */
function setThreeDLayout(zLabelText: string = 'Resource Usage', yDataToRender: string[]) {
	// Convert date strings to JavaScript Date objects and then get dataRange
	const dateObjects = yDataToRender.map(dateStr => new Date(dateStr));
	const dataMin = Math.min(...dateObjects.map(date => date.getTime()));
	const dataMax = Math.max(...dateObjects.map(date => date.getTime()));
	const dataRange = dataMax - dataMin;

	//Calculate nTicks for small num of days on y-axis; possibly a better way
	let nTicks, dTick = 'd1';
	if (dataRange <= 864000000) { // 1 Day (need 2 ticks)
		nTicks = 2;
	} else if (dataRange <= 172800000) { // 2 days
		nTicks = 3;
	} else if (dataRange <= 259200000) { // 3 Days
		nTicks = 4;
	} else if (dataRange <= 345600000) { // 4 Days
		nTicks = 5;
	} else { // Anything else; use default nTicks/dTick
		nTicks = 0;
		dTick = '';
	}
	// responsible for setting Labels
	return {
		// Eliminate margin
		margin: { t: 0, b: 0, l: 0, r: 0 },
		// Leaves gaps / voids in graph for missing, undefined, NaN, or null values
		connectgaps: false,
		scene: {
			xaxis: {
				title: { text: translate('threeD.x.axis.label') }
			},
			yaxis: {
				nticks: nTicks,
				dtick: dTick,
				title: { text: translate('threeD.y.axis.label') },
				tickangle: 0 // This lets y-axis dates appear horizontally rather overlapping ticks
			},
			zaxis: {
				title: { text: zLabelText }
			},
			// Somewhat suitable aspect ratio values for 3D Graphs
			aspectratio: {
				x: 1,
				y: 2.75,
				z: 1
			},
			// Somewhat suitable camera eye values for data of zResource[day][interval]
			camera: {
				eye: {
					x: 2.5,
					y: -1.6,
					z: 0.8
				}
			}
		}
	} as Partial<Plotly.Layout>;
}

