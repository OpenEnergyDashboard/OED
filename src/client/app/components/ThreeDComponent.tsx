/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import * as React from 'react';
import * as moment from 'moment';
import Plot from 'react-plotly.js';
import { State } from '../types/redux/state';
import { useSelector } from 'react-redux';
import { ThreeDReading } from '../types/readings'
import { roundTimeIntervalForFetch } from '../utils/dateRangeCompatability';
import { lineUnitLabel } from '../utils/graphics';
import { AreaUnitType, getAreaUnitConversion } from '../utils/getAreaUnitConversion';
import translate from '../utils/translate';
import { isValidThreeDInterval } from '../utils/dateRangeCompatability';
import { GraphState } from 'types/redux/graph';
import { UnitsState } from 'types/redux/units';
import { MetersState } from 'types/redux/meters';
import { GroupsState } from 'types/redux/groups';

type ThreeDPlotlyData = {
	type: 'surface';
	showlegend: boolean;
	showscale: boolean;
	x: string[];
	y: string[];
	z: (number | null | undefined)[][];
	hoverinfo: string;
	hovertext: string[][];
	[key: string]: any;
}

/**
 * Component used to render 3D graphics
 * @returns 3D Plotly 3D Surface Graph
 */
export default function ThreeDComponent() {
	// Uses many selects as to grab relevant data only
	// Particularly important to avoid rerenders for data dispatches not pertaining to 3D. ( line, bar, etc...)
	const graphState = useSelector((state: State) => state.graph);
	const metersState = useSelector((state: State) => state.meters);
	const groupsState = useSelector((state: State) => state.groups);
	const unitsState = useSelector((state: State) => state.units);
	const threeDReadings = useSelector((state: State) => state.readings.threeD); // Update on 3dData changes only

	const selectedMeterID = graphState.selectedMeters[0];
	const selectedGroupID = graphState.selectedGroups[0];
	// In the current implementation, groups and meters cannot be both populated
	const meterOrGroupID = selectedMeterID ? selectedMeterID : selectedGroupID;	// If a meter id is present use it,  else use group.
	const meterOrGroup = selectedMeterID ? 'byMeterID' : 'byGroupID'; // If a meter id is present look in byMeterId else look in byGroupId
	const timeInterval = roundTimeIntervalForFetch(graphState.timeInterval).toString();// 3D dispatches rounds time interval to full days.
	const unitID = graphState.selectedUnit;
	const precision = graphState.threeDAxisPrecision; // Level of detail along the xAxis / Readings per day,
	const threeDData = threeDReadings[meterOrGroup][meterOrGroupID]?.[timeInterval]?.[unitID]?.[precision]?.readings;
	// TODO Refactor layout logic info 3d utilities files.
	let layout: object = {};
	let dataToRender = null;

	if (!selectedMeterID && !selectedGroupID) { // No selected Meters
		layout = setLayout(translate('select.meter.group'));
	} else if (!isValidThreeDInterval(graphState.timeInterval)) { // Not a valid time interval.
		layout = setLayout('Date Range Must be a year or less.');
	} else if (!threeDData || threeDData.zData.length === 0) { // There is no data.
		layout = setLayout('No Data In Date Range.');
	} else {
		dataToRender = formatThreeDData(threeDData, metersState, groupsState, graphState, unitsState);
		layout = threeDLayout;
	}

	return (
		<div style={{ width: '100%', height: '100%' }}>
			<Plot
				data={dataToRender}
				layout={layout}
				config={config}
				style={{ width: '100%', height: '100%' }}
				useResizeHandler={true}
			// Camera Testing Config Purposes only.
			// onUpdate={(figure: any) => console.log(figure.layout.scene.camera)}
			/>
		</div>
	);
}

/**
 * Formats Readings for plotly 3d surface
 * @param data 3D data to be formatted
 * @param meterState current application meter state
 * @param groupState current application group state
 * @param graphState current application graph state
 * @param unitsState current application units state
 * @returns the a time interval into a dateRange compatible for a date-picker.
 */
function formatThreeDData(data: ThreeDReading, meterState: MetersState, groupState: GroupsState, graphState: GraphState, unitsState: UnitsState)
	: Array<ThreeDPlotlyData> {
	const selectedMeterOrGroupID = graphState.selectedMeters[0] ? graphState.selectedMeters[0] : graphState.selectedGroups[0];
	// This variable helps when looking into state readings....byMeterID or readings...byGroupID
	const meterOrGroup = graphState.selectedMeters[0] ? 'meter' : 'group';

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

			const meterArea = meterOrGroup === 'meter' ?
				meterState.byMeterID[selectedMeterOrGroupID].area :
				groupState.byGroupID[selectedMeterOrGroupID].area;

			const areaUnit = meterOrGroup === 'meter' ?
				meterState.byMeterID[selectedMeterOrGroupID].areaUnit :
				groupState.byGroupID[selectedMeterOrGroupID].areaUnit;

			// We either don't care about area, or we do in which case there needs to be a nonzero area.
			if (!graphState.areaNormalization || (meterArea > 0 && areaUnit != AreaUnitType.none)) {

				// Convert the meter area into the proper unit if normalizing by area or use 1 if not so won't change reading values.
				const areaScaling = graphState.areaNormalization ?
					meterArea * getAreaUnitConversion(areaUnit, graphState.selectedAreaUnit) : 1;
				// Divide areaScaling into the rate so have complete scaling factor for readings.
				const scaling = rateScaling / areaScaling;
				data.zData = data.zData.map(day => day.map(reading => reading === null ? null : reading * scaling));
			}
		}
	}
	// TODO find a better way to set the zAxis
	threeDLayout.scene.zaxis.title = unitLabel;

	return [{
		type: 'surface',
		showlegend: false,
		showscale: false,
		// zmin: 0,
		x: data.xData.map(xData => moment.utc(xData).format()),
		y: data.yData.map(yData => moment.utc(yData).format()),
		z: data.zData,
		hoverinfo: 'text',
		hovertext: data.zData.map((day, i) => day.map((readings, j) => //TODO format hover-text based on locale
			`Date: ${moment.utc(data.yData[i]).format('MMM DD, YYYY')}<br>Time: ${moment.utc(data.xData[j]).format('h:mm A')}<br>${unitLabel}: ${readings}`))
	}]
}

/**
 * Utility to get plotlyLayout
 * @param helpText 3D data to be formatted
 * @param fontSize current application state
 * @returns plotly layout object.
 */
function setLayout(helpText: string = 'Help Text Goes Here', fontSize: number = 28) {
	return {
		...helpInfoLayout,
		annotations: [{
			...helpInfoLayout.annotations[0],
			'text': helpText,
			'fontsize': fontSize
		}]
	}
}

const threeDLayout = {
	autosize: true,
	connectgaps: false, //Leaves holes in graph for missing, undefined, NaN, or null values.
	scene: {
		xaxis: {
			title: 'Hours of Day',
			tickformat: '%I:%M %p'
		},
		yaxis: {
			title: { text: 'Days of Calendar Year' },
			tickformat: '%x' // Locale aware date formatting.
		},
		zaxis: { title: 'Resource Usage' },
		aspectratio: {
			x: 1,
			y: 2.75,
			z: 1
		},
		camera: {
			// Somewhat suitable camera eye values for data of zResource[day][hour]
			eye: {
				x: 2.5,
				y: -1.6,
				z: 0.8
			}
		}
	}
};
const helpInfoLayout = {
	'xaxis': {
		'visible': false
	},
	'yaxis': {
		'visible': false
	},
	'annotations': [
		{
			'text': 'Help Text Goes here',
			'xref': 'paper',
			'yref': 'paper',
			'showarrow': false,
			'font': {
				'size': 28
			}
		}
	]
};

const config = {
	responsive: true
};