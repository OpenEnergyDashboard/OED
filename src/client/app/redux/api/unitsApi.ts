import { EntityState, createEntityAdapter } from '@reduxjs/toolkit';
import { RootState } from 'store';
import { UnitData } from '../../types/redux/units';
import { baseApi } from './baseApi';
import { conversionsApi } from './conversionsApi';
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
				return unitsAdapter.setAll(unitsInitialState, response)
			},
			providesTags: ['Units']
		}),
		addUnit: builder.mutation<void, UnitData>({
			query: unitDataArgs => ({
				url: 'api/units/addUnit',
				method: 'POST',
				body: { ...unitDataArgs }
			}),
			onQueryStarted: (_arg, api) => {
				api.queryFulfilled
					.then(() => {
						api.dispatch(
							conversionsApi.endpoints.refresh.initiate({
								redoCik: true,
								refreshReadingViews: false
							}))
					})
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
							}))
					})
			},
			invalidatesTags: ['Units']
		})
	})
})

export const selectUnitDataResult = unitsApi.endpoints.getUnitsDetails.select()
export const {
	selectAll: selectAllUnits,
	selectById: selectUnitById,
	selectTotal: selectUnitTotal,
	selectIds: selectUnitIds,
	selectEntities: selectUnitDataById
} = unitsAdapter.getSelectors((state: RootState) => selectUnitDataResult(state).data ?? unitsInitialState)

