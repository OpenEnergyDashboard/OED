/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import UIOptionsComponent from '../components/UIOptionsComponent';

/**
 * Maps the Redux store object to props to be passed down to child components
 * @param state The new Redux store object
 * @returns object The new object containing information about meter names and ids
 */
function mapStateToProps(state) {
	if (state.meters.data) {
		state.meters.data.sort((a, b) => {
			a = a.name.trim().toLowerCase();
			b = b.name.trim().toLowerCase();
			if (a < b) return -1;
			else if (a > b) return 1;
			return 0;
		});
	}
	return {
		meterInfo: state.meters.data ? {
			names: state.meters.data.map(m => m.name.trim()),
			ids: state.meters.data.map(m => m.id)
		} : { names: [], ids: [] },
		selectedMeters: state.meters.selected ? state.meters.selected : []
	};
}

/**
 * Connects changes to the Redux store to UIOptionsComponent via mapStateToProps
 */
export default connect(mapStateToProps)(UIOptionsComponent);
