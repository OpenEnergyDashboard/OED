import { buildCreateSlice, asyncThunkCreator } from '@reduxjs/toolkit'

export const createThunkSlice = buildCreateSlice({
	creators: { asyncThunk: asyncThunkCreator }
})