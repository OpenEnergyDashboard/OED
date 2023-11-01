import *  as _ from 'lodash'
import { UnitData, UnitDataById } from '../../types/redux/units';
import { baseApi } from './baseApi';

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

export const selectUnitDataById = unitsApi.endpoints.getUnitsDetails.select()