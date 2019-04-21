/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import ApiBackend from './ApiBackend';
import * as moment from 'moment';
import { BarReadings, CompareReadings, LineReadings } from '../../types/readings';
import { NamedIDItem } from '../../types/items';
import { TimeInterval } from '../../../../common/TimeInterval';
import { GroupData, GroupID } from '../../types/redux/groups';

export default class GroupsApi {
	private readonly backend: ApiBackend;

	constructor(backend: ApiBackend) {
		this.backend = backend;
	}

	public async details(): Promise<NamedIDItem[]> {
		return await this.backend.doGetRequest<NamedIDItem[]>('/api/groups');
	}

	public async children(groupID: number): Promise<{meters: number[], groups: number[]}> {
		return await this.backend.doGetRequest<{meters: number[], groups: number[]}>(`api/groups/children/${groupID}`);
	}


	public async lineReadings(groupIDs: number[], timeInterval: TimeInterval): Promise<LineReadings> {
		const stringifiedIDs = groupIDs.join(',');
		return await this.backend.doGetRequest<LineReadings>(
			`/api/readings/line/groups/${stringifiedIDs}`,
			{ timeInterval: timeInterval.toString() }
		);
	}


	public async barReadings(groupIDs: number[], timeInterval: TimeInterval, barDuration: moment.Duration): Promise<BarReadings> {
		const stringifiedIDs = groupIDs.join(',');
		return await this.backend.doGetRequest<BarReadings>(
			`/api/readings/bar/groups/${stringifiedIDs}`,
			{ timeInterval: timeInterval.toString(), barDuration: barDuration.toISOString() }
		);
	}

	public async compareReadings(groupIDs: number[], timeInterval: TimeInterval, shift: moment.Duration):
		Promise<CompareReadings> {
		const stringifiedIDs = groupIDs.join(',');
		const currStart: moment.Moment = timeInterval.getStartTimestamp();
		const currEnd: moment.Moment = timeInterval.getEndTimestamp();
		return await this.backend.doGetRequest<CompareReadings>(
			`/api/compareReadings/group/${stringifiedIDs}`,
			{
				curr_start: currStart.toISOString(),
				curr_end: currEnd.toISOString(),
				shift: shift.toISOString()
			}
		);
	}

	public async create(groupData: GroupData): Promise<void> {
		return await this.backend.doPostRequest<void>('api/groups/create', groupData);
	}

	public async edit(group: GroupData & GroupID): Promise<void> {
		return await this.backend.doPutRequest<void>('api/groups/edit', group);
	}

	public async delete(groupID: number) {
		return await this.backend.doPostRequest('api/groups/delete', {id: groupID});
	}
}
