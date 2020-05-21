/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import DashboardComponent from '../components/DashboardComponent';
import { State } from '../types/redux/state';

import { changeGraphZoomIfNeeded } from '../actions/graph';
import { Dispatch } from '../types/redux/actions';
import { TimeInterval } from '../../../common/TimeInterval';


function mapStateToProps(state: State) {
	return {
		chartToRender: state.graph.chartToRender,
		lineLoading: state.readings.line.isFetching,
		barLoading: state.readings.bar.isFetching,
		compareLoading: state.readings.bar.isFetching,
		optionsVisibility: state.graph.optionsVisibility,
		selectedTimeInterval: state.graph.timeInterval
	};
}


function mapDispatchToProps(dispatch: Dispatch) {
	return {
		changeTimeInterval: (timeInterval: TimeInterval) => dispatch(changeGraphZoomIfNeeded(timeInterval))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(DashboardComponent);
