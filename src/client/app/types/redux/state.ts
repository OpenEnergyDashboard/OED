/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { BarReadingsState } from './barReadings';
import { LineReadingsState } from './lineReadings';
import { GraphState } from './graph';
import { GroupsState } from './groups';
import { MetersState } from './meters';
import { AdminState } from './admin';
import { CompareReadingsState } from './compareReadings';
import { VersionState } from './version';
import { MapState } from './map';
import { CurrentUserState } from './currentUser';
import { UnsavedWarningState } from './unsavedWarning';
import { UnitsState } from './units';
import { ConversionsState } from './conversions';
import { OptionsState } from './options';

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
	admin: AdminState;
	version: VersionState;
	currentUser: CurrentUserState;
	unsavedWarning: UnsavedWarningState;
	units: UnitsState;
	conversions: ConversionsState;
	options: OptionsState;
}
