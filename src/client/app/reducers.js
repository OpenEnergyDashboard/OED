import * as actionModule from './actions';

function graph(state = {}, action) {
	switch (action.type) {
		case actionModule.REQUEST_GRAPH_DATA:
			return Object.assign({}, state, {
				isFetching: true
			});
		case actionModule.RECEIVE_GRAPH_DATA:
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
		case actionModule.REQUEST_METER_DATA:
			return Object.assign({}, state, {
				isFetching: true
			});
		case actionModule.RECEIVE_METER_DATA:
			return Object.assign({}, state, {
				isFetching: false,
				data: action.data
			});
		case actionModule.DISPLAY_SELECTED_METERS:
			return Object.assign({}, state, {
				selected: action.selectedMeters
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
		case actionModule.CHANGE_DEFAULT_METER_TO_DISPLAY:
		case actionModule.REQUEST_GRAPH_DATA:
		case actionModule.RECEIVE_GRAPH_DATA:
			return Object.assign({}, state, {
				graph: graph(state.graph, action)
			});
		case actionModule.REQUEST_METER_DATA:
		case actionModule.RECEIVE_METER_DATA:
		case actionModule.DISPLAY_SELECTED_METERS:
			return Object.assign({}, state, {
				meters: meters(state.meters, action)
			});
		default:
			return state;
	}
}

export default rootReducer;
