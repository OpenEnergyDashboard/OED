/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

//connecting the front end and back end
import ApiBackend from './ApiBackend';
import {Conversion, ConversionBidirectional} from '../../types/items'

export default class ConversionsApi {

	private readonly backend: ApiBackend;

	constructor(backend: ApiBackend) {
		this.backend = backend;
	}
    public async getAll(): Promise<Conversion []> {
		return await this.backend.doGetRequest<Conversion[]>('/api/conversions');
	};
	public async getSource(sourceId: string, destinationId: string): Promise<Conversion> {
		return await this.backend.doGetRequest<Conversion>("/api/conversions/:sourceId&:destinationId",{sourceId, destinationId} );
	};
	public async deleteConversion(sourceId: string, destinationId: string)
	{
		return await this.backend.doPostRequest('/api/conversions/delete', {sourceId, destinationId})
	};
	public async editConversion(sourceId:string, destinationId: string, bidirectional:ConversionBidirectional, slope:number, intercept:number, note:string):Promise<Conversion>
	{
		return await this.backend.doPostRequest<Conversion>('/api/conversions/edit',{sourceId,destinationId,bidirectional,slope,intercept,note})
	}
	public async createConversion(sourceId:string, destinationId: string, bidirectional:ConversionBidirectional, slope:number, intercept:number, note:string):Promise<Conversion>
	{
		return await this.backend.doPostRequest<Conversion>('/api/conversions/create', {sourceId,destinationId,bidirectional,slope,intercept,note})
	}

}