import { Dispatch, Thunk, ActionType } from '../types/redux/actions';
import * as t from '../types/redux/map';
import {MapModeTypes} from '../types/redux/map';

export function updateMapSource(imageSource: string): Thunk {
	return  (dispatch) => {
		// dispatch(stallMapLoad());
		dispatch(uploadMapSource(imageSource));
		// dispatch(releaseMapSourceLock());
		return Promise.resolve();
	};
}

function uploadMapSource(imageSource: string): t.UpdateMapSourceAction {
	return { type: ActionType.UpdateMapSource, imageSource };
}

export function updateMapMode(nextMode: MapModeTypes): t.ChangeMapModeAction {
	return { type: ActionType.UpdateMapMode, nextMode };
}

// function stallMapLoad(): t.StallMapLoadingAction {
// 	return { type: ActionType.StallMapLoad, loadState: false };
// }

// function releaseMapSourceLock() {
// 	return { type: ActionType.ReleaseMapLoad, loadState: true };
// }
