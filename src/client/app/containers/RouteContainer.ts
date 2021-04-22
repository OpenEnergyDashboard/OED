/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import RouteComponent from '../components/RouteComponent';
import { Dispatch } from '../types/redux/actions';
import { State } from '../types/redux/state';
import { changeOptionsFromLink, LinkOptions } from '../actions/graph';

function mapStateToProps(state: State) {
	return {
		barStacking: state.graph.barStacking,
		defaultLanguage: state.admin.defaultLanguage
	};
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		changeOptionsFromLink: (options: LinkOptions) => dispatch(changeOptionsFromLink(options))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(RouteComponent);
