/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import * as moment from 'moment';
import Plot from 'react-plotly.js';
import ThreeDPillComponent from './ThreeDPillComponent';
import SpinnerComponent from './SpinnerComponent';
import { State } from '../types/redux/state';
import { useDispatch, useSelector } from 'react-redux';
import { ThreeDReading } from '../types/readings'
import { roundTimeIntervalForFetch } from '../utils/dateRangeCompatability';
import { lineUnitLabel } from '../utils/graphics';
import { AreaUnitType, getAreaUnitConversion } from '../utils/getAreaUnitConversion';
import translate from '../utils/translate';
import { isValidThreeDInterval } from '../utils/dateRangeCompatability';
import { ByMeterOrGroup, GraphState, MeterOrGroup } from '../types/redux/graph';
import { Dispatch } from '../types/redux/actions';
import { useEffect } from 'react';
import { fetchNeededThreeDReadings } from '../actions/threeDReadings';
import { UnitsState } from 'types/redux/units';
import { MetersState } from 'types/redux/meters';
import { GroupsState } from 'types/redux/groups';

/**
 * Component used to render 3D graphics
 * @returns 3D Plotly 3D Surface Graph
 */
export default function ThreeDComponent() {
	const dispatch: Dispatch = useDispatch();
	const metersState = useSelector((state: State) => state.meters);
	const groupsState = useSelector((state: State) => state.groups);
	const graphState = useSelector((state: State) => state.graph);
	const unitState = useSelector((state: State) => state.units);
	const threeDReadings = useSelector((state: State) => state.readings.threeD);
	const isFetching = useSelector((state: State) => state.readings.threeD.isFetching);

	const threeDState = graphState.threeD;
	const meterOrGroupID = threeDState.meterOrGroupID;

	// meterOrGroup determines whether to get readings from state .byMeterID or .byGroupID
	const byMeterOrGroup = threeDState.meterOrGroup === MeterOrGroup.meters ? ByMeterOrGroup.meters : ByMeterOrGroup.groups;

	// 3D requires intervals to be rounded to a full day.
	const timeInterval = roundTimeIntervalForFetch(graphState.timeInterval).toString();
	const unitID = graphState.selectedUnit;

	// Level of detail along the xAxis / Readings per day
	const readingInterval = threeDState.readingInterval;

	// Initialize Default values
	let threeDData = null;
	let isAreaCompatible = true;
	let meterOrGroupName = 'Unknown Meter or Group';
	let layout = {};
	let dataToRender = null;

	// Meter Or Group is selected
	if (meterOrGroupID) {
		// Get Reading data, if any
		threeDData = threeDReadings[byMeterOrGroup][meterOrGroupID]?.[timeInterval]?.[unitID]?.[readingInterval]?.readings;

		// Get Meter or Group's info
		const meterOrGroupInfo = threeDState.meterOrGroup === MeterOrGroup.meters ?
			metersState.byMeterID[meterOrGroupID]
			:
			groupsState.byGroupID[meterOrGroupID];

		// Use Meter or Group's info to determine whether it can be rendered with area normalization
		const area = meterOrGroupInfo.area;
		const areaUnit = meterOrGroupInfo.areaUnit;
		isAreaCompatible = area !== 0 && areaUnit !== AreaUnitType.none;

		// Get Meter Or Groups name/label
		meterOrGroupName = threeDState.meterOrGroup === MeterOrGroup.meters ?
			metersState.byMeterID[meterOrGroupID].identifier
			:
			groupsState.byGroupID[meterOrGroupID].name;
	}

	if (!meterOrGroupID) {
		// No selected Meters
		layout = setHelpLayout(translate('select.meter.group'));
	} else if (graphState.areaNormalization && !isAreaCompatible) {
		layout = setHelpLayout(`${meterOrGroupName}${translate('threeD.area.incompatible')}`);
	} else if (!isValidThreeDInterval(roundTimeIntervalForFetch(graphState.timeInterval))) {
		// Not a valid time interval. ThreeD can only support up to 1 year of readings
		layout = setHelpLayout(translate('threeD.date.range.too.long'));
	} else if (!threeDData) {
		// Not actually 'rendering', but from the user perspective should make sense.
		layout = setHelpLayout(translate('threeD.rendering'));
	} else if (threeDData.zData.length === 0) {
		// There is no data in the selected date range.
		layout = setHelpLayout(translate('threeD.no.data'));
	} else if (threeDData.zData[0][0] && threeDData.zData[0][0] < 0) {
		// Special Case where meter frequency is greater than 12 hour intervals
		layout = setHelpLayout(translate('threeD.incompatible'));
	} else {
		[dataToRender, layout] = formatThreeDData(threeDData, meterOrGroupID, metersState, groupsState, graphState, unitState);
	}

	// Necessary for the case when a meter/group is selected and time intervals get altered externally. (Line graphic slider, for example.)
	useEffect(() => {
		// Fetch on initial render only, all other fetch will be called from PillBadges, or meter/group multiselect
		dispatch(fetchNeededThreeDReadings());
	}, [])

	return (
		<div style={{ width: '100%', height: '75vh' }}>
			<ThreeDPillComponent />
			{isFetching ?
				<SpinnerComponent loading width={50} height={50} />
				:
				<Plot
					data={dataToRender as Plotly.Data[]}
					layout={layout as Plotly.Layout}
					config={config}
					style={{ width: '100%', height: '80%' }}
					useResizeHandler={true}
				/>
			}
		</div>
	)
}

/**
 * Formats Readings for plotly 3d surface
 * @param data 3D data to be formatted
 * @param selectedMeterOrGroupID meter or group id to lookup data for
 * @param meters redux meters state
 * @param groups redux groups state
 * @param graphState redux graph state
 * @param unitsState redux units state
 * @returns Data, and Layout objects for a 3D Plotly Graph
 */
function formatThreeDData(
	data: ThreeDReading,
	selectedMeterOrGroupID: number,
	meters: MetersState,
	groups: GroupsState,
	graphState: GraphState,
	unitsState: UnitsState
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
		const selectUnitState = unitsState.units[graphState.selectedUnit];
		if (selectUnitState !== undefined) {
			// Determine the y-axis label and if the rate needs to be scaled.
			const returned = lineUnitLabel(selectUnitState, currentSelectedRate, graphState.areaNormalization, graphState.selectedAreaUnit);
			unitLabel = returned.unitLabel
			needsRateScaling = returned.needsRateScaling;
			// The rate will be 1 if it is per hour (since state readings are per hour) or no rate scaling so no change.
			const rateScaling = needsRateScaling ? currentSelectedRate.rate : 1;

			const meterArea = meterOrGroup === MeterOrGroup.meters ?
				meters.byMeterID[selectedMeterOrGroupID].area
				:
				groups.byGroupID[selectedMeterOrGroupID].area;

			const areaUnit = meterOrGroup === MeterOrGroup.meters ?
				meters.byMeterID[selectedMeterOrGroupID].areaUnit
				:
				groups.byGroupID[selectedMeterOrGroupID].areaUnit;

			// We either don't care about area, or we do in which case there needs to be a nonzero area.
			if (!graphState.areaNormalization || (meterArea > 0 && areaUnit != AreaUnitType.none)) {
				// Convert the meter area into the proper unit if normalizing by area or use 1 if not so won't change reading values.
				const areaScaling = graphState.areaNormalization ?
					meterArea * getAreaUnitConversion(areaUnit, graphState.selectedAreaUnit) : 1;
				// Divide areaScaling into the rate so have complete scaling factor for readings.
				const scaling = rateScaling / areaScaling;
				zDataToRender = data.zData.map(day => day.map(reading => reading === null ? null : reading * scaling));
			}
		}
	}

	// Calculate Hover Text, and populate xLabels/yLabels
	const hoverText = zDataToRender.map((day, i) => day.map((readings, j) => {
		const startTS = moment.utc(data.xData[j].startTimestamp);
		const endTS = moment.utc(data.xData[j].endTimestamp);
		const midpointTS = moment.utc(startTS.clone().add(endTS.clone().diff(startTS) / 2));
		const dateTS = moment.utc(data.yData[i])

		// Use first day's values to populate xData Labels
		if (i === 0) {
			xDataToRender.push(midpointTS.format('h:mm A'));
		}

		// Use the first index of each row/day to extract the dates for the yLabels
		if (j === 0) {
			// Trimming the year from YYYY to YY was the only method that worked for fixing overlapping ticks and labels on y axis
			// TODO find better approach as full year YYYY may be desired behavior for users.
			yDataToRender.push(dateTS.format(moment.localeData().longDateFormat('L').replace(/YYYY/g, 'YY')));
		}

		const time = midpointTS.format('h:mm A');
		const date = dateTS.format('LL');
		// ThreeD graphic readings can be null. If not null round to a precision.
		const readingValue = readings === null ? null : readings.toPrecision(6);
		return `${translate('threeD.date')}: ${date}<br>${translate('threeD.time')}: ${time}<br>${unitLabel}: ${readingValue}`;
	}));

	const formattedData = [{
		type: 'surface',
		showlegend: false,
		showscale: false,
		// zmin: 0,
		x: xDataToRender,
		y: yDataToRender,
		z: zDataToRender,
		hoverinfo: 'text',
		hovertext: hoverText
	}]
	const layout = setThreeDLayout(unitLabel);
	return [formattedData, layout]
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
	}
}

/**
 * Utility to get / set 3D graphic plotlyLayout
 * @param zLabelText 3D data to be formatted
 * @returns plotly layout object.
 */
function setThreeDLayout(zLabelText: string = 'Resource Usage') {
	// responsible for setting Labels
	return {
		autosize: true,
		//Leaves holes in graph for missing, undefined, NaN, or null values
		connectgaps: false,
		scene: {
			xaxis: {
				title: { text: translate('threeD.x.axis.label') }
			},
			yaxis: {
				title: { text: translate('threeD.y.axis.label') }
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
	}
}

const config = {
	responsive: true
};