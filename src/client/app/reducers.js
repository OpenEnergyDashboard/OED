import { REQUEST_GRAPH_DATA, RECEIVE_GRAPH_DATA, REQUEST_METER_DATA, RECEIVE_METER_DATA } from './actions';

function graph(state = {}, action) {
	switch (action.type) {
		case REQUEST_GRAPH_DATA:
			return Object.assign({}, state, {
				isFetching: true
			});
		case RECEIVE_GRAPH_DATA:
			return Object.assign({}, state, {
				isFetching: false,
				data: action.data
			});
		default:
			return state;
	}
}

function meters(state = {}, action) {
	switch (action.type) {
		case REQUEST_METER_DATA:
			return Object.assign({}, state, {
				isFetching: true
			});
		case RECEIVE_METER_DATA:
			return Object.assign({}, state, {
				isFetching: false,
				data: action.data
			});
		default:
			return state;
	}
}

const defaultState = {
	graph: {
		meterID: 6,
		isFetching: false,
	},
	meters: {
		isFetching: false,
	}
};

function rootReducer(state = defaultState, action) {
	switch (action.type) {
		case REQUEST_GRAPH_DATA:
		case RECEIVE_GRAPH_DATA:
			return Object.assign({}, state, {
				graph: graph(state.graph, action)
			});
		case REQUEST_METER_DATA:
		case RECEIVE_METER_DATA:
			return Object.assign({}, state, {
				meters: meters(state.meters, action)
			});
		default:
			return state;
	}
}

export default rootReducer;
