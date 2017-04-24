
export const UPDATE_IMPORT_METER_ID = 'UPDATE_IMPORT_METER_ID';

export function updateSelectedMeter(meterID) {
	return { type: UPDATE_IMPORT_METER_ID, meterID };
}

export function changeSelectedMeter(meterID) {
	return dispatch => {
		dispatch(updateSelectedMeter(meterID));
		return Promise().resolve();
	};
}

