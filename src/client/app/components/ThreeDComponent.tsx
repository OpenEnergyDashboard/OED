/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import * as React from 'react';
import * as moment from 'moment';
import Plot from 'react-plotly.js';
import ThreeDPillComponent from './ThreeDPillComponent';
import SpinnerComponent from './SpinnerComponent';
import { State } from '../types/redux/state';
import { useSelector } from 'react-redux';
import { ThreeDReading } from '../types/readings'
import { roundTimeIntervalForFetch } from '../utils/dateRangeCompatability';
import { lineUnitLabel } from '../utils/graphics';
import { AreaUnitType, getAreaUnitConversion } from '../utils/getAreaUnitConversion';
import translate from '../utils/translate';
import { isValidThreeDInterval } from '../utils/dateRangeCompatability';


/**
 * Component used to render 3D graphics
 * @returns 3D Plotly 3D Surface Graph
 */
export default function ThreeDComponent() {
	const isFetching = useSelector((state: State) => state.readings.threeD.isFetching);
	const [dataToRender, layout] = useSelector((state: State) => {
		const meterOrGroupInfo = state.graph.threeD.meterOrGroupInfo;
		// // In the current implementation, groups and meters cannot be both populated
		const meterOrGroupID = meterOrGroupInfo.meterOrGroupID;
		const meterOrGroup = meterOrGroupInfo.meterOrGroup === 'meters' ? 'byMeterID' : 'byGroupID';
		const timeInterval = roundTimeIntervalForFetch(state.graph.timeInterval).toString();// 3D dispatches rounds time interval to full days.
		const unitID = state.graph.selectedUnit;
		const precision = state.graph.threeD.xAxisPrecision; // Level of detail along the xAxis / Readings per day,
		let threeDData = null;
		//
		if (meterOrGroupID) {
			threeDData = state.readings.threeD[meterOrGroup][meterOrGroupID]?.[timeInterval]?.[unitID]?.[precision]?.readings;
		}

		let layout = {};
		let dataToRender = null;
		// // TODO internationalize / translate layout text
		if (!meterOrGroupID) { // No selected Meters
			layout = setLayout(translate('select.meter.group'));
		} else if (!isValidThreeDInterval(roundTimeIntervalForFetch(state.graph.timeInterval))) { // Not a valid time interval.
			layout = setLayout('Date Range Must be a year or less.');
		} else if (!threeDData || threeDData.zData.length === 0) { // There is no data.
			layout = setLayout('No Data In Date Range.');
		} else {
			[dataToRender, layout] = formatThreeDData(threeDData, state);
		}
		return [dataToRender, layout]
	});
	return (
		<div style={{ width: '100%', height: '75vh' }}>
			<ThreeDPillComponent />
			{isFetching ?
				<SpinnerComponent loading width={50} height={50} />
				:
				<Plot
					data={dataToRender}
					layout={layout}
					config={config}
					style={{ width: '100%', height: 'auto' }}
					useResizeHandler={true}
				// Camera Testing Config Purposes only.
				// onUpdate={(figure: any) => console.log(figure.layout.scene.camera)}
				/>
			}
		</div>
	);
}

/**
 * Formats Readings for plotly 3d surface
 * @param data 3D data to be formatted
 * @param state current application meter state
 * @returns the a time interval into a dateRange compatible for a date-picker.
 */
function formatThreeDData(data: ThreeDReading, state: State): [ThreeDPlotlyData[], object] {
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
	// TODO find a better way to set the zAxis
	const formattedData = [{
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
	const layout = setThreeDLayout(unitLabel);
	return [formattedData, layout]
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

/**
 * Utility to get plotlyLayout
 * @param zLabelText 3D data to be formatted
 * @returns plotly layout object.
 */
function setThreeDLayout(zLabelText: string = 'Resource Usage') {
	return {
		...threeDLayout,
		scene: {
			...threeDLayout.scene,
			zaxis: {
				...threeDLayout.scene.zaxis,
				title: zLabelText
			}
		}
	}
}

// TODO The layout can be tweaked a bit. E.G. yAxis labels are overlapping with yTicks.
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
	},
	margin: {
		l: 50,
		r: 50,
		t: 50,
		b: 50
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

type ThreeDPlotlyData = {
	type: 'surface' | string;
	showlegend: boolean;
	showscale: boolean;
	x: string[];
	y: string[];
	z: (number | null | undefined)[][];
	hoverinfo: string;
	hovertext: string[][];
	[key: string]: any;
}