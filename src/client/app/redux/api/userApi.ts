import { User } from '../../types/items';
// import { authApi } from './authApi';
import { baseApi } from './baseApi';

export const userApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		getUserDetails: builder.query<User | null, void>({
			query: () => 'api/users/token',
			// Do not retain response when no subscribers
			keepUnusedDataFor: 0
		}
		)
	})
})