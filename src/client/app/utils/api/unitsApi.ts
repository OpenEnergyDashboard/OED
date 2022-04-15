/*
  * This Source Code Form is subject to the terms of the Mozilla Public
  * License, v. 2.0. If a copy of the MPL was not distributed with this
  * file, You can obtain one at http://mozilla.org/MPL/2.0/.
  */

import ApiBackend from './ApiBackend';
import { UnitData, UnitEditData } from '../../types/redux/units';
import { NamedIDItem } from '../../types/items';
export default class UnitsApi {
	private readonly backend: ApiBackend;

    constructor(backend: ApiBackend){
        this.backend = backend;
    }

    public async details(): Promise<NamedIDItem[]>{
            return await this.backend.doGetRequest<NamedIDItem[]>('/api/units');
    }

	public async edit(unit: UnitData): Promise<{}> {
		return await this.backend.doPostRequest<UnitEditData>(
			'/api/units/edit',
			{ id: unit.id, identifier: unit.identifier, unitRepresent: unit.unitRepresent, secInRate: unit.secInRate}
		);
	}

    public async addUnit(unit: UnitData): Promise<void>{
        return await this.backend.doPostRequest('/api/units/addUnit',unit);
    }

	public async getUnitsDetails(): Promise<UnitData[]> {
		return await this.backend.doGetRequest<UnitData[]>('/api/units');
	}
}