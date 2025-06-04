/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import ApiBackend from './ApiBackend';
import MapsApi from './MapsApi';
import LogsApi from './LogsApi';

const apiBackend = new ApiBackend();

// All specific backends share the same ApiBackend
const mapsApi = new MapsApi(apiBackend);
const logsApi = new LogsApi(apiBackend);


export {
	mapsApi,
	logsApi
};
