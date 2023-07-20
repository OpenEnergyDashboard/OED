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
	const metersSelected = useSelector((state: State) => state.graph.selectedMeters[0] || state.graph.selectedGroups[0]);
	const timeInterval = useSelector((state: State) => state.graph.timeInterval);
	const dataToRender = useSelector((state: State) => {
		const selectedMeterID = state.graph.selectedMeters[0];
		const selectedGroupID = state.graph.selectedGroups[0];

		// No Meters or Groups are selected
		if (!selectedMeterID && !selectedGroupID) {
			return null;
		}
		// In the current implementation, meters and groups should never both be populated at the same time
		const meterOrGroupID = selectedMeterID ? selectedMeterID : selectedGroupID;	// If a meter id is present use it, use group meter.
		const meterOrGroup = selectedMeterID ? 'byMeterID' : 'byGroupID'; // If a meter id is present look in byMeterId else look in byGroupId
		const timeInterval = roundTimeIntervalForFetch(state.graph.timeInterval).toString();
		const unitID = state.graph.selectedUnit;
		const precision = state.graph.threeDAxisPrecision;

		const threeDReadings = state.readings.threeD[meterOrGroup][meterOrGroupID]?.[timeInterval]?.[unitID]?.[precision]?.readings;

		// if readings for the meter or group don't exist return null
		if (!threeDReadings) {
			return null;
		}

		// return formatted data.
		return formatThreeDData(threeDReadings, state);
	});
	// TODO Refactor layout logic info 3d utilities files.
	let layout: object = {};
	if (!metersSelected) {
		layout = {
			...helpInfoLayout,
			annotations: [{
				...helpInfoLayout.annotations[0],
				'text': `${translate('select.meter.group')}`
			}]
		};
	}
	else if (!isValidThreeDInterval(timeInterval)) {
		layout = {
			...helpInfoLayout,
			annotations: [{
				...helpInfoLayout.annotations[0],
				'text': 'Date Range Must Be A year or less!'
			}]
		};
	} else if (dataToRender === null) {
		layout = {
			...helpInfoLayout,
			annotations: [{
				...helpInfoLayout.annotations[0],
				'text': `${translate('select.meter.group')}`
			}]
		};

	} else if (dataToRender[0].z.length === 0) {
		layout = {
			...helpInfoLayout,
			annotations: [{
				...helpInfoLayout.annotations[0],
				'text': 'No Data In Date Range.'
			}]
		}
	} else {
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
 * @param state current application state
 * @returns the a time interval into a dateRange compatible for a date-picker.
 */
function formatThreeDData(data: ThreeDReading, state: State): Array<ThreeDPlotlyData> {
	const selectedMeterOrGroupID = state.graph.selectedMeters[0] ? state.graph.selectedMeters[0] : state.graph.selectedGroups[0];
	// This variable helps when looking into state readings....byMeterID or readings...byGroupID
	const meterOrGroup = state.graph.selectedMeters[0] ? 'meter' : 'group';

	// The unit label depends on the unit which is in selectUnit state.
	const graphingUnit = state.graph.selectedUnit;
	// The current selected rate
	const currentSelectedRate = state.graph.lineGraphRate;
	let unitLabel = '';
	let needsRateScaling = false;
	if (graphingUnit !== -99) {
		const selectUnitState = state.units.units[state.graph.selectedUnit];
		if (selectUnitState !== undefined) {
			// Determine the y-axis label and if the rate needs to be scaled.
			const returned = lineUnitLabel(selectUnitState, currentSelectedRate, state.graph.areaNormalization, state.graph.selectedAreaUnit);
			unitLabel = returned.unitLabel
			needsRateScaling = returned.needsRateScaling;
			// The rate will be 1 if it is per hour (since state readings are per hour) or no rate scaling so no change.
			const rateScaling = needsRateScaling ? currentSelectedRate.rate : 1;

			const meterArea = meterOrGroup === 'meter' ?
				state.meters.byMeterID[selectedMeterOrGroupID].area :
				state.groups.byGroupID[selectedMeterOrGroupID].area;

			const areaUnit = meterOrGroup === 'meter' ?
				state.meters.byMeterID[selectedMeterOrGroupID].areaUnit :
				state.groups.byGroupID[selectedMeterOrGroupID].areaUnit;

			// We either don't care about area, or we do in which case there needs to be a nonzero area.
			if (!state.graph.areaNormalization || (meterArea > 0 && areaUnit != AreaUnitType.none)) {

				// Convert the meter area into the proper unit if normalizing by area or use 1 if not so won't change reading values.
				const areaScaling = state.graph.areaNormalization ?
					meterArea * getAreaUnitConversion(areaUnit, state.graph.selectedAreaUnit) : 1;
				// Divide areaScaling into the rate so have complete scaling factor for readings.
				const scaling = rateScaling / areaScaling;
				data.zData = data.zData.map(day => day.map(reading => reading === null ? null : reading * scaling));
			}
		}
	}
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
	'zaxis': {
		'visible': false
	},
	'annotations': [
		{
			'text': `${translate('select.meter.group')}`,
			'xref': 'paper',
			'yref': 'paper',
			'zref': 'paper',
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