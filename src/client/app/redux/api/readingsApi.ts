import { BarReadingApiArgs, LineReadingApiArgs } from '../../redux/selectors/dataSelectors';
import { BarReadings, LineReadings, ThreeDReading } from '../../types/readings';
import { MeterOrGroup, ReadingInterval } from '../../types/redux/graph';
import { baseApi } from './baseApi';


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
				const endpoint = `api/unitReadings/threeD/${meterOrGroup}/`
				const args = `${meterOrGroupID}?timeInterval=${timeInterval.toString()}&graphicUnitId=${unitID}&readingInterval=${readingInterval}`
				return `${endpoint}${args}`
			}
		}),
		line: builder.query<LineReadings, LineReadingApiArgs>({
			query: ({ ids, timeInterval, graphicUnitID, meterOrGroup }) => {
				return `api/unitReadings/line/${meterOrGroup}/${ids.join(',')}?timeInterval=${timeInterval}&graphicUnitId=${graphicUnitID}`
			}
		}),
		bar: builder.query<BarReadings, BarReadingApiArgs>({
			query: ({ ids, timeInterval, graphicUnitID, meterOrGroup, barWidthDays }) => {
				const endpoint = `api/unitReadings/bar/${meterOrGroup}/${ids.join(',')}`
				const args = `?timeInterval=${timeInterval}&barWidthDays=${barWidthDays}&graphicUnitId=${graphicUnitID}`
				return `${endpoint}${args}`
			}
		})
	})
})