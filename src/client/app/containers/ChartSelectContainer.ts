/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import ChartSelectComponent from '../components/ChartSelectComponent';
import { changeChartToRender } from '../actions/graph';
import { ChartTypes } from '../types/redux/graph';
import { Dispatch } from '../types/redux/actions';
import { State } from '../types/redux/state';


/* Passes the current redux state of the barchart, and turns it into props for the React
*  component, which is what will be visible on the page. Makes it possible to access
*  your reducer state objects from within your React components.
*
*  Returns the selected chart */
function mapStateToProps(state: State) {
	return {
		selectedChart: state.graph.chartToRender
	};
}

// Function to dispatch the changed chart type choice
function mapDispatchToProps(dispatch: Dispatch) {
	return {
		changeChartType: (chartType: ChartTypes) => dispatch(changeChartToRender(chartType))
	};
}

// function that connects the React container to the Redux store of states
export default connect(mapStateToProps, mapDispatchToProps)(ChartSelectComponent);
