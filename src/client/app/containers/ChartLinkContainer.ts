/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import ChartLinkComponent from '../components/ChartLinkComponent';
import { State } from '../types/redux/state';
import { TimeInterval } from '../../../common/TimeInterval';
import moment = require('moment');
import DashboardComponent from 'components/DashboardComponent';

function mapStateToProps(state: State) {
	let linkText = `${window.location.href}graph?`;
	if (state.graph.selectedMeters.length > 0) {
		linkText += `meterIDs=${state.graph.selectedMeters.toString()}&`;
	}
	if (state.graph.selectedGroups.length > 0) {
		linkText += `groupIDs=${state.graph.selectedGroups.toString()}&`;
	}
	linkText += `chartType=${state.graph.chartToRender}`;
	switch (state.graph.chartToRender) {
		case 'bar':
			linkText += `&barDuration=${state.graph.barDuration.asDays()}`;
			linkText += `&barStacking=${state.graph.barStacking}`;
			break;
		case 'line':
			linkText += `&serverRange=${state.graph.timeInterval.toString()}`;
			//under construction;
			let sliderContainer: any = document.querySelector(".rangeslider-bg");
			let sliderBox: any = document.querySelector(".rangeslider-slidebox");
			//console.log();
			// if (sliderContainer && sliderBox){
			// 	console.log('passed');
			// 	// Attributes of the slider: full width and the min & max values of the box
			// 	let fullWidth: number = parseInt(sliderContainer.getAttribute("width"));
			// 	let sliderMinX: number = parseInt(sliderBox.getAttribute("x"));
			// 	let sliderMaxX: number = sliderMinX + parseInt(sliderBox.getAttribute("width"));
			// 	if (sliderMaxX - sliderMinX == fullWidth) return;
			//
			// 	// From the Plotly line graph, get current min and max times in seconds
			// 	let minTimeStamp: number = parseInt(state.graph.timeInterval.getStartTimestamp.toString());
			// 	let maxTimeStamp: number = parseInt(state.graph.timeInterval.getEndTimestamp.toString());
			//
			// 	// Seconds displayed on graph
			// 	let deltaSeconds: number = maxTimeStamp - minTimeStamp;
			// 	let secondsPerPixel: number = deltaSeconds / fullWidth;
			//
			// 	// Get the new min and max times, in seconds, from the slider box
			// 	let newMinXTimestamp = Math.floor(minTimeStamp + (secondsPerPixel * sliderMinX));
			// 	let newMaxXTimestamp = Math.floor(minTimeStamp + (secondsPerPixel * sliderMaxX));
			// 	let interval = new TimeInterval(moment(newMinXTimestamp), moment(newMaxXTimestamp));
			// 	linkText += `&selectedRange=${interval.toString()}`;
			// } else {
			// 	console.log('did not pass or unspecified');
			// 	linkText += `&selectedRange=null`;
			// }

			break;
		case 'compare':
			linkText += `&comparePeriod=${state.graph.comparePeriod}`;
			linkText += `&compareSortingOrder=${state.graph.compareSortingOrder}`;
			break;
		default:
			break;
	}

	return {
		linkText
	};
}

export default connect(mapStateToProps)(ChartLinkComponent);
