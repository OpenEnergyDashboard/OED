/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import ApiBackend from './ApiBackend';
import { User } from '../../types/items';

export default class UsersApi {
    private readonly backend: ApiBackend;

    constructor(backend: ApiBackend){
        this.backend = backend;
    }

    public async getUsers(): Promise<User[]>{
        return await this.backend.doGetRequest<User[]>('/api/users');
    }
}