/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import * as moment from 'moment';
import { connect } from 'react-redux';
import UIOptionsComponent from '../components/UIOptionsComponent';
import { changeSelectedMeters, changeBarDuration, changeBarStacking } from '../actions/graph';
import { fetchMetersDetailsIfNeeded } from '../actions/meters';
import { State, Dispatch } from '../types/redux';
import { UIOptionsProps } from '../components/UIOptionsComponent';

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
		// TODO TYPESCRIPT: This is an irresolvable conflict. Is barDuration a moment or a number??
		changeDuration: (barDuration: moment.Duration) => dispatch(changeBarDuration(barDuration)),
		changeBarStacking: () => dispatch(changeBarStacking())
	};
}

/**
 * Connects changes to the Redux store to UIOptionsComponent via mapStateToProps
 */
export default connect(mapStateToProps, mapDispatchToProps)(UIOptionsComponent);
