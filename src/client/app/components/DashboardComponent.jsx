/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { fetchGraphDataIfNeeded } from '../actions';
import UIOptionsContainer from '../containers/UIOptionsContainer';
import LineChartContainer from '../containers/LineChartContainer';
import BarChartContainer from '../containers/BarChartContainer';

/**
 * React component that controls the dashboard and fetches graph data upon mounting
 * @param props The props passed down by DashboardContainer, used to get a handle on the dispatch function
 */
export default class DashboardComponent extends React.Component {
	/**
	 * Called when this component mounts
	 * Dispatches a Redux action to fetch graph data
	 */
	componentWillMount() {
		this.props.dispatch(fetchGraphDataIfNeeded());
	}

	/**
	 * @return JSX of Redux containers to create the dashboard
	 */
	render() {
		return (
			<div className="container-fluid">
				<UIOptionsContainer />
				<LineChartContainer />
				<BarChartContainer />
			</div>
		);
	}
}
