import { currentUserSlice } from '../../reducers/currentUser';
import { User } from '../../types/items';
import { deleteToken } from '../../utils/token';
import { baseApi } from './baseApi';
import { userApi } from './userApi';

type LoginResponse = User & {
	token: string
};

export const authApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		login: builder.mutation<LoginResponse, { email: string, password: string }>({
			query: loginArgs => ({
				url: 'api/login',
				method: 'POST',
				body: loginArgs
			}),
			// When this mutation is successful, cache stores with these tags are marked as invalid
			// next time the corresponding endpoint is queried, cache will be ignored and overwritten by a fresh query.
			// in this case, a user logged in which means that some info for ADMIN meters groups etc.
			// invalidate forces a refetch to any subscribed components or the next query.
			invalidatesTags: ['MeterData', 'GroupData']
			// Listeners for this query (ExtraReducers):
			//	currentUserSlice->MatchFulfilled
		}),
		verifyToken: builder.mutation<{ success: boolean }, string>({
			query: token => ({
				url: 'api/verification',
				method: 'POST',
				body: { token: token }
			}),
			// Optional endpoint property that does additional logic when the query is initiated.
			onQueryStarted: async (token, { dispatch, queryFulfilled }) => {
				// wait for the initial query (verifyToken) to finish
				await queryFulfilled
					.then(async () => {
						// Token is valid if not errored out by this point,
						// Apis will now use the token in headers via baseAPI's Prepare Headers
						dispatch(currentUserSlice.actions.setUserToken(token))

						//  Get userDetails with verified token in headers
						const response = dispatch(userApi.endpoints.getUserDetails.initiate());
						// Next time the endpoint is queried it should be should be re-fetched, not pulled from the cache
						// Subscriptions are handled automatically by hooks, but not when called via 'dispatch(endpoint.initiate())'
						// Manually unsubscribe from the cache via the returned promise's .unsubscribe() method
						response.unsubscribe();
						// The returned response is the thunk's promise which internally handles the request's promise.
						// Use unwrap to get the original request's promise.
						await response.unwrap().catch(e => { throw (e) })

						// if no error thrown user is now logged in and cache(s) may be out of date due to potential admin privileges etc.
						// manually invalidate potentially out of date cache stores
						dispatch(baseApi.util.invalidateTags(['MeterData', 'GroupData', 'Users']))
						// If subscriptions to these tagged endpoints exist, they will automatically re-fetch.
						// Otherwise subsequent requests will bypass and overwrite cache
					})
					.catch(() => {
						// User had a token that isn't valid or getUserDetails threw an error.
						// Assume token is invalid. Delete if any
						deleteToken()
					})
			}
		}),
		logout: builder.mutation<null, void>({
			queryFn: (_, { dispatch }) => {
				// Opt to use a RTK mutation instead of manually writing a thunk to take advantage mutation invalidations
				dispatch(currentUserSlice.actions.clearCurrentUser())
				return { data: null }
			},
			invalidatesTags: ['MeterData', 'GroupData']
		})
	})
})