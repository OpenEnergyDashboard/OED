
export const UPDATE_SELECTED_METER = 'UPDATE_SELECTED_METER';

export function updateSelectedMeter(meterID) {
	return { type: UPDATE_SELECTED_METER, meterID };
}
