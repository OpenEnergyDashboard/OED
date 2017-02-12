import { connect } from 'react-redux';
import UIOptionsComponent from '../components/UIOptionsComponent';

function mapStateToProps(state) {
	if (state.meters.data) {
		state.meters.data.sort((a, b) => {
			a = a.name.trim().toLowerCase();
			b = b.name.trim().toLowerCase();
			if (a < b) return -1;
			else if (a > b) return 1;
			return 0;
		});
	}
	return {
		meterInfo: state.meters.data ? {
			names: state.meters.data.map(m => m.name.trim()),
			ids: state.meters.data.map(m => m.id)
		} : { names: [], ids: [] },
		selectedMeters: state.meters.selected ? state.meters.selected : []
	};
}

export default connect(mapStateToProps)(UIOptionsComponent);
