/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { EntityState, createEntityAdapter } from '@reduxjs/toolkit';
import { RootState } from 'store';
import { UnitData, UnitDataById } from '../../types/redux/units';
import { baseApi } from './baseApi';
import { conversionsApi } from './conversionsApi';
import { omit } from 'lodash';
export const unitsAdapter = createEntityAdapter<UnitData>({
	sortComparer: (unitA, unitB) => unitA.identifier?.localeCompare(unitB.identifier, undefined, { sensitivity: 'accent' })
});
export const unitsInitialState = unitsAdapter.getInitialState();
export type UnitDataState = EntityState<UnitData, number>;

export const unitsApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		getUnitsDetails: builder.query<UnitDataState, void>({
			query: () => 'api/units',
			transformResponse: (response: UnitData[]) => {
				return unitsAdapter.setAll(unitsInitialState, response);
			},
			providesTags: ['Units']
		}),
		addUnit: builder.mutation<void, UnitData>({
			query: unitDataArgs => ({
				url: 'api/units/addUnit',
				method: 'POST',
				body: omit(unitDataArgs, ['id'])
			}),
			onQueryStarted: (_arg, api) => {
				api.queryFulfilled
					.then(() => {
						api.dispatch(
							conversionsApi.endpoints.refresh.initiate({
								redoCik: true,
								refreshReadingViews: false
							}));
					});
			},
			invalidatesTags: ['Units']
		}),
		editUnit: builder.mutation<void, { editedUnit: UnitData, shouldRedoCik: boolean, shouldRefreshReadingViews: boolean }>({
			query: ({ editedUnit }) => ({
				url: 'api/units/edit',
				method: 'POST',
				body: { ...editedUnit }
			}),
			onQueryStarted: ({ shouldRedoCik, shouldRefreshReadingViews }, api) => {
				api.queryFulfilled
					.then(() => {
						api.dispatch(
							conversionsApi.endpoints.refresh.initiate({
								redoCik: shouldRedoCik,
								refreshReadingViews: shouldRefreshReadingViews
							}));
					});
			},
			invalidatesTags: ['Units']
		}),
		deleteUnit: builder.mutation<void, number>({
			query: unitId => ({
				url: 'api/units/delete',
				method: 'POST',
				body: { id: unitId }
			}),
			onQueryStarted: (_arg, api) => {
				api.queryFulfilled
					.then(() => {
						api.dispatch(
							conversionsApi.endpoints.refresh.initiate({
								// The server already redid Cik in /api/units/delete so only refresh the client data.
								redoCik: false,
								refreshReadingViews: false
							})
						);
					});
			},
			// Refresh invalidates ConversionDetails, Cik, Readings and Units.
			// The delete can also clear a meter's unit or a meter/group's default graphic unit,
			// so those need to be refetched here.
			invalidatesTags: ['MeterData', 'GroupData']
		})
	})
});

export const selectUnitDataResult = unitsApi.endpoints.getUnitsDetails.select();
export const {
	selectAll: selectAllUnits,
	selectById: selectUnitById,
	selectTotal: selectUnitTotal,
	selectIds: selectUnitIds,
	selectEntities: selectUnitDataById
} = unitsAdapter.getSelectors((state: RootState) => selectUnitDataResult(state).data ?? unitsInitialState);

export const stableEmptyUnitDataById: UnitDataById = {};
