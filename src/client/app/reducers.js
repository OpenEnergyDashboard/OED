import { REQUEST_GRAPH_DATA, RECEIVE_GRAPH_DATA } from './actions';

function graph(state = { meterID: 1, isFetching: false, data: [] }, action) {
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

function rootReducer(state = { graph: { meterID: 6 } }, action) {
	switch (action.type) {
		case REQUEST_GRAPH_DATA:
		case RECEIVE_GRAPH_DATA:
			return Object.assign({}, state, {
				graph: graph(state.graph, action)
			});
		default:
			return state;
	}
}

export default rootReducer;
