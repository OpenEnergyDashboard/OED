/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createSelector } from '@reduxjs/toolkit';
import { 
    Baseline, 
    BaselineSegment,
    CreateBaselinePayload,
    SplitBaselineSegmentPayload,
    UpdateBaselineSegmentPayload
} from '../../types/redux/baselines';
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
        getBaselineByMeterId: builder.query<Baseline, number>({
			query: meterId => `api/baseline/${meterId}`,
			providesTags: (result, error, id) => [{ type: 'Baselines', id }]
		}),
        addBaseline: builder.mutation<void, CreateBaselinePayload>({
            query: baseline => ({
                url: 'api/baseline/new',
                method: 'POST',
                body: baseline
            }),
			transformErrorResponse: res => res.data,
            invalidatesTags: ['Baselines']
        }),
        editBaseline: builder.mutation<void, Baseline>({
            query: baseline => ({
                url: 'api/baseline/edit',
                method: 'POST',
                body: baseline 
            }),
            // invalidatesTags: ['Baselines']            
			transformErrorResponse: res => res.data,
			invalidatesTags: (result, error, arg) => [{ type: 'Baselines', id: arg.meterId }]
        }),
        deleteBaseline: builder.mutation<void, number>({
            query: meterId => ({
                url: 'api/baseline/delete',
                method: 'POST',
                body: { id: meterId }
            }),
            invalidatesTags: ['Baselines']
        })
    })
});

export const baselineSegmentsApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		getBaselineSegmentsByMeterId: builder.query<BaselineSegment[], number>({
			query: meterId => `api/baselineSegments/${meterId}`,
			providesTags: (result, error, id) => [{ type: 'BaselineSegments', id }]
		}),
		addBaselineSegment: builder.mutation<void, Omit<BaselineSegment, 'id'>>({
			query: baselineSegment => ({
				url: 'api/baselineSegments/addBaselineSegment',
				method: 'POST',
				body: baselineSegment
			}),
			transformErrorResponse: res => res.data,
			invalidatesTags: ['BaselineSegments']
		}),
        // TO-DO: split functions
		splitEarlier: builder.mutation<void, SplitBaselineSegmentPayload & Pick<BaselineSegment, 'meterId'>>({
			query: ({ id, newBaselineValue, newNote, splitTime }) => ({
				url: 'api/baselineSegments/splitEarlier',
				method: 'POST',
				body: { id, newBaselineValue, newNote, splitTime }
			}),
			transformErrorResponse: res => res.data,
			invalidatesTags: (result, error, arg) => [{ type: 'BaselineSegments', meterId: arg.meterId }]
		}),
		splitLater: builder.mutation<void, SplitBaselineSegmentPayload & Pick<BaselineSegment, 'meterId'>>({
			query: ({ id, newBaselineValue, newNote, splitTime }) => ({
				url: 'api/baselineSegments/splitLater',
				method: 'POST',
				body: { id, newBaselineValue, newNote, splitTime }
			}),
			transformErrorResponse: res => res.data,
			invalidatesTags: (result, error, arg) => [{ type: 'BaselineSegments', meterId: arg.meterId }]
		}),
		editBaselineSegment: builder.mutation<void, UpdateBaselineSegmentPayload>({
			query: baselineSegment => ({
				url: 'api/baselineSegments/edit',
				method: 'POST',
				body: baselineSegment
			}),
			transformErrorResponse: res => res.data,
			invalidatesTags: (result, error, arg) => [{ type: 'BaselineSegments', meterId: arg.meterId }]
		}),
		deleteBaselineSegment: builder.mutation<void, BaselineSegment>({
			query: ({ meterId, startTime, endTime }) => ({
				url: 'api/baselineSegments/delete',
				method: 'POST',
				body: { meterId, startTime, endTime }
			}),
			transformErrorResponse: res => res.data,
			invalidatesTags: (result, error, arg) => [{ type: 'BaselineSegments', meterId: arg.meterId }]
		}),
		// Deletes the provided day segment and updates the end time of the previous segment
		deleteBaselineSegmentEarlier: builder.mutation<void, BaselineSegment>({
			query: ({ meterId, startTime, endTime }) => ({
				url: 'api/baselineSegments/deleteEarlier',
				method: 'POST',
				body: { meterId, startTime, endTime }
			}),
			transformErrorResponse: res => res.data,
			invalidatesTags: (result, error, arg) => [{ type: 'BaselineSegments', meterId: arg.meterId }]
		}),
		// Deletes the provided day segment and updates the start time of the next segment
		deleteBaselineSegmentLater: builder.mutation<void, BaselineSegment>({
			query: ({ meterId, startTime, endTime }) => ({
				url: 'api/baselineSegments/deleteLater',
				method: 'POST',
				body: { meterId, startTime, endTime }
			}),
			transformErrorResponse: res => res.data,
			invalidatesTags: (result, error, arg) => [{ type: 'BaselineSegments', meterId: arg.meterId }]
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

export const {
	useGetBaselinesDetailsQuery,
	useGetBaselineByMeterIdQuery,
	useAddBaselineMutation,
	useEditBaselineMutation,
	useDeleteBaselineMutation
} = baselineApi;


export const {
	useGetBaselineSegmentsByMeterIdQuery,
	useAddBaselineSegmentMutation,
	useEditBaselineSegmentMutation,
	useDeleteBaselineSegmentMutation
} = baselineSegmentsApi;