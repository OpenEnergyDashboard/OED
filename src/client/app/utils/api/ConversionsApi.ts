/*
  * This Source Code Form is subject to the terms of the Mozilla Public
  * License, v. 2.0. If a copy of the MPL was not distributed with this
  * file, You can obtain one at http://mozilla.org/MPL/2.0/.
  */

import ApiBackend from './ApiBackend';
import { ConversionData, ConversionEditData } from '../../types/redux/conversions';
import { NamedIDItem } from '../../types/items';
export default class ConversionsApi {
	private readonly backend: ApiBackend;

	constructor(backend: ApiBackend) {
		this.backend = backend;
	}

	public async edit(conversion: ConversionData): Promise<ConversionEditData> {
		return await this.backend.doPostRequest<ConversionEditData>(
			'/api/conversions/edit',
			{
				sourceId: conversion.sourceId, destinationId: conversion.destinationId, bidirectional: conversion.bidirectional,
				slope: conversion.slope, intercept: conversion.intercept, note: conversion.note
			}
		);
	}

	public async delete(conversion: ConversionData): Promise<void> {
		return await this.backend.doPostRequest<void>('/api/conversions/delete', conversion);
	}

	public async addConversion(conversion: ConversionData): Promise<void> {
		return await this.backend.doPostRequest('/api/conversions/addConversion', conversion);
	}

	public async getConversionsDetails(): Promise<ConversionData[]> {
		return await this.backend.doGetRequest<ConversionData[]>('/api/conversions');
	}
}
