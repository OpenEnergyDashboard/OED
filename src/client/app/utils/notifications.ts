/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { ToastPosition, toast } from 'react-toastify';

/**
 * Show user the success notification
 * @param message translation identifier for message to display
 * @param position screen position for notification where top, right is the default
 * @param autoDismiss milliseconds until notification goes away with default of 3 seconds
 */
export function showSuccessNotification(message: string, position: ToastPosition = toast.POSITION.TOP_RIGHT, autoDismiss = 3000) {
	toast.success(message, {
		position: position,
		autoClose: autoDismiss,
		hideProgressBar: true,
		pauseOnHover: false,
		draggable: true,
		theme: 'colored'
	});
}

/**
 * Show user the information notification
 * @param message translation identifier for message to display
 * @param position screen position for notification where top, right is the default
 * @param autoDismiss milliseconds until notification goes away with default of 7 seconds
 */
export function showInfoNotification(message: string, position: ToastPosition = toast.POSITION.TOP_RIGHT, autoDismiss = 7000) {
	toast.info(message, {
		position: position,
		autoClose: autoDismiss,
		hideProgressBar: true,
		pauseOnHover: false,
		draggable: true,
		theme: 'colored'
	});
}

/**
 * Show user the warning notification
 * @param message translation identifier for message to display
 * @param position screen position for notification where top, right is the default
 * @param autoDismiss milliseconds until notification goes away with default of 10 seconds
 */
export function showWarnNotification(message: string, position: ToastPosition = toast.POSITION.TOP_RIGHT, autoDismiss = 10000) {
	toast.warn(message, {
		position: position,
		autoClose: autoDismiss,
		hideProgressBar: true,
		pauseOnHover: true,
		draggable: false,
		theme: 'colored',
		closeOnClick: false
	});
}

/**
 * Show user the error notification
 * @param message translation identifier for message to display
 * @param position screen position for notification where top, right is the default
 * @param autoDismiss milliseconds until notification goes away with default of 15 seconds
 */
export function showErrorNotification(message: string, position: ToastPosition = toast.POSITION.TOP_RIGHT, autoDismiss = 15000) {
	toast.error(message, {
		position: position,
		autoClose: autoDismiss,
		hideProgressBar: true,
		pauseOnHover: true,
		draggable: false,
		theme: 'colored',
		closeOnClick: false
	});
}
