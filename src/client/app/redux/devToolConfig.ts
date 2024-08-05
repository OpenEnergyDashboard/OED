import { DevToolsEnhancerOptions } from '@reduxjs/toolkit';
import { mapsAdapter, mapsApi, mapsInitialState } from './api/mapsApi';

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