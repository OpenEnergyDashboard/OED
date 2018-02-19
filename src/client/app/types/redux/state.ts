/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { BarReadingsState } from './barReadings';
import { LineReadingsState } from './lineReadings';
import { GraphState } from './graph';
import { GroupsState } from './groups';
import { MetersState } from './meters';
import { NotificationsState } from './notifications';
import { AdminState } from './admin';

export interface State {
	meters: MetersState;
	readings: {
		line: LineReadingsState;
		bar: BarReadingsState;
	};
	graph: GraphState;
	groups: GroupsState;
	notifications: NotificationsState;
	admin: AdminState;
}
