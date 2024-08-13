/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { DevToolsEnhancerOptions } from '@reduxjs/toolkit';
import { mapsApi } from './api/mapsApi';
import { mapsAdapter, mapsInitialState } from './entityAdapters';

export const devToolsConfig: DevToolsEnhancerOptions = {
	actionSanitizer: action => {
		switch (true) {
			// Sanitize MapSource so it does not bloat the devtools with a longBlobs.
			case mapsApi.endpoints.getMapDetails.matchFulfilled(action): {
				// omitMapSource from metaData
				const sanitizedMapMetadata = Object.values(action.payload.entities)
					.map(data => ({ ...data, mapSource: 'Omitted From Devtools Serialization' }));

				// sanitized devtool Action
				return { ...action, payload: { ...mapsAdapter.setAll(mapsInitialState, sanitizedMapMetadata) } };
			}
			default:
				return action;
		}

	}
};