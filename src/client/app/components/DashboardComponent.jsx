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
