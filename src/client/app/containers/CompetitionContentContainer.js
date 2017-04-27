/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import _ from 'lodash';
import { connect } from 'react-redux';
import CompetitionContent from '../components/CompetitionContent';
// import { changeSelectedMeters } from '../actions/graph';
import { fetchMetersDataIfNeeded } from '../actions/meters';
import { changeSelectedBuilding } from '../actions/graph';
// import { stringifyTimeInterval } from '../util';

/**
 * @param {State} state
 * @return {{meterInfo: *, selectedMeters: Array}}
 */
function mapStateToProps(state) {

	const sortedMeters = _.sortBy(_.values(state.meters.byMeterID).map(meter => ({ id: meter.id, name: meter.name.trim() })), 'name');
	const sortedMeterID = sortedMeters.map(meter =>(meter.id));
	const timeInterval = "all";
	const data = { datasets: [] };
	// getColor() cycles through the colors, wrapping around the end to the beginning
	const colors = ['LightBlue', 'GoldenRod', 'Black', 'OrangeRed', 'LightSeaGreen', 'LightSlateGray', 'Purple'];
	let colorPointer = 0;
	function getColor() {
		const color = colors[colorPointer];
		colorPointer = (colorPointer + 1) % colors.length;
		return color;
	}
	for (const meterID of state.graph.selectedMeters) {
		const readingsData = state.readings.byMeterID[meterID][timeInterval];
		if (readingsData !== undefined && !readingsData.isFetching) {
			data.datasets.push({
				label: state.meters.byMeterID[meterID].name,
				data: state.readings.byMeterID[meterID][timeInterval].readings.map(arr => ({ x: arr[0], y: arr[1].toFixed(2) })),
				fill: true,
				borderColor: getColor()
			});
		}
	}
	// const startTimestamp = 1485475200000;
	// const endTimestamp = 1485579600000;
	// const timeInterval = stringifyTimeInterval(startTimestamp, endTimestamp);
	//
	// const series = {};
	// const notLoadedMeters = [];
	// let isLoading = false;
	// for (const meterID of sortedMeterID) {
	// 	if (state.readings.byMeterID[meterID][timeInterval] === undefined || state.readings.byMeterID[meterID][timeInterval].isFetching) {
	// 		isLoading = true;
	// 		if (state.readings.byMeterID[meterID][timeInterval] === undefined) {
	// 			notLoadedMeters.push(meterID);
	// 		}
	// 	} else {
	// 		series[meterID] = {name: state.meters.byMeterID[meterID].name,data: state.readings.byMeterID[meterID][timeInterval].readings};
	// 	}
	// }
	return {
		meters: sortedMeters,
		data:data,
		redraw:true,
		timeInterval:timeInterval

	};
}

function mapDispatchToProps(dispatch) {
	return {
		// selectMeters: newSelectedMeterIDs => dispatch(changeSelectedMeters(newSelectedMeterIDs)),
		fetchMetersDataIfNeeded: () => dispatch(fetchMetersDataIfNeeded()),
		selectMeters: (newSelectedMeterIDs,timeInterval) => dispatch(changeSelectedBuilding(newSelectedMeterIDs,timeInterval))
		// fetchNewReadings: (meterID, startTimestamp, endTimestamp) => dispatch(fetchReadingsIfNeeded(meterID, startTimestamp, endTimestamp))
	};
}


export default connect(mapStateToProps, mapDispatchToProps)(CompetitionContent);
