import { fetchMapsDetails } from '../actions/map';
import { authApi } from '../redux/api/authApi';
import { conversionsApi } from '../redux/api/conversionsApi';
import { groupsApi } from '../redux/api/groupsApi';
import { metersApi } from '../redux/api/metersApi';
import { preferencesApi } from '../redux/api/preferencesApi';
import { unitsApi } from '../redux/api/unitsApi';
import { userApi } from '../redux/api/userApi';
import { versionApi } from '../redux/api/versionApi';
import { createThunkSlice } from '../redux/slices/thunkSlice';
import { deleteToken, getToken, hasToken } from '../utils/token';
import { currentUserSlice } from './currentUser';

interface appStateSlice {
	initComplete: boolean;
	optionsVisibility: boolean;

}

const defaultState: appStateSlice = {
	initComplete: false,
	optionsVisibility: true
}

export const appStateSlice = createThunkSlice({
	name: 'appState',
	initialState: defaultState,
	reducers: create => ({
		// New way of creating reducers as of RTK 2.0
		// Allows thunks inside of reducers, and prepareReducers with 'create' builder notation
		setInitComplete: create.reducer<boolean>((state, action) => {
			state.initComplete = action.payload
		}),
		toggleOptionsVisibility: create.reducer(state => {
			state.optionsVisibility = !state.optionsVisibility
		}),
		setOptionsVisibility: create.reducer<boolean>((state, action) => {
			state.optionsVisibility = action.payload
		}),
		initApp: create.asyncThunk(
			// Thunk initiates many data fetching calls on startup before react begins to render
			async (_: void, { dispatch }) => {
				// These queries will trigger a api request, and add a subscription to the store.
				// Typically they return an unsubscribe method, however we always want to be subscribed to any cache changes for these endpoints.
				dispatch(versionApi.endpoints.getVersion.initiate())
				dispatch(preferencesApi.endpoints.getPreferences.initiate())
				dispatch(unitsApi.endpoints.getUnitsDetails.initiate())
				dispatch(conversionsApi.endpoints.getConversionsDetails.initiate())
				dispatch(conversionsApi.endpoints.getConversionArray.initiate())

				// Older style thunk fetch cycle for maps until migration
				dispatch(fetchMapsDetails())

				// If user is an admin, they receive additional meter details.
				// To avoid sending duplicate requests upon startup, verify user then fetch
				if (hasToken()) {
					// User has a session token verify before requesting meter/group details
					try {
						await dispatch(authApi.endpoints.verifyToken.initiate(getToken()))
							.unwrap()
							.catch(e => { throw e })
						// Token is valid if not errored out by this point,
						// Apis will now use the token in headers via baseAPI's Prepare Headers
						dispatch(currentUserSlice.actions.setUserToken(getToken()))
						//  Get userDetails with verified token in headers
						await dispatch(userApi.endpoints.getUserDetails.initiate(undefined, { subscribe: false }))
							.unwrap()
							.catch(e => { throw e })

					} catch {
						// User had a token that isn't valid or getUserDetails threw an error.
						// Assume token is invalid. Delete if any
						deleteToken()
						dispatch(currentUserSlice.actions.setUserToken(null))
					}

				}
				// Request meter/group/details post-auth
				dispatch(metersApi.endpoints.getMeters.initiate())
				dispatch(groupsApi.endpoints.getGroups.initiate())
			},
			{
				settled: state => {
					state.initComplete = true
				}
			}

		)

	}),
	selectors: {
		selectInitComplete: state => state.initComplete,
		selectOptionsVisibility: state => state.optionsVisibility
	}
})

export const {
	initApp,
	setInitComplete,
	toggleOptionsVisibility,
	setOptionsVisibility
} = appStateSlice.actions

export const {
	selectInitComplete,
	selectOptionsVisibility
} = appStateSlice.selectors
