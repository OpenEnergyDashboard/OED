/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import _ from 'lodash';
import ApiBackend from './ApiBackend';
import { TimeInterval } from '../../../../common/TimeInterval';
import { BarReadings, LineReading, LineReadings } from '../../types/readings';

export default class ReadingsApi {
	private readonly backend: ApiBackend;

	constructor(backend: ApiBackend) {
		this.backend = backend;
	}

	/**
	 * Gets line readings for meters for the given time range
	 * @param meterIDs The meter IDs to get readings for
	 * @param timeInterval The range of time to get readings for
	 * @param unitID The unit id that the reading should be returned in, i.e., the graphic unit
	 * @returns lineReadings in sorted order
	 */
	public async meterLineReadings(meterIDs: number[], timeInterval: TimeInterval, unitID: number): Promise<LineReadings> {
		const stringifiedIDs = meterIDs.join(',');
		const readings = await this.backend.doGetRequest<LineReadings>(
			`/api/unitReadings/line/meters/${stringifiedIDs}`,
			{ timeInterval: timeInterval.toString(), graphicUnitId: unitID.toString() }
		);
		// Ensure everything is sorted
		_.values(readings)
			.forEach((value: LineReading[]) => value.sort((a, b) => a.startTimestamp - b.startTimestamp));
		return readings;
	}

	/**
	 * Gets line readings for groups for the given time range
	 * @param groupIDs The group IDs to get readings for
	 * @param timeInterval The range of time to get readings for
	 * @param unitID The unit id that the reading should be returned in, i.e., the graphic unit
	 * @returns LineReadings in sorted order
	 */
	public async groupLineReadings(groupIDs: number[], timeInterval: TimeInterval, unitID: number): Promise<LineReadings> {
		const stringifiedIDs = groupIDs.join(',');
		const readings = await this.backend.doGetRequest<LineReadings>(
			`/api/unitReadings/line/groups/${stringifiedIDs}`,
			{ timeInterval: timeInterval.toString(), graphicUnitId: unitID.toString() }
		);
		// Ensure everything is sorted
		_.values(readings)
			.forEach((value: LineReading[]) => value.sort((a, b) => a.startTimestamp - b.startTimestamp));
		return readings;
	}

	/**
	 * Gets bar readings for meters for the given time range
	 * @param meterIDs The meter IDs to get readings for
	 * @param timeInterval The range of time to get readings for
	 * @param barWidthDays The width of the bar in days
	 * @param unitID The unit id that the reading should be returned in, i.e., the graphic unit
	 * @returns BarReadings in sorted order
	 */
	public async meterBarReadings(meterIDs: number[], timeInterval: TimeInterval, barWidthDays: number, unitID: number): Promise<BarReadings> {
		const stringifiedIDs = meterIDs.join(',');
		return await this.backend.doGetRequest<BarReadings>(
			`/api/unitReadings/bar/meters/${stringifiedIDs}`,
			{ timeInterval: timeInterval.toString(), barWidthDays: barWidthDays.toString(), graphicUnitId: unitID.toString() }
		);
	}

	/**
	 * Gets bar readings for groups for the given time range
	 * @param groupIDs The group IDs to get readings for
	 * @param timeInterval The range of time to get readings for
	 * @param barWidthDays The width of the bar in days
	 * @param unitID The unit id that the reading should be returned in, i.e., the graphic unit
	 * @returns BarReadings in sorted order
	 */
	public async groupBarReadings(groupIDs: number[], timeInterval: TimeInterval, barWidthDays: number, unitID: number): Promise<BarReadings> {
		const stringifiedIDs = groupIDs.join(',');
		return await this.backend.doGetRequest<BarReadings>(
			`/api/unitReadings/bar/groups/${stringifiedIDs}`,
			{ timeInterval: timeInterval.toString(), barWidthDays: barWidthDays.toString(), graphicUnitId: unitID.toString() }
		);
	}
}