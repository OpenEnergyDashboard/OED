import { currentUserSlice } from '../../reducers/currentUser';
import { User } from '../../types/items';
import { deleteToken } from '../../utils/token';
import { baseApi } from './baseApi';

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
			})
		}),
		logout: builder.mutation<null, void>({
			queryFn: (_, { dispatch }) => {
				// Opt to use a RTK mutation instead of manually writing a thunk to take advantage mutation invalidations
				deleteToken()
				dispatch(currentUserSlice.actions.clearCurrentUser())
				return { data: null }
			},
			invalidatesTags: ['MeterData', 'GroupData']
		})
	})
})