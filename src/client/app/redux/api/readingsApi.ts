import { baseApi } from './baseApi'
import { ThreeDReading } from '../../types/readings'
import { MeterOrGroup, ReadingInterval } from '../../types/redux/graph';


export type ThreeDReadingApiParams = {
	meterOrGroupID: number;
	timeInterval: string;
	unitID: number;
	readingInterval: ReadingInterval;
	meterOrGroup: MeterOrGroup;
};

export const readingsApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		threeD: builder.query<ThreeDReading, ThreeDReadingApiParams>({
			query: ({ meterOrGroupID, timeInterval, unitID, readingInterval, meterOrGroup }) => {
				const endpoint = `/api/unitReadings/threeD/${meterOrGroup}/`
				const args = `${meterOrGroupID}?timeInterval=${timeInterval.toString()}&graphicUnitId=${unitID}&readingInterval=${readingInterval}`
				return `${endpoint}${args}`
			}
		})
	})
})
export const selectThreeDReadingData = readingsApi.endpoints.threeD.select