import * as _ from 'lodash';
import { RootState } from 'store';
import { UnitData, UnitDataById } from '../../types/redux/units';
import { baseApi } from './baseApi';
import { createSelector } from '@reduxjs/toolkit';

export const unitsApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		getUnitsDetails: builder.query<UnitDataById, void>({
			query: () => 'api/units',
			transformResponse: (response: UnitData[]) => {
				return _.keyBy(response, unit => unit.id)
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
export const selectUnitDataByIdQueryState = unitsApi.endpoints.getUnitsDetails.select()

/**
 * Selects the most recent query status
 * @param state - The complete state of the redux store.
 * @returns The unit data corresponding to the `unitID` if found, or undefined if not.
 * @example
 *
 * const unitDataById = useAppSelector(state =>selectUnitDataById(state))
 * const unitDataById = useAppSelector(selectUnitDataById)
 */
export const selectUnitDataById = createSelector(
	selectUnitDataByIdQueryState,
	({ data: unitDataById = {} }) => {
		return unitDataById
	}
)

/**
 * Selects a unit from the state by its unique identifier.
 * @param state - The complete state of the redux store.
 * @param unitID - The unique identifier for the unit to be retrieved.
 * @returns The unit data corresponding to the `unitID` if found, or undefined if not.
 * @example
 *
 * // Get Unit Data for unit with ID of '1'
 * const unit = useAppSelector(state => selectUnitWithID(state, 1))
 */
export const selectUnitWithID = (state: RootState, unitID: number) => {
	const unitDataById = selectUnitDataById(state)
	return unitDataById[unitID]

}
