/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import HeaderComponent from '../components/HeaderComponent';
import { State } from '../types/redux/state';

function mapStateToProps(state: State) {

	return {
		title: state.admin.displayTitle,
		optionsVisibility: state.graph.optionsVisibility
	};
}

export default connect(mapStateToProps)(HeaderComponent);
