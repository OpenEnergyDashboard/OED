/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { getToken, hasToken } from '../token';
const baseHref = (document.getElementsByTagName('base')[0] || {}).href;
/**
 * Handles the actual sending and receiving of network requests.
 *
 * Should only be used by other api classes.
 */
export default class ApiBackend {
	public async doGetRequest<R>(
		url: string,
		params: { [key: string]: string } = {},
		headers: { [key: string]: string } = {},
		extraConfig: AxiosRequestConfig = {}
	): Promise<R> {
		const response: AxiosResponse = await axios.get(url, this.buildConfig(params, headers, extraConfig));
		return response.data as R;
	}

	public async doPutRequest<R>(
		url: string,
		body: any,
		params: { [key: string]: string } = {},
		headers: { [key: string]: string } = {},
		extraConfig: AxiosRequestConfig = {}
	): Promise<R> {
		const response: AxiosResponse = await axios.put(url, body, this.buildConfig(params, headers, extraConfig));
		return response.data as R;
	}

	public async doPostRequest<R>(
		url: string,
		body: any,
		params: { [key: string]: string } = {},
		headers: { [key: string]: string } = {},
		extraConfig: AxiosRequestConfig = {}
	): Promise<R> {
		const response: AxiosResponse = await axios.post(url, body, this.buildConfig(params, headers, extraConfig));
		return response.data as R;
	}

	private buildConfig(
		params: { [key: string]: string},
		headers: { [key: string]: string},
		extraConfig: AxiosRequestConfig
	): AxiosRequestConfig {
		if (hasToken()) {
			return {
				params,
				headers: {token: getToken(), ...headers},
				baseURL: baseHref,
				...extraConfig
			};
		} else {
			return {
				params,
				headers,
				baseURL: baseHref,
				...extraConfig
			};
		}

	}
}
