import { QueryStatus } from '@reduxjs/toolkit/query';
import { RootState } from '../../store';


export const selectAnythingFetching = (state: RootState) => {
	const somethingIsFetching = Object.values(state.api.queries).some(entry => entry?.status === QueryStatus.pending);
	return somethingIsFetching;
};
