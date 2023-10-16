/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { TranslatedString } from './translate';
import { ToastPosition, toast } from 'react-toastify';

/**
 * Show user the success notification
 * @param message translation identifier for message to display
 * @param position screen position for notification where top, right is the default
 * @param autoDismiss milliseconds until notification goes away with default of 3 seconds
 */
export function showSuccessNotification(message: TranslatedString, position: ToastPosition = toast.POSITION.TOP_RIGHT, autoDismiss = 3000) {
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
 * Show user the error notification
 * @param message translation identifier for message to display
 * @param position screen position for notification where top, right is the default
 * @param autoDismiss milliseconds until notification goes away with default of 15 seconds
 */
export function showErrorNotification(message: TranslatedString, position: ToastPosition = toast.POSITION.TOP_RIGHT, autoDismiss = 15000) {
	toast.error(message, {
		position: position,
		autoClose: autoDismiss,
		hideProgressBar: true,
		pauseOnHover: false,
		draggable: true,
		theme: 'colored'
	})
}
