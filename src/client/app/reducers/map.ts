import {MapAction, MapModeTypes, MapState} from '../types/redux/map';
import {ActionType} from '../types/redux/actions';

const defaultState: MapState = {
	mode: MapModeTypes.initiate,
	isLoading: false,
	source: '',
};

export default function map(state = defaultState, action: MapAction) {
	switch (action.type) {
		case ActionType.UpdateMapMode:
			return {
				...state,
				mode: action.nextMode,
			};
		case ActionType.UpdateMapSource:
			return {
				...state,
				source: action.imageSource,
			};
	}
}
