import { connect } from 'react-redux';
import UIOptionsComponent from '../components/UIOptionsComponent';

function mapStateToProps(state) {
	return {
		meterInfo: state.meters.data ? {
			names: state.meters.data.map(m => m.name.trim()),
			ids: state.meters.data.map(m => m.id)
		} : { names: [], ids: [] },
		selectedMeters: state.meters.selected ? state.meters.selected : []
	};
}

export default connect(mapStateToProps)(UIOptionsComponent);
