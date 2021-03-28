/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import { fetchVersionIfNeeded } from '../actions/version'
import FooterComponent from '../components/FooterComponent';
import { State } from '../types/redux/state';
import { Dispatch } from '../types/redux/actions';

/*
* A container that does data fetching for FooterComponent and connects it to the redux store.
*/
function mapStateToProps(state: State) {
	return {
		version: state.version.version
	};
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		fetchVersionIfNeeded: () => dispatch(fetchVersionIfNeeded())
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(FooterComponent);
