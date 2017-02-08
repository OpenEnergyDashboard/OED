import { connect } from 'react-redux';
import BarChartComponent from '../components/BarChartComponent';

function mapStateToProps(state) {
	return {
		meterID: state.graph.meterID,
		isFetching: state.graph.isFetching,
		data: state.graph.data
	};
}

export default connect(mapStateToProps)(BarChartComponent);
