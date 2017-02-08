import axios from 'axios';

export const REQUEST_GRAPH_DATA = 'REQUEST_GRAPH_DATA';
export function requestGraphData(meterID) {
	return {
		type: REQUEST_GRAPH_DATA,
		meterID
	};
}

export const RECEIVE_GRAPH_DATA = 'RECEIVE_GRAPH_DATA';
export function receiveGraphData(meterID, data) {
	return {
		type: RECEIVE_GRAPH_DATA,
		meterID,
		data
	};
}

function fetchGraphData(meterID) {
	return dispatch => {
		dispatch(requestGraphData(meterID));
		return axios.get(`/api/meters/readings/${meterID}`)
			.then(response => dispatch(receiveGraphData(meterID, response.data)));
	};
}

function shouldFetchGraphData(state) {
	// Should fetch if we are not fetching and we have no data
	return !state.graph.isFetching && !state.graph.data;
}

export function fetchGraphDataIfNeeded() {
	return (dispatch, getState) => {
		if (shouldFetchGraphData(getState())) {
			return dispatch(fetchGraphData(getState().graph.meterID));
		}
		return Promise.resolve();
	};
}
