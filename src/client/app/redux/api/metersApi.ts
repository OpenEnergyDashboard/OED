import { baseApi } from './baseApi'
import * as _ from 'lodash';
import { MeterData, MeterDataByID } from '../../types/redux/meters'
import { durationFormat } from '../../utils/durationFormat';


export const metersApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		getMeters: builder.query<MeterDataByID, void>({
			query: () => 'api/meters',
			// Optional endpoint property that can transform incoming api responses if needed
			transformResponse: (response: MeterData[]) => {
				response.forEach(meter => { meter.readingFrequency = durationFormat(meter.readingFrequency) });
				return _.keyBy(response, meter => meter.id)
			},
			// Tags used for invalidation by mutation requests.
			providesTags: ['MeterData']
		})
	})
})

export const { useGetMetersQuery } = metersApi;
export const selectMeterInfo = metersApi.endpoints.getMeters.select()
