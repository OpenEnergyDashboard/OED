/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import DashboardComponent from '../components/DashboardComponent';
import { State } from '../types/redux/state';

/* Passes the current redux state of the dashboard, and turns it into props for the React
*  component, which is what will be visible on the page. Makes it possible to access
*  your reducer state objects from within your React components.
*
*  Returns the all of the elements in the dashboard. */
function mapStateToProps(state: State) {
	return {
		chartToRender: state.graph.chartToRender,
		lineLoading: state.readings.line.isFetching,
		barLoading: state.readings.bar.isFetching,
		compareLoading: state.readings.bar.isFetching,
		optionsVisibility: state.graph.optionsVisibility
	};
}

// function that connects the React container to the Redux store of states
export default connect(mapStateToProps)(DashboardComponent);
