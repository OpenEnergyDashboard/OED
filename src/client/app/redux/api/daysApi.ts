import { Day, DaySegment } from '../../types/redux/days';
import { baseApi } from './baseApi';

// Inject endpoints into baseApi for consistency with conversionsApi
export const daysApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		getDaysDetails: builder.query<Day[], void>({
			query: () => 'api/days',
			providesTags: ['DayDetails']
		})
		// 		getDayById: builder.query<Day, string>({
		// 			query: id => `api/days/${id}`,
		// 			providesTags: (result, error, id) => [{ type: 'DayDetails', id }]
		// 		}),
		// 		addDay: builder.mutation<Day, Partial<Day>>({
		// 			query: newDay => ({
		// 				url: 'api/days',
		// 				method: 'POST',
		// 				body: newDay
		// 			}),
		// 			invalidatesTags: ['DayDetails']
		// 		}),
		// 		editDay: builder.mutation<Day, Partial<Day> & Pick<Day, 'id'>>({
		// 			query: ({ id, ...updatedDay }) => ({
		// 				url: `api/days/${id}`,
		// 				method: 'PUT',
		// 				body: updatedDay
		// 			}),
		// 			invalidatesTags: ['DayDetails']
		// 		}),
		// 		deleteDay: builder.mutation<void, string>({
		// 			query: id => ({
		// 				url: `api/days/${id}`,
		// 				method: 'DELETE'
		// 			}),
		// 			invalidatesTags: ['DayDetails']
		// 		}),
		// 		getDaySegments: builder.query<DaySegment[], string>({
		// 			query: dayId => `api/days/${dayId}/segments`,
		// 			providesTags: (result, error, dayId) => [{ type: 'DaySegments', dayId }]
		// 		}),
		// 		addDaySegment: builder.mutation<DaySegment, { dayId: string; segment: Partial<DaySegment> }>({
		// 			query: ({ dayId, segment }) => ({
		// 				url: `api/days/${dayId}/segments`,
		// 				method: 'POST',
		// 				body: segment
		// 			}),
		// 			invalidatesTags: (result, error, { dayId }) => [{ type: 'DaySegments', dayId }]
		// 		}),
		// 		editDaySegment: builder.mutation<DaySegment, { dayId: string; segmentId: string; segment: Partial<DaySegment> }>({
		// 			query: ({ dayId, segmentId, segment }) => ({
		// 				url: `api/days/${dayId}/segments/${segmentId}`,
		// 				method: 'PUT',
		// 				body: segment
		// 			}),
		// 			invalidatesTags: (result, error, { dayId }) => [{ type: 'DaySegments', dayId }]
		// 		}),
		// 		deleteDaySegment: builder.mutation<void, { dayId: string; segmentId: string }>({
		// 			query: ({ dayId, segmentId }) => ({
		// 				url: `api/days/${dayId}/segments/${segmentId}`,
		// 				method: 'DELETE'
		// 			}),
		// 			invalidatesTags: (result, error, { dayId }) => [{ type: 'DaySegments', dayId }]
		// 		})
	})
});

// Selectors for days
// export const selectDaysQueryState = daysApi.endpoints.getDaysDetails.select();
// export const selectDaysDetails = createSelector(
// 	selectDaysQueryState,
// 	({ data: daysData = [] }) => daysData
// );

export const stableEmptyDays: Day[] = [];
export const stableEmptyDaySegments: DaySegment[] = [];

// export const {
// 	useGetDaysDetailsQuery,
// 	useGetDayByIdQuery,
// 	useAddDayMutation,
// 	useEditDayMutation,
// 	useDeleteDayMutation,
// 	useGetDaySegmentsQuery,
// 	useAddDaySegmentMutation,
// 	useEditDaySegmentMutation,
// 	useDeleteDaySegmentMutation
// }
