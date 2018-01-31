/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as moment from 'moment';
import { connect } from 'react-redux';
import UIOptionsComponent, { UIOptionsProps } from '../components/UIOptionsComponent';
import { changeBarDuration, changeBarStacking, changeCompareTimeInterval } from '../actions/graph';
import { Dispatch } from '../types/redux/actions';
import { State } from '../types/redux/state';
import { TimeInterval } from '../../../common/TimeInterval';


function mapStateToProps(state: State) {
	return {
		chartToRender: state.graph.chartToRender,
		barStacking: state.graph.barStacking,
		barDuration: state.graph.barDuration,
		compareTimeInterval: state.graph.compareTimeInterval.toString()
	};
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		changeDuration: (barDuration: moment.Duration) => dispatch(changeBarDuration(barDuration)),
		changeBarStacking: () => dispatch(changeBarStacking()),
		changeCompareInterval: (interval: TimeInterval, duration: moment.Duration) => dispatch(changeCompareTimeInterval(interval, duration))
	};
}


export default connect(mapStateToProps, mapDispatchToProps)(UIOptionsComponent);
