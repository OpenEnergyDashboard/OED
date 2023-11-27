// import * as React from 'react';
import { selectInitComplete } from '../reducers/appStateSlice';
import { selectCurrentUserRole, selectIsAdmin } from '../reducers/currentUser';
import { useAppSelector } from './hooks';


export const useWaitForInit = () => {
	const isAdmin = useAppSelector(selectIsAdmin);
	const userRole = useAppSelector(selectCurrentUserRole);
	const initComplete = useAppSelector(selectInitComplete);
	return { isAdmin, userRole, initComplete }
}