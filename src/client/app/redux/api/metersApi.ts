import * as _ from 'lodash';
import { NamedIDItem } from 'types/items';
import { RawReadings } from 'types/readings';
import { TimeInterval } from '../../../../common/TimeInterval';
import { RootState } from '../../store';
import { MeterData, MeterDataByID } from '../../types/redux/meters';
import { durationFormat } from '../../utils/durationFormat';
import { baseApi } from './baseApi';
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
		})
	})
})

/**
 * Selects the meter data associated with a given meter ID from the Redux state.
 * @param {RootState} state - The current state of the Redux store.
 * @returns The latest query state for the given which can be destructured for the dataById
 * @example
 * const endpointState = useAppSelector(state => selectMeterDataById(state))
 * const meterDataByID = endpointState.data
 * or
 * const { data: meterDataByID } = useAppSelector(state => selectMeterDataById(state))
 */
export const selectMeterDataById = metersApi.endpoints.getMeters.select()


/**
 * Selects the meter data associated with a given meter ID from the Redux state.
 * @param state - The current state of the Redux store.
 * @param meterID - The unique identifier for the meter.
 * @returns The data for the specified meter or undefined if not found.
 * @example
 * const meterData = useAppSelector(state => selectMeterDataWithID(state, 42))
 */
export const selectMeterDataWithID = (state: RootState, meterID: number): MeterData | undefined => {
	const { data: meterDataByID = {} } = selectMeterDataById(state);
	return meterDataByID[meterID];
}


/**
 * Selects the name of the meter associated with a given meter ID from the Redux state.
 * @param state - The current state of the Redux store.
 * @param meterID - The unique identifier for the meter.
 * @returns The name of the specified meter or an empty string if not found.
 * @example
 * const meterName = useAppSelector(state => selectMeterNameWithID(state, 42))
 */
export const selectMeterNameWithID = (state: RootState, meterID: number) => {
	const meterInfo = selectMeterDataWithID(state, meterID);
	return meterInfo ? meterInfo.name : '';
}

/**
 * Selects the identifier (not the meter ID) of the meter associated with a given meter ID from the Redux state.
 * @param state - The current state of the Redux store.
 * @param meterID - The unique identifier for the meter.
 * @returns The identifier for the specified meter or an empty string if not found.
 * @example
 * const meterIdentifier = useAppSelector(state => selectMeterIdentifier(state, 42))
 */
export const selectMeterIdentifierWithID = (state: RootState, meterID: number) => {
	const meterInfo = selectMeterDataWithID(state, meterID);
	return meterInfo ? meterInfo.identifier : '';
}