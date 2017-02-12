import { connect } from 'react-redux';
import LineChartComponent from '../components/LineChartComponent';

export function mapStateToProps(state) {
	function getMeterNameById(meterID) {
		let name = '';
		state.meters.data.forEach(meter => {
			if (meterID === meter.id) name = meter.name;
		});
		return name;
	}
	let series = {};
	if (state.meters.selected) {
		series = state.meters.selected.map(meterID => ({
			name: getMeterNameById(meterID),
			data: state.graph.data[meterID].readings
		}));
	} else {
		series = [{
			name: state.meters.data ? getMeterNameById(state.graph.defaultMeterToDisplay) : '',
			data: state.graph.data[state.graph.defaultMeterToDisplay].readings
		}];
	}
	return { series };
}

export default connect(mapStateToProps)(LineChartComponent);
