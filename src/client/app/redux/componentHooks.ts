// import * as React from 'react';
import { groupsApi } from './api/groupsApi';
import { metersApi } from './api/metersApi';
import { readingsApi } from './api/readingsApi';
import { useAppSelector } from './hooks';
import { selectAllChartQueryArgs } from './selectors/chartQuerySelectors';
import { unitsApi } from './api/unitsApi';
import { selectInitComplete } from '../reducers/appStateSlice';
import { selectIsAdmin, selectCurrentUserRole } from '../reducers/currentUser';


export const useWaitForInit = () => {
	const isAdmin = useAppSelector(selectIsAdmin);
	const userRole = useAppSelector(selectCurrentUserRole);
	const initComplete = useAppSelector(selectInitComplete);
	return { isAdmin, userRole, initComplete }
}

// General purpose custom hook mostly useful for Select component loadingIndicators, and current graph loading state(s)
export const useFetchingStates = () => {
	const queryArgs = useAppSelector(state => selectAllChartQueryArgs(state));
	const { isFetching: meterLineIsFetching, isLoading: meterLineIsLoading } = readingsApi.endpoints.line.useQueryState(queryArgs.line.meterArgs);
	const { isFetching: groupLineIsFetching, isLoading: groupLineIsLoading } = readingsApi.endpoints.line.useQueryState(queryArgs.line.groupArgs);
	const { isFetching: meterBarIsFetching, isLoading: meterBarIsLoading } = readingsApi.endpoints.bar.useQueryState(queryArgs.bar.meterArgs);
	const { isFetching: groupBarIsFetching, isLoading: groupBarIsLoading } = readingsApi.endpoints.bar.useQueryState(queryArgs.bar.groupArgs);
	const { isFetching: threeDIsFetching, isLoading: threeDIsLoading } = readingsApi.endpoints.threeD.useQueryState(queryArgs.threeD.args);
	const { isFetching: metersFetching, isLoading: metersLoading } = metersApi.endpoints.getMeters.useQueryState();
	const { isFetching: groupsFetching, isLoading: groupsLoading } = groupsApi.endpoints.getGroups.useQueryState();
	const { isFetching: unitsIsFetching, isLoading: unitsIsLoading } = unitsApi.endpoints.getUnitsDetails.useQueryState();


	return {
		endpointsFetchingData: {
			lineMeterReadings: { meterLineIsFetching, meterLineIsLoading },
			lineGroupReadings: { groupLineIsFetching, groupLineIsLoading },
			barMeterReadings: { meterBarIsFetching, meterBarIsLoading },
			barGroupReadings: { groupBarIsFetching, groupBarIsLoading },
			threeDReadings: { threeDIsFetching, threeDIsLoading },
			meterData: { metersFetching, metersLoading },
			groupData: { groupsFetching, groupsLoading },
			unitsData: { unitsIsFetching, unitsIsLoading }
		},
		somethingIsFetching: meterLineIsFetching ||
			groupLineIsFetching ||
			meterBarIsFetching ||
			groupBarIsFetching ||
			threeDIsFetching ||
			metersFetching ||
			groupsFetching ||
			unitsIsFetching
	}
}
