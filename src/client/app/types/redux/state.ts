/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { AdminState } from './admin';
import { BarReadingsState } from './barReadings';
import { CompareReadingsState } from './compareReadings';
import { ConversionsState } from './conversions';
import { CurrentUserState } from './currentUser';
import { GraphState } from './graph';
import { GroupsState } from './groups';
import { LineReadingsState } from './lineReadings';
import { MapState } from './map';
import { MetersState } from './meters';
import { NotificationsState } from './notifications';
import { UnitsState } from './units';
import { UnsavedWarningState } from './unsavedWarning';
import { VersionState } from './version';


export interface State {
	meters: MetersState;
	readings: {
		line: LineReadingsState;
		bar: BarReadingsState;
		compare: CompareReadingsState;
	};
	graph: GraphState;
	maps: MapState;
	groups: GroupsState;
	notifications: NotificationsState;
	admin: AdminState;
	version: VersionState;
	currentUser: CurrentUserState;
	unsavedWarning: UnsavedWarningState;
	units: UnitsState;
	conversions: ConversionsState;
}
