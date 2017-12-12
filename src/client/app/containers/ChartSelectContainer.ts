/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import ChartSelectComponent from '../components/ChartSelectComponent';
import { changeChartToRender } from '../actions/graph';
import { chartTypes } from 'reducers/graph';
import { State, Dispatch } from '../types/redux';


function mapStateToProps(state: State) {
	return {
		selectedChart: state.graph.chartToRender
	};
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		changeChartType: (chartType: chartTypes) => dispatch(changeChartToRender(chartType))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(ChartSelectComponent);
