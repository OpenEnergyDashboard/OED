import _ from 'lodash';
import { connect } from 'react-redux';
import UIOptionsComponent from '../components/UIOptionsComponent';
import { changeSelectedMeters } from '../actions/graph';
import { fetchMetersDataIfNeeded } from '../actions/meters';

/**
 * @param {State} state
 * @return {{meterInfo: *, selectedMeters: Array}}
 */
function mapStateToProps(state) {
	const sortedMeters = _.sortBy(_.values(state.meters.byMeterID).map(meter => ({ id: meter.id, name: meter.name.trim() })), 'name');
	return {
		meters: sortedMeters,
		selectedMeters: state.graph.selectedMeters
	};
}

function mapDispatchToProps(dispatch) {
	return {
		selectMeters: newSelectedMeterIDs => dispatch(changeSelectedMeters(newSelectedMeterIDs)),
		fetchMetersDataIfNeeded: () => dispatch(fetchMetersDataIfNeeded())
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(UIOptionsComponent);
