import { EntityState, createEntityAdapter } from '@reduxjs/toolkit';
import { RootState } from 'store';
import { UnitData } from '../../types/redux/units';
import { baseApi } from './baseApi';
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
			}
		}),
		addUnit: builder.mutation<void, UnitData>({
			query: unitDataArgs => ({
				url: 'api/units/addUnit',
				method: 'POST',
				body: { ...unitDataArgs }
			})
		}),
		editUnit: builder.mutation<void, UnitData>({
			//TODO VALIDATE BEHAVIOR should invalidate?
			query: unitDataArgs => ({
				url: 'api/units/edit',
				method: 'POST',
				body: { ...unitDataArgs }
			})
		})
	})
})


/**
 * Selects the most recent query status
 * @param state - The complete state of the redux store.
 * @returns The unit data corresponding to the `unitID` if found, or undefined if not.
 * @example
 *
 * const queryState = useAppSelector(state => selectUnitDataByIdQueryState(state))
 * const {data: unitDataById = {}} = useAppSelector(state => selectUnitDataById(state))
 */
export const selectUnitDataResult = unitsApi.endpoints.getUnitsDetails.select()
export const {
	selectAll: selectAllUnits,
	selectById: selectUnitById,
	selectTotal: selectUnitTotal,
	selectIds: selectUnitIds,
	selectEntities: selectUnitDataById
} = unitsAdapter.getSelectors((state: RootState) => selectUnitDataResult(state).data ?? unitsInitialState)

