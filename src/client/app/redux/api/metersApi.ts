import { baseApi } from './baseApi'
import * as _ from 'lodash';
import { MeterData, MeterDataByID } from '../../types/redux/meters'
import { durationFormat } from '../../utils/durationFormat';


export const metersApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		getMeters: builder.query<MeterDataByID, void>({
			query: () => 'api/meters',
			transformResponse: (response: MeterData[]) => {
				response.forEach(meter => { meter.readingFrequency = durationFormat(meter.readingFrequency) });
				return _.keyBy(response, meter => meter.id)
			}
		})
	})
})

export const { useGetMetersQuery } = metersApi;
export const selectMeterInfo = metersApi.endpoints.getMeters.select()
