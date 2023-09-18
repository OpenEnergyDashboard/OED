import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
const baseHref = (document.getElementsByTagName('base')[0] || {}).href;

export const baseApi = createApi({
	reducerPath: 'api',
	baseQuery: fetchBaseQuery({ baseUrl: baseHref }),
	// Initially no defined endpoints, Use rtk query's injectEndpoints
	endpoints: () => ({})
})