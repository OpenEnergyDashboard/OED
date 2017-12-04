import store from '../index';
import { showNotification as showNotificationAction } from '../actions/notifications';

export function showSuccessNotification(message, position = 'tr', autoDismiss = 3) {
	store.dispatch(showNotificationAction({
		message,
		level: 'success',
		position,
		autoDismiss
	}));
}

export function showErrorNotification(message, position = 'tr', autoDismiss = 3) {
	store.dispatch(showNotificationAction({
		message,
		level: 'error',
		position,
		autoDismiss
	}));
}
