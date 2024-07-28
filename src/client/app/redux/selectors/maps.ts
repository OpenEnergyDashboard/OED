/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { RootState } from "store";
import { createSelector } from "@reduxjs/toolkit";

export const selectMapState = (state: RootState) => state.maps;
export const selectMaps = createSelector([selectMapState], maps => {
	return Object.keys(maps.byMapID)
	.map(key => parseInt(key))
	.filter(key => !isNaN(key));
});