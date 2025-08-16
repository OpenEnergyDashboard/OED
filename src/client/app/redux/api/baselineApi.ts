/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createSelector, EntityState, createEntityAdapter } from '@reduxjs/toolkit';
import { Baseline } from '../../types/redux/baselines';
import { baseApi } from './baseApi';
// export const unitsAdapter = createEntityAdapter<Baseline>({
//     selectId
//     // sortComparer: (unitA, unitB) => unitA.identifier?.localeCompare(unitB.identifier, undefined, { sensitivity: 'accent' })
// });
// export const unitsInitialState = unitsAdapter.getInitialState();
// export type UnitDataState = EntityState<UnitData, number>;

export const baselineApi = baseApi.injectEndpoints({
    endpoints: builder => ({
        getBaselinesDetails: builder.query<Baseline[], void>({
            query: () => 'api/baseline',
            providesTags: ['Baselines']
        }),
        addBaseline: builder.mutation<void, Baseline>({
            query: baseline => ({
                url: 'api/baseline/new',
                method: 'POST',
                body: baseline
            }),
            invalidatesTags: ['Baselines']
        }),
        editBaseline: builder.mutation<void, Baseline>({
            query: baseline => ({
                url: 'api/baseline/edit',
                method: 'POST',
                body: baseline 
            }),
            invalidatesTags: ['Baselines']
        }),
        deleteBaseline: builder.mutation<void, number>({
            query: unitId => ({
                url: 'api/baseline/delete',
                method: 'POST',
                body: { id: unitId }
            }),
            // You should not be able to delete a unit that is used in a meter or conversion
            // so no invalidation for those.
            invalidatesTags: ['Baselines']
        })
    })
});

export const selectBaselinesQueryState = baselineApi.endpoints.getBaselinesDetails.select();
export const selectBaselinesDetails= createSelector(
    selectBaselinesQueryState,
    ({ data: baselineData = [] }) => {
        return baselineData;
    }
);

export const { selectEntities: selectBaselineById } = 
