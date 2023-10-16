import { createSelector } from '@reduxjs/toolkit';
import { UserRole } from '../../types/items';
import { selectCurrentUser } from '../../reducers/currentUser'

// Memoized Selectors for stable obj reference from derived Values
export const selectIsLoggedInAsAdmin = createSelector(
	selectCurrentUser,
	currentUser => {
		// True of token in state, and  has Admin Role.
		// Token If token is in state, it has been validated upon app initialization, or by login verification
		// Type looked weird without boolean
		return (currentUser.token && currentUser.profile?.role === UserRole.ADMIN) as boolean
	}
)
