import { NewUser, User } from '../../types/items';
// import { authApi } from './authApi';
import { baseApi } from './baseApi';

export const userApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		getUserDetails: builder.query<User | null, void>({
			query: () => 'api/users/token',
			// Do not retain response when no subscribers
			keepUnusedDataFor: 0
		}),
		getUsers: builder.query<User[], void>({
			query: () => 'api/users',
			providesTags: ['Users']
		}),
		createUser: builder.mutation<void, NewUser>({
			query: user => ({
				url: 'api/users/create',
				method: 'POST',
				body: { user }
			}),
			invalidatesTags: ['Users']
		}),
		editUsers: builder.mutation<void, User[]>({
			query: users => ({
				url: 'api/users/edit',
				method: 'POST',
				body: { users }
			}),
			invalidatesTags: ['Users']
		}),
		deleteUsers: builder.mutation<void, string>({
			query: email => ({
				url: 'api/users/delete',
				method: 'POST',
				body: { email }
			}),
			invalidatesTags: ['Users']
		})
	})
})

// public async editUsers(users: User[]) {
// 	return await this.backend.doPostRequest('/api/users/edit', { users });
// }

// public async deleteUser(email: string) {
// 	return await this.backend.doPostRequest('/api/users/delete', { email });
// }