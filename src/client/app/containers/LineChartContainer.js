import { connect } from 'react-redux';
import LineChartComponent from '../components/LineChartComponent';

function mapStateToProps(state) {
	return {
		meterID: state.graph.meterID,
		isFetching: state.graph.isFetching,
		data: state.graph.data ? state.graph.data : [],
		selected: state.meters.selected ? state.meters.selected : []
	};
}

export default connect(mapStateToProps)(LineChartComponent);
