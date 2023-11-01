import * as _ from 'lodash';
import { TimeInterval } from '../../../../common/TimeInterval';
import { MeterData, MeterDataByID } from '../../types/redux/meters';
import { durationFormat } from '../../utils/durationFormat';
import { baseApi } from './baseApi';
import { NamedIDItem } from 'types/items';
import { CompareReadings, RawReadings } from 'types/readings';
import { conversionsApi } from './conversionsApi';


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
		}),
		editMeter: builder.mutation<MeterData, { meterData: MeterData, shouldRefreshViews: boolean }>({
			query: ({ meterData }) => ({
				url: 'api/meters/edit',
				method: 'POST',
				body: { ...meterData }
			}),
			onQueryStarted: async ({ shouldRefreshViews }, api) => {
				await api.queryFulfilled.then(() => {
					// Update reading views if needed. Never redoCik so false.
					api.dispatch(conversionsApi.endpoints.refresh.initiate({ redoCik: false, refreshReadingViews: shouldRefreshViews }))
				})
			},
			invalidatesTags: ['MeterData']
		}),
		addMeter: builder.mutation<MeterData, MeterData>({
			query: meter => ({
				url: 'api/meters/addMeter',
				method: 'POST',
				body: { ...meter }
			}),

			invalidatesTags: ['MeterData']
		}),

		lineReadingsCount: builder.query<number, { meterIDs: number[], timeInterval: TimeInterval }>({
			query: ({ meterIDs, timeInterval }) => `api/readings/line/count/meters/${meterIDs.join(',')}?timeInterval=${timeInterval.toString()}`
		}),
		details: builder.query<NamedIDItem[], void>({
			query: () => 'api/meters'
		}),
		rawLineReadings: builder.query<RawReadings[], { meterID: number, timeInterval: TimeInterval }>({
			query: ({ meterID, timeInterval }) => `api/readings/line/raw/meter/${meterID}?timeInterval=${timeInterval.toString()}`
		}),
		/**
		 * Gets compare readings for meters for the given current time range and a shift for previous time range
		 * @param meterIDs The meter IDs to get readings for
		 * @param timeInterval  start and end of current/this compare period
		 * @param shift how far to shift back in time from current period to previous period
		 * @param unitID The unit id that the reading should be returned in, i.e., the graphic unit
		 * @returns CompareReadings in sorted order
		 */
		meterCompareReadings: builder.query<CompareReadings, { meterIDs: number[], timeInterval: TimeInterval, shift: moment.Duration, unitID: number }>({
			query: ({ meterIDs, timeInterval, shift, unitID }) => {
				const stringifiedIDs = meterIDs.join(',');
				const currStart = timeInterval.getStartTimestamp().toISOString();
				const currEnd = timeInterval.getEndTimestamp().toISOString();
				const apiURL = `/api/compareReadings/meters/${stringifiedIDs}?`
				const params = `curr_start=${currStart}&curr_end=${currEnd}&shift=${shift.toISOString()}&graphicUnitId=${unitID.toString()}`
				return `${apiURL}${params}`
			}
		})

	})
})

export const selectMeterDataById = metersApi.endpoints.getMeters.select()
