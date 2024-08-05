/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// TODO: Migrate to RTK

import { RootState } from 'store';
import { MapState } from 'types/redux/map';
import { createAppSelector } from './selectors';

export const selectMapState = (state: RootState) => state.maps;
export const selectMaps = createAppSelector([selectMapState], maps =>
	Object.keys(maps.byMapID)
		.map(key => parseInt(key))
		.filter(key => !isNaN(key))
);

export const selectMapById = (id: number) =>
	createAppSelector([selectMapState], (maps: MapState) => maps.byMapID[id]);
