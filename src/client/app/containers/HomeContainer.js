/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import HomeComponent from '../components/HomeComponent';
import { updateWindowDimensions } from '../actions/uiOptions';

function mapDispatchToProps(dispatch) {
	return {
		updateWindowDimensions: dimensions => dispatch(updateWindowDimensions(dimensions))
	};
}

export default connect(null, mapDispatchToProps)(HomeComponent);
