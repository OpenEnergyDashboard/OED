/**
 * Created by Eduardo on 4/14/2017.
 */
import _ from 'lodash';
import { connect } from 'react-redux';
import MeterDropdownComponent from '../components/MeterDropDownComponent';

/**
 * @param {State} state
 */
function mapStateToProps(state) {
	return {
		meters: _.sortBy(_.values(state.meters.byMeterID).map(meter => ({ id: meter.id, name: meter.name.trim() })), 'name')
	};
}

export default connect(mapStateToProps)(MeterDropdownComponent);
