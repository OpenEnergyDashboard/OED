import ApiBackend from "./ApiBackend";
import {UnitData} from '../../types/redux/unit'


export default class UnitsApi {
    private readonly backend: ApiBackend;

    constructor(backend: ApiBackend){
        this.backend = backend;
    }

    public async details(): Promise<UnitData[]>{
            return await this.backend.doGetRequest<UnitData[]>('/api/units/');
    }

    public async edit(unit: UnitData): Promise<{}> {
		return await this.backend.doPostRequest<UnitData>(
			'/api/unit/edit',
			{ id: unit.id, identifier: unit.identifier, displayable: unit.displayable }
		);
	}
}