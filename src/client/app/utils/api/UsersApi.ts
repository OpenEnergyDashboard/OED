/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import ApiBackend from './ApiBackend';
import { User, UserRole } from '../../types/items';
import { hasPermissions } from '../../utils/hasPermissions';

interface NewUser extends User {
	password: string;
}

export default class UsersApi {
	private readonly backend: ApiBackend;

	constructor(backend: ApiBackend) {
		this.backend = backend;
	}

	public async getCurrentUser(): Promise<User> {
		return await this.backend.doGetRequest<User>('/api/users/token');
	};

	public async hasRolePermissions(role: UserRole): Promise<boolean> {
		try {
			const user = await this.getCurrentUser();
			return hasPermissions(user.role, role);
		} catch (error) {
			return false;
		}
	};

	public async getUsers(): Promise<User[]> {
		return await this.backend.doGetRequest<User[]>('/api/users');
	}

	public async createUser(user: NewUser): Promise<void> {
		return await this.backend.doPostRequest('/api/users/create', user);
	}

	public async editUsers(users: User[]) {
		return await this.backend.doPostRequest('/api/users/edit', { users });
	}

	public async deleteUser(email: string) {
		return await this.backend.doPostRequest('/api/users/delete', { email });
	}
}