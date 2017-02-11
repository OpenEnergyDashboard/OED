import { connect } from 'react-redux';
import UIOptionsComponent from '../components/UIOptionsComponent';

function mapStateToProps(state) {
	return {
		meterNames: state.meters.data ? state.meters.data.map(m => m.name.trim()).sort() : [],
		selectedMeters: state.meters.selected ? state.meters.selected : []
	};
}

export default connect(mapStateToProps)(UIOptionsComponent);
