import * as _ from 'lodash';
import { BarReadingApiArgs, LineReadingApiArgs, ThreeDReadingApiArgs } from '../../redux/selectors/dataSelectors';
import { RootState } from '../../store';
import { BarReadings, LineReadings, ThreeDReading } from '../../types/readings';
import { baseApi } from './baseApi';




export const readingsApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		// threeD: the queryEndpoint name		// builder.query<ReturnType, QueryArgs Type>
		threeD: builder.query<ThreeDReading, ThreeDReadingApiArgs>({
			// ThreeD request only single meters at a time which plays well with default cache behavior
			// No other properties are necessary for this endpoint
			// Refer to the line endpoint for an example of an endpoint with custom cache behavior
			query: ({ id, timeInterval, unitID, readingInterval, meterOrGroup }) => {
				// destructure args that are passed into the callback, and generate the API url for the request.
				const endpoint = `api/unitReadings/threeD/${meterOrGroup}/`
				const args = `${id}?timeInterval=${timeInterval}&graphicUnitId=${unitID}&readingInterval=${readingInterval}`
				return `${endpoint}${args}`
			}
		}),
		// line: the queryEndpoint name		// builder.query<ReturnType, QueryArgs Type>
		line: builder.query<LineReadings, LineReadingApiArgs>({
			// To see another example of (serializeQueryArgs, merge, forceRefetch) being used in tandem to customize cache behavior refer to:
			// Example for merge https://redux-toolkit.js.org/rtk-query/api/createApi#merge

			// Customize Cache Behavior by utilizing (serializeQueryArgs, merge, forceRefetch)
			serializeQueryArgs: ({ queryArgs }) => {
				// Modify the default serialization behavior to better suit our use case, to avoid querying already cached data.
				// We omit the ids so that any query with the same timeInterval,GraphicUnitId, and meterOrGroup will hit the same cache
				// if we didn't omit id's there would be separate cache entries for queries with ids [1], [1,2], [1,2,3], [1,3], etc..
				// an entry fore each means requesting the same data again for ALL meters. which results in too much duplicate data requests

				// We keep all args other than the ids.
				return _.omit(queryArgs, 'ids')
			},
			merge: (currentCacheData, responseData) => {
				// By default subsequent queries that resolve to the same cache entry will overwrite the existing data.
				// For our use case, many queries will point to the same resolved cache, therefore we must provide merge behavior to not lose data

				// it is important to note,
				// Since this is wrapped with Immer, you may either mutate the currentCacheValue directly, or return a new value, but not both at once.
				_.merge(currentCacheData, responseData)
			},
			forceRefetch: ({ currentArg, endpointState }) => {
				// Since we modified the way the we serialize the args any subsequent query would return the cache data, even if new meters were requested
				// To resolve this we provide a forceRefetch where we decide if data needs to be fetched, or retrieved from the cache.

				// check if there is data in the endpointState,
				const currentData = endpointState?.data ? Object.keys(endpointState.data).map(Number) : undefined
				if (!currentData) {
					// No data, so force fetch
					return true
				}
				// check if the requested id's already exist in cache
				const dataInCache = currentArg?.ids.every(id => currentData.includes(id))

				// if data requested already lives in the cache, no fetch necessary, else fetch for data
				return dataInCache ? false : true
			},
			queryFn: async (args, queryApi, _extra, baseQuery) => {
				// We opt for a query function here instead of the normal query: args => {....}
				// In a queryFn, we can reference the store's state, to manipulate the provided query args
				// The query can request multiple ids, but we may already have some data cached, so only request the necessary ids.

				// use the query api to get the store's state, (Type Assertion necessary for typescript otherwise, 'unknown')
				const state = queryApi.getState() as RootState
				// get cache data utilizing the readings Api endpoint
				// Refer to: https://redux-toolkit.js.org/rtk-query/api/created-api/endpoints#select
				const cachedData = readingsApi.endpoints.line.select(args)(state).data
				// map cache keys to a number array, if any
				const cachedIDs = cachedData ? Object.keys(cachedData).map(Number) : []
				// get the args provided in the original request
				const { ids, timeInterval, unitID, meterOrGroup } = args
				// subtract any already cached keys from the requested ids, and stringify the array for the url endpoint
				const idsToFetch = _.difference(ids, cachedIDs).join(',')

				// api url from derived request arguments
				const endpointURL = `api/unitReadings/line/${meterOrGroup}/${idsToFetch}?timeInterval=${timeInterval}&graphicUnitId=${unitID}`

				// use the baseQuery from the queryFn with our url endpoint
				const { data, error } = await baseQuery(endpointURL)

				// https://redux-toolkit.js.org/rtk-query/usage/customizing-queries#implementing-a-queryfn
				// queryFn requires either a data, or error object to be returned
				if (error) {
					return { error }
				}
				// since we define custom merge behavior, incoming data will merge with the existing cache
				return { data: data as LineReadings }

			}
		}),
		bar: builder.query<BarReadings, BarReadingApiArgs>({
			// Refer to line endpoint for detailed explanation as the logic is identical
			serializeQueryArgs: ({ queryArgs }) => _.omit(queryArgs, 'ids'),
			merge: (currentCacheData, responseData) => { _.merge(currentCacheData, responseData) },
			forceRefetch: ({ currentArg, endpointState }) => {
				const currentData = endpointState?.data ? Object.keys(endpointState.data).map(Number) : undefined
				if (!currentData) { return true }
				const dataInCache = currentArg?.ids.every(id => currentData.includes(id))
				return !dataInCache ? true : false
			},
			queryFn: async (args, queryApi, _extra, baseQuery) => {
				const { ids, timeInterval, unitID, meterOrGroup, barWidthDays } = args
				const state = queryApi.getState() as RootState
				const cachedData = readingsApi.endpoints.bar.select(args)(state).data
				const cachedIDs = cachedData ? Object.keys(cachedData).map(Number) : []
				const idsToFetch = _.difference(ids, cachedIDs).join(',')
				const endpoint = `api/unitReadings/bar/${meterOrGroup}/${idsToFetch}?`
				const queryArgs = `timeInterval=${timeInterval}&barWidthDays=${barWidthDays}&graphicUnitId=${unitID}`
				const endpointURL = `${endpoint}${queryArgs}`
				const { data, error } = await baseQuery(endpointURL)
				return error ? { error } : { data: data as LineReadings }
			}
		})
	})
})