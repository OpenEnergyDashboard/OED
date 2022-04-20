/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import ApiBackend from './ApiBackend';
import GroupsApi from './GroupsApi';
import MetersApi from './MetersApi';
import PreferencesApi from './PreferencesApi';
import VerificationApi from './VerificationApi';
import CompressedReadingsApi from './CompressedReadingsApi';
import UploadCSVApi from './UploadCSVApi';
import UsersApi from './UsersApi';
import VersionApi from './VersionApi';
import MapsApi from './MapsApi';
import LogsApi from './LogsApi';
import ConversionsApi from './ConversionsApi';

const apiBackend = new ApiBackend();

// All specific backends share the same ApiBackend
const groupsApi = new GroupsApi(apiBackend);
const metersApi = new MetersApi(apiBackend);
const preferencesApi = new PreferencesApi(apiBackend);
const verificationApi = new VerificationApi(apiBackend);
const compressedReadingsApi = new CompressedReadingsApi(apiBackend);
const uploadCSVApi = new UploadCSVApi(apiBackend);
const usersApi = new UsersApi(apiBackend);
const mapsApi = new MapsApi(apiBackend);
const logsApi = new LogsApi(apiBackend);
const versionApi = new VersionApi(apiBackend);
const conversionsApi = new ConversionsApi(apiBackend);

export {
	groupsApi,
	metersApi,
	preferencesApi,
	verificationApi,
	compressedReadingsApi,
	mapsApi,
	logsApi,
	usersApi,
	versionApi,
	uploadCSVApi,
	conversionsApi,
};
