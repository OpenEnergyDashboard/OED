/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { connect } from 'react-redux';
import * as filtersActions from '../actions/meters_filter';
import MetersFilterComponent from '../components/MetersFilterComponent';
/**
 * Takes state, maps metersFilter.metersFilterTerm to filterTerm
 * @param {State} state The Redux state
 */
function mapStateToProps(state) {
	return {
		filterTerm: state.metersFilter.metersFilterTerm,
	};
}

function mapDispatchToProps(dispatch) {
	return {
		clearFilter: () => dispatch(filtersActions.metersFilterCleared()),
		setFilter: value => dispatch(filtersActions.metersFilterModified(value)),
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(MetersFilterComponent);
