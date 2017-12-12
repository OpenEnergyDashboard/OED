/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as moment from 'moment';
import { connect } from 'react-redux';
import UIOptionsComponent from '../components/UIOptionsComponent';
import { changeBarDuration, changeBarStacking } from '../actions/graph';
import { Dispatch } from '../types/redux/actions';
import { State } from '../types/redux/state';

/**
 * @param {State} state
 * @return {{meterInfo: *, selectedMeters: Array}}
 */
function mapStateToProps(state: State) {
	return {
		chartToRender: state.graph.chartToRender,
		barStacking: state.graph.barStacking,
		barDuration: state.graph.barDuration
	};
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		changeDuration: (barDuration: moment.Duration) => dispatch(changeBarDuration(barDuration)),
		changeBarStacking: () => dispatch(changeBarStacking())
	};
}

/**
 * Connects changes to the Redux store to UIOptionsComponent via mapStateToProps
 */
export default connect(mapStateToProps, mapDispatchToProps)(UIOptionsComponent);
