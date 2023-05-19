/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import ApiBackend from './ApiBackend';
import { NamedIDItem } from '../../types/items';
import { CompareReadings, RawReadings } from '../../types/readings';
import { TimeInterval } from '../../../../common/TimeInterval';
import { MeterData, MeterEditData } from '../../types/redux/meters';
import * as moment from 'moment';

export default class MetersApi {
	private readonly backend: ApiBackend;

	constructor(backend: ApiBackend) {
		this.backend = backend;
	}

	public async details(): Promise<NamedIDItem[]> {
		return await this.backend.doGetRequest<NamedIDItem[]>('/api/meters');
	}

	public async lineReadingsCount(meterIDs: number[], timeInterval: TimeInterval): Promise<number> {
		const stringifiedIDs = meterIDs.join(',');
		return await this.backend.doGetRequest<number>(
			`/api/readings/line/count/meters/${stringifiedIDs}`,
			{ timeInterval: timeInterval.toString() }
		);
	}

	public async rawLineReadings(meterID: number, timeInterval: TimeInterval): Promise<RawReadings[]> {
		return await this.backend.doGetRequest<RawReadings[]>(
			`/api/readings/line/raw/meter/${meterID}`,
			{ timeInterval: timeInterval.toString() }
		);
	}

	public async edit(meter: MeterData): Promise<MeterEditData> {
		return await this.backend.doPostRequest<MeterEditData>(
			'/api/meters/edit', meter
		);
	}

	public async addMeter(meter: MeterEditData): Promise<MeterEditData> {
		return await this.backend.doPostRequest<MeterEditData>('/api/meters/addMeter', meter);
	}

	public async getMetersDetails(): Promise<MeterData[]> {
		return await this.backend.doGetRequest<MeterData[]>('/api/meters');
	}

	/**
	 * Gets compare readings for meters for the given current time range and a shift for previous time range
	 * @param meterIDs The meter IDs to get readings for
	 * @param timeInterval  start and end of current/this compare period
	 * @param shift how far to shift back in time from current period to previous period
	 * @param unitId The unit id that the reading should be returned in, i.e., the graphic unit
	 * @return {Promise<object<int, array<{reading_rate: number, start_timestamp: }>>>}
	 */
	public async meterCompareReadings(meterIDs: number[], timeInterval: TimeInterval, shift: moment.Duration,
		unitID: number): Promise<CompareReadings> {
		const stringifiedIDs = meterIDs.join(',');
		const currStart: moment.Moment = timeInterval.getStartTimestamp();
		const currEnd: moment.Moment = timeInterval.getEndTimestamp();
		return await this.backend.doGetRequest<CompareReadings>(
			`/api/compareReadings/meters/${stringifiedIDs}`,
			{
				curr_start: currStart.toISOString(),
				curr_end: currEnd.toISOString(),
				shift: shift.toISOString(),
				graphicUnitId: unitID.toString()
			}
		);
	}
}
