/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import RouteComponent from '../components/RouteComponent';
import { changeOptionsFromLink } from '../actions/graph';

function mapStateToProps(state) {
	return {
		barStacking: state.graph.barStacking
	};
}


function mapDispatchToProps(dispatch) {
	return {
		changeOptionsFromLink: options => dispatch(changeOptionsFromLink(options))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(RouteComponent);
