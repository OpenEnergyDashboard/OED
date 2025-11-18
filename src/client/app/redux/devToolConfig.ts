/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import { DevToolsEnhancerOptions } from '@reduxjs/toolkit';
import { RootState } from 'store';
import { mapsApi, selectAllMaps, selectMapIds } from './api/mapsApi';
import { mapsAdapter, mapsInitialState } from './entityAdapters';

const devToolSanitizedDataMessage = 'Omitted From Devtools - Refer to devToolConfig.ts for Details';
export const devToolsConfig: DevToolsEnhancerOptions = {
	actionSanitizer: action => {
		switch (true) {
			// Sanitize MapSource so it does not bloat the devtools with a longBlobs.
			case mapsApi.endpoints.getMapDetails.matchFulfilled(action): {
				// omitMapSource from metaData
				const sanitizedMapMetadata = Object.values(action.payload.entities)
					.map(data => ({ ...data, mapSource: devToolSanitizedDataMessage }));

				// sanitized devtool Action
				return { ...action, payload: { ...mapsAdapter.setAll(mapsInitialState, sanitizedMapMetadata) } };
			}
			default:
				return action;
		}
	},
	stateSanitizer: state => {
		const sanitizedState = sanitizeState(state as RootState);
		return sanitizedState as typeof state;
	}
};
export const sanitizeState = (state: RootState) => {
	let s: RootState = state;
	// if there are map entries in state, sanitize their map source.
	if (selectMapIds(s).length) {
		const sanitizedEntities = selectAllMaps(s).map(mapMetaData => ({ ...mapMetaData, mapSource: devToolSanitizedDataMessage }));
		// recreate Sanitized Cache
		const sanitizedCache = mapsAdapter.setAll(mapsAdapter.getInitialState(), sanitizedEntities);

		s = {
			...s,
			api: {
				...s.api,
				queries: {
					...s.api.queries,
					'getMapDetails(undefined)': {
						...s.api.queries['getMapDetails(undefined)'],
						data: sanitizedCache
					}
				}
			}
		} as RootState;
	}
	// Sanitize localEditsDevtools mapSource
	if (s.localEdits.mapEdits.ids.length) {
		const sanitizedEntities = mapsAdapter
			.getSelectors()
			.selectAll(s.localEdits.mapEdits)
			.map(mapMetaData => ({ ...mapMetaData, mapSource: devToolSanitizedDataMessage }));
		// recreate Sanitized Cache
		const sanitizedCache = mapsAdapter.setAll(mapsAdapter.getInitialState(), sanitizedEntities);
		s = {
			...s,
			localEdits: {
				...s.localEdits,
				mapEdits: sanitizedCache
			}
		} as RootState;
	}
	// Sanitize some more ...


	// return sanitized state, for devtools
	return s;
};