/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import ApiBackend from './ApiBackend';
import {TimeInterval} from '../../../../common/TimeInterval';
import {CompressedBarReadings, CompressedLineReadings} from '../../types/compressed-readings';

export default class CompressedReadingsApi {
	private readonly backend: ApiBackend;

	constructor(backend: ApiBackend) {
		this.backend = backend;
	}

	public async meterLineReadings(meterIDs: number[], timeInterval: TimeInterval): Promise<CompressedLineReadings> {
		const stringifiedIDs = meterIDs.join(',');
		return await this.backend.doGetRequest<CompressedLineReadings>(
			`/api/compressedReadings/line/meters/${stringifiedIDs}`,
			{ timeInterval: timeInterval.toString() }
		);
	}

	public async groupLineReadings(groupIDs: number[], timeInterval: TimeInterval): Promise<CompressedLineReadings> {
		const stringifiedIDs = groupIDs.join(',');
		return await this.backend.doGetRequest<CompressedLineReadings>(
			`/api/compressedReadings/line/groups/${stringifiedIDs}`,
			{ timeInterval: timeInterval.toString() }
		);
	}

	public async meterBarReadings(meterIDs: number[], timeInterval: TimeInterval, barWidthDays: number): Promise<CompressedBarReadings> {
		const stringifiedIDs = meterIDs.join(',');
		return await this.backend.doGetRequest<CompressedBarReadings>(
			`/api/compressedReadings/bar/meters/${stringifiedIDs}`,
			{ timeInterval: timeInterval.toString(), barWidthDays: barWidthDays.toString() }
		);
	}

	public async groupBarReadings(groupIDs: number[], timeInterval: TimeInterval, barWidthDays: number): Promise<CompressedBarReadings> {
		const stringifiedIDs = groupIDs.join(',');
		return await this.backend.doGetRequest<CompressedBarReadings>(
			`/api/compressedReadings/bar/groups/${stringifiedIDs}`,
			{ timeInterval: timeInterval.toString(), barWidthDays: barWidthDays.toString() }
		);
	}
}
