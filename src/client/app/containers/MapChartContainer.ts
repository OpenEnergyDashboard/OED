import {connect} from 'react-redux';
import { State } from '../types/redux/state';
import MapChartComponent from '../components/MapChartComponent';

function mapStateToProps(state: State) {
	return {
		mode: state.map.mode,
		isLoading: state.map.isLoading
	};
}
export default connect(mapStateToProps)(MapChartComponent);
