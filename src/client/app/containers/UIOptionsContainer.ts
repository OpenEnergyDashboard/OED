/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as moment from 'moment';
import { connect } from 'react-redux';
import UIOptionsComponent from '../components/UIOptionsComponent';
import {
	changeBarDuration,
	changeBarStacking,
	changeCompareGraph,
	changeCompareSortingOrder,
	toggleOptionsVisibility
} from '../actions/graph';
import { Dispatch } from '../types/redux/actions';
import { State } from '../types/redux/state';
import {ComparePeriod, SortingOrder} from '../utils/calculateCompare';


function mapStateToProps(state: State) {
	return {
		chartToRender: state.graph.chartToRender,
		areaNormalization: state.graph.areaNormalization,
		barStacking: state.graph.barStacking,
		barDuration: state.graph.barDuration,
		comparePeriod: state.graph.comparePeriod,
		compareSortingOrder: state.graph.compareSortingOrder,
		optionsVisibility: state.graph.optionsVisibility
	};
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		changeDuration: (barDuration: moment.Duration) => dispatch(changeBarDuration(barDuration)),
		changeBarStacking: () => dispatch(changeBarStacking()),
		changeCompareGraph: (comparePeriod: ComparePeriod) => dispatch(changeCompareGraph(comparePeriod)),
		changeCompareSortingOrder: (sortingOrder: SortingOrder) => dispatch(changeCompareSortingOrder(sortingOrder)),
		toggleOptionsVisibility: () => dispatch(toggleOptionsVisibility())
	};
}


export default connect(mapStateToProps, mapDispatchToProps)(UIOptionsComponent);
