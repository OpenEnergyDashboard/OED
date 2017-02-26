import axios from 'axios';

export const REQUEST_METERS_DATA = 'REQUEST_METERS_DATA';
export const RECEIVE_METERS_DATA = 'RECEIVE_METERS_DATA';

export function requestMetersData() {
	return { type: REQUEST_METERS_DATA };
}

export function receiveMetersData(data) {
	return { type: RECEIVE_METERS_DATA, data };
}

function fetchMetersData() {
	return dispatch => {
		dispatch(requestMetersData());
		return axios.get('/api/meters')
			.then(response => {
				console.log(response.data);
				dispatch(receiveMetersData(response.data));
			});
	};
}

/**
 * @param {State} state
 */
function shouldFetchMetersData(state) {
	return state.meters.isFetching || state.meters.meters === undefined;
}

export function fetchMetersDataIfNeeded() {
	return (dispatch, getState) => {
		if (shouldFetchMetersData(getState())) {
			return dispatch(fetchMetersData());
		}
		return Promise.resolve();
	};
}
