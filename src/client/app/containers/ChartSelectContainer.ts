/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import ChartSelectComponent from '../components/ChartSelectComponent';
import { changeChartToRender } from '../actions/graph';


/**
 * @param {State} state
 */
function mapStateToProps(state) {
	return {
		selectedChart: state.graph.chartToRender
	};
}

function mapDispatchToProps(dispatch) {
	return {
		changeChartType: chartType => dispatch(changeChartToRender(chartType)),
	};
}

/**
 * Connects changes to the Redux store to ChartSelectComponent via mapStateToProps
 */
export default connect(mapStateToProps, mapDispatchToProps)(ChartSelectComponent);
