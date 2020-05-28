import { Dispatch, Thunk, ActionType } from '../types/redux/actions';
import * as t from '../types/redux/map';
import {MapModeTypes} from '../types/redux/map';

export function updateMapSource(imageSource: string): t.UpdateMapSourceAction {
	return { type: ActionType.UpdateMapSource, imageSource };
}

export function updateMapMode(nextMode: MapModeTypes): t.ChangeMapModeAction {
	return { type: ActionType.UpdateMapMode, nextMode };
}

export function stallUpload(): Thunk {
	return  (dispatch) => {
		dispatch(stallMapLoad());
		return Promise.resolve();
	};
}

function stallMapLoad(): t.StallMapLoadingAction {
	return { type: ActionType.StallMapLoad, loadState: false };
}
