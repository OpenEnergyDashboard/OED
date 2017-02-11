import axios from 'axios';

export const REQUEST_GRAPH_DATA = 'REQUEST_GRAPH_DATA';
export const RECEIVE_GRAPH_DATA = 'RECEIVE_GRAPH_DATA';
export const REQUEST_METER_DATA = 'REQUEST_METER_DATA';
export const RECEIVE_METER_DATA = 'RECEIVE_METER_DATA';
export const DISPLAY_SELECTED_METERS = 'DISPLAY_SELECTED_METERS';
export const CHANGE_DEFAULT_METER_TO_DISPLAY = 'CHANGE_DEFAULT_METER_TO_DISPLAY';

export function requestGraphData(meterID) {
	return {
		type: REQUEST_GRAPH_DATA,
		meterID
	};
}

export function receiveGraphData(meterID, data) {
	return {
		type: RECEIVE_GRAPH_DATA,
		meterID,
		data
	};
}

export function requestMeterData() {
	return {
		type: REQUEST_METER_DATA
	};
}

export function receiveMeterData(data) {
	return {
		type: RECEIVE_METER_DATA,
		data
	};
}

export function displaySelectedMeters(selectedMeters) {
	return {
		type: DISPLAY_SELECTED_METERS,
		selectedMeters
	};
}

export function changeDefaultMeterToDisplay(meterID) {
	return {
		type: CHANGE_DEFAULT_METER_TO_DISPLAY,
		meterID
	};
}

function fetchGraphData(meterID) {
	return dispatch => {
		dispatch(requestGraphData(meterID));
		return axios.get(`/api/meters/readings/${meterID}`)
			.then(response => dispatch(receiveGraphData(meterID, response.data)));
	};
}

function fetchMeterData() {
	return dispatch => {
		dispatch(requestMeterData());
		return axios.get('/api/meters')
			.then(response => dispatch(receiveMeterData(response.data)));
	};
}

function shouldFetchGraphData(state) {
	// Should fetch if we are not fetching and we do not have graph data
	return !state.graph.isFetching && !state.graph.data;
}

function shouldFetchMeterData(state) {
	// Should fetch if we are not fetching and we do not have meter data
	return !state.meters.isFetching && !state.meters.data;
}

export function fetchGraphDataIfNeeded() {
	return (dispatch, getState) => {
		if (shouldFetchGraphData(getState())) {
			return dispatch(fetchGraphData(getState().graph.meterID));
		}
		return Promise.resolve();
	};
}

export function fetchMeterDataIfNeeded() {
	return (dispatch, getState) => {
		if (shouldFetchMeterData(getState())) {
			return dispatch(fetchMeterData());
		}
		return Promise.resolve();
	};
}
