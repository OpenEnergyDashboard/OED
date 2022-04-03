/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import * as _ from 'lodash';
import ApiBackend from './ApiBackend';
import {TimeInterval} from '../../../../common/TimeInterval';
import {CompressedBarReadings, CompressedLineReading, LineReadings} from '../../types/readings';

export default class ReadingsApi {
	private readonly backend: ApiBackend;

	constructor(backend: ApiBackend) {
		this.backend = backend;
	}

	public async meterLineReadings(meterIDs: number[], timeInterval: TimeInterval, unitID: number): Promise<LineReadings> {
		const stringifiedIDs = meterIDs.join(',');
		const readings = await this.backend.doGetRequest<LineReadings>(
			`/api/unitReadings/line/meters/${stringifiedIDs}`,
			{ timeInterval: timeInterval.toString(), graphicUnitId: unitID.toString() }
		);
		// Ensure everything is sorted
		_.values(readings)
			.forEach( (value: CompressedLineReading[]) => value.sort((a, b) => a.startTimestamp - b.startTimestamp));
		return readings;
	}

	public async groupLineReadings(groupIDs: number[], timeInterval: TimeInterval, unitID: number): Promise<LineReadings> {
		const stringifiedIDs = groupIDs.join(',');
		const readings = await this.backend.doGetRequest<LineReadings>(
			`/api/unitReadings/line/groups/${stringifiedIDs}`,
			{ timeInterval: timeInterval.toString(), graphicUnitId: unitID.toString() }
		);
		// Ensure everything is sorted
		_.values(readings)
			.forEach( (value: CompressedLineReading[]) => value.sort((a, b) => a.startTimestamp - b.startTimestamp));
		return readings;
	}

	public async meterBarReadings(meterIDs: number[], timeInterval: TimeInterval, barWidthDays: number): Promise<CompressedBarReadings> {
		const stringifiedIDs = meterIDs.join(',');
		return await this.backend.doGetRequest<CompressedBarReadings>(
			`/api/unitReadings/bar/meters/${stringifiedIDs}`,
			{ timeInterval: timeInterval.toString(), barWidthDays: barWidthDays.toString() }
		);
	}

	public async groupBarReadings(groupIDs: number[], timeInterval: TimeInterval, barWidthDays: number): Promise<CompressedBarReadings> {
		const stringifiedIDs = groupIDs.join(',');
		return await this.backend.doGetRequest<CompressedBarReadings>(
			`/api/unitReadings/bar/groups/${stringifiedIDs}`,
			{ timeInterval: timeInterval.toString(), barWidthDays: barWidthDays.toString() }
		);
	}
}
