/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {
	createSelectorCreator,
	weakMapMemoize,
	unstable_autotrackMemoize as autoTrackMemoize
} from 'reselect'

export const createAutoTrackSelector = createSelectorCreator(autoTrackMemoize);
export const createWeakmapSelector = createSelectorCreator(weakMapMemoize);