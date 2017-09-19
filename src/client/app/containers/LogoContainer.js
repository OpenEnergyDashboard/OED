/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import LogoComponent from '../components/LogoComponent';
import { logoStateChanged } from '../actions/logo';

/**
 * Maps the Redux state to props for the LogoComponent.
 * Only cares about state.logo.showColored
 * @param {State} state The current Redux state
 */
function mapStateToProps(state) {
	const showColoredLogo = state.logo.showColored;
	return {
		showColoredLogo,
	};
}

/**
 * Maps the logoStateChanged() dispatcher to a prop for LogoComponent to call on mouse events
 * @param {Function} dispatch the React-Redux dispatch() function
 */
function mapDispatchToProps(dispatch) {
	return {
		logoStateChanged: showColored => dispatch(logoStateChanged(showColored))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(LogoComponent);
