/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { AppDispatch, RootState } from '../../store';

export const createAppThunk = createAsyncThunk.withTypes<{
	state: RootState;
	dispatch: AppDispatch;
}>();
