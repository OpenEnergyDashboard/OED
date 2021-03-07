/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import ApiBackend from './ApiBackend';
import { User } from '../../types/items';

interface NewUser extends User {
	password: string;
}
export default class UsersApi {
	private readonly backend: ApiBackend;

	constructor(backend: ApiBackend) {
		this.backend = backend;
	}

	public async getUsers(): Promise<User[]> {
		return await this.backend.doGetRequest<User[]>('/api/users');
	}

	public async createUser(user: NewUser): Promise<void> {
		return await this.backend.doPostRequest('/api/users', user);
	}

	public async editUsers(users: User[]) {
		return await this.backend.doPostRequest('/api/users/edit', { users });
	}

	public async deleteUser(email: string) {
		return await this.backend.doPostRequest('/api/users/delete', { email });
	}
}