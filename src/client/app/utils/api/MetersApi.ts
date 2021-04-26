/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import ApiBackend from './ApiBackend';
import { NamedIDItem } from '../../types/items';
import { BarReadings, CompareReadings, LineReadings, RawReadings } from '../../types/readings';
import { TimeInterval } from '../../../../common/TimeInterval';
import { MeterMetadata, MeterEditData } from '../../types/redux/meters';
import * as moment from 'moment';

export default class MetersApi {
	private readonly backend: ApiBackend;

	constructor(backend: ApiBackend) {
		this.backend = backend;
	}

	public async details(): Promise<NamedIDItem[]> {
		return await this.backend.doGetRequest<NamedIDItem[]>('/api/meters');
	}

	public async lineReadingsCount(meterIDs:number[], timeInterval: TimeInterval):Promise<number> {
		const stringifiedIDs = meterIDs.join(',');
		return await this.backend.doGetRequest<number>(
			`/api/readings/line/count/meters/${stringifiedIDs}`,
			{ timeInterval: timeInterval.toString() }
		);
	}

	public async lineReadings(meterIDs: number[], timeInterval: TimeInterval): Promise<LineReadings> {
		const stringifiedIDs = meterIDs.join(',');
		return await this.backend.doGetRequest<LineReadings>(
			`/api/readings/line/meters/${stringifiedIDs}`,
			{ timeInterval: timeInterval.toString() }
		);
	}

	public async rawLineReadings(meterIDs: number[], timeInterval: TimeInterval): Promise<RawReadings[]> {
		const stringifiedIDs = meterIDs.join(',');
		return await this.backend.doGetRequest<RawReadings[]>(
			`/api/readings/line/raw/meters/${stringifiedIDs}`,
			{ timeInterval: timeInterval.toString() }
		);
	}

	public async barReadings(meterIDs: number[], timeInterval: TimeInterval, barDuration: moment.Duration): Promise<BarReadings> {
		const stringifiedIDs = meterIDs.join(',');
		return await this.backend.doGetRequest<BarReadings>(
			`/api/readings/bar/meters/${stringifiedIDs}`,
			{ timeInterval: timeInterval.toString(), barDuration: barDuration.toISOString() }
		);
	}

	public async edit(meter: MeterMetadata): Promise<{}> {
		return await this.backend.doPostRequest<MeterEditData>(
			'/api/meters/edit',
			{ id: meter.id, identifier: meter.identifier, enabled: meter.enabled, displayable: meter.displayable, timeZone: meter.timeZone, gps: meter.gps }
		);
	}

	public async compareReadings(meterIDs: number[], timeInterval: TimeInterval, shift: moment.Duration):
		Promise<CompareReadings> {
		const stringifiedIDs = meterIDs.join(',');
		const currStart: moment.Moment = timeInterval.getStartTimestamp();
		const currEnd: moment.Moment = timeInterval.getEndTimestamp();
		return await this.backend.doGetRequest<CompareReadings>(
			`/api/compareReadings/meters/${stringifiedIDs}`,
			{
				curr_start: currStart.toISOString(),
				curr_end: currEnd.toISOString(),
				shift: shift.toISOString()
			}
		);
	}
}
