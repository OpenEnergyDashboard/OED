import { connect } from 'react-redux';
import LineChartComponent from '../components/LineChartComponent';

function mapStateToProps(state) {
	return {
		meterID: state.graph.meterID,
		isFetching: state.graph.isFetching,
		data: state.graph.data
	};
}

export default connect(mapStateToProps)(LineChartComponent);
