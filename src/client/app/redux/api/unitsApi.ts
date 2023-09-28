import { UnitData } from '../../types/redux/units';
import { baseApi } from './baseApi';

export const unitsApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		getUnitsDetails: builder.query<UnitData[], void>({
			query: () => 'api/units'
		}),
		addUnit: builder.mutation<void, UnitData>({
			query: unitDataArgs => ({
				url: 'api/units/addUnit',
				method: 'POST',
				body: { unitDataArgs }
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