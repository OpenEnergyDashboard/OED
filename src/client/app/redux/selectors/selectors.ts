import {
	createSelectorCreator,
	weakMapMemoize,
	unstable_autotrackMemoize as autoTrackMemoize
} from 'reselect'

export const createAutoTrackSelector = createSelectorCreator(autoTrackMemoize);
export const createWeakmapSelector = createSelectorCreator(weakMapMemoize);