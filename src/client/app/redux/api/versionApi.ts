/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createSelector } from '@reduxjs/toolkit';
import { baseApi } from './baseApi';

export const versionApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		getVersion: builder.query<string, void>({
			query: () => '/api/version'
		})
	})
})

export const selectVersion = versionApi.endpoints.getVersion.select();
export const selectOEDVersion = createSelector(
	selectVersion,
	({ data: version }) => {
		return version ?? ''
	}
);
