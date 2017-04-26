
import * as meterDropDownActions from '../../actions/admin/meterDropDown';

const defaultState = {
	selectedMeters: null
};

export default function meterDropDown(state = defaultState, action) {
	switch (action.type) {
		case meterDropDownActions.UPDATE_IMPORT_METER_ID:
			return {
				...state,
				selectedMeters: action.MeterID
			};
		default: return state;
	}
}
