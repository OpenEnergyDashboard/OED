import { ConversionData } from '../../types/redux/conversions';
import { baseApi } from './baseApi';

export const conversionsApi = baseApi.injectEndpoints({
	endpoints: builder => ({
		getConversionsDetails: builder.query<ConversionData[], void>({
			query: () => 'api/conversions'
		}),
		addConversion: builder.query<void, ConversionData>({
			query: conversion => ({
				url: 'api/conversions/addConversion',
				method: 'POST',
				body: { conversion }
			}),
			onQueryStarted: async (arg, api) => {
				await api.queryFulfilled.
					then(() => {
						{
							api.dispatch(
								conversionsApi.endpoints.refresh.initiate({
									redoCik: false,
									refreshReadingViews: false
								}))
						}
					})

			}
		}),
		deleteConversion: builder.query<void, ConversionData>({
			query: conversion => ({
				url: 'api/conversions/delete',
				method: 'POST',
				body: { conversion }
			})
		}),
		editConversion: builder.query<void, ConversionData>({
			query: conversion => ({
				url: 'api/conversions/edit',
				method: 'POST',
				body: { ...conversion }
			})
		}),
		getConversionArray: builder.query<boolean[][], void>({
			query: () => 'api/conversion-array'
		}),
		refresh: builder.mutation<void, { redoCik: boolean, refreshReadingViews: boolean }>({
			query: args => ({
				url: 'api/conversion-array/refresh',
				method: 'POST',
				body: { redoCik: args.redoCik, refreshReadingViews: args.refreshReadingViews },
				responseHandler: 'text'
			})
		})
	})
})

export const selectPIK = conversionsApi.endpoints.getConversionArray.select()
export const selectConversionsDetails = conversionsApi.endpoints.getConversionsDetails.select()