/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import ApiBackend from './ApiBackend';
import {MapData} from "../../types/redux/map";

export default class MapsApi {
	private readonly backend: ApiBackend;

	constructor(backend: ApiBackend) {
		this.backend = backend;
	}

	public async details(): Promise<MapData[]> {
		return await this.backend.doGetRequest<MapData[]>('/api/maps/');
	}

	public async create(mapData: MapData): Promise<void> {
		return await this.backend.doPostRequest<void>('/api/maps/create', mapData);
	}

	public async edit(mapData: MapData): Promise<{}> {
		return await this.backend.doPostRequest<MapData>('/api/maps/edit', mapData);
	}

	public async getMapById(id: number): Promise<MapData> {
		return await this.backend.doGetRequest<MapData>(`/api/maps/${id}`);
	}

	public async getMapByName(name: string): Promise<MapData> {
		return await this.backend.doGetRequest<MapData>('/api/maps/getByName', {'name':name});
	}
}
