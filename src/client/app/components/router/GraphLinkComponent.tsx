/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { PayloadAction } from '@reduxjs/toolkit';
import InitializingComponent from '../router/InitializingComponent';
import moment from 'moment';
import * as React from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { graphSlice } from '../../redux/slices/graphSlice';
import { useWaitForInit } from '../../redux/componentHooks';
import { useAppDispatch } from '../../redux/reduxHooks';
import { validateComparePeriod, validateSortingOrder } from '../../utils/calculateCompare';
import { AreaUnitType } from '../../utils/getAreaUnitConversion';
import { showErrorNotification } from '../../utils/notifications';
import translate from '../../utils/translate';
import { TimeInterval } from '../../../../common/TimeInterval';
import { ChartTypes, LineGraphRate, MeterOrGroup } from '../../types/redux/graph';
import { changeSelectedMap } from '../../redux/actions/map';
import { appStateSlice } from '../../redux/slices/appStateSlice';

export const GraphLink = () => {
	const dispatch = useAppDispatch();
	const [URLSearchParams] = useSearchParams();
	const { initComplete } = useWaitForInit();
	const dispatchQueue: PayloadAction<any>[] = [];

	if (!initComplete) {
		return <InitializingComponent />
	}

	try {
		URLSearchParams.forEach((value, key) => {
			// TODO Needs to be refactored into a single dispatch/reducer pair.
			// It is a best practice to reduce the number of dispatch calls, so this logic should be converted into a single reducer for the graphSlice
			// TODO validation could be implemented across all cases similar to compare period and sorting order
			switch (key) {
				case 'areaNormalization':
					dispatchQueue.push(graphSlice.actions.setAreaNormalization(value === 'true'))
					break;
				case 'areaUnit':
					dispatchQueue.push(graphSlice.actions.updateSelectedAreaUnit(value as AreaUnitType))
					break;
				case 'barDuration':
					dispatchQueue.push(graphSlice.actions.updateBarDuration(moment.duration(parseInt(value), 'days')))
					break;
				case 'barStacking':
					dispatchQueue.push(graphSlice.actions.setBarStacking(Boolean(value)))
					break;
				case 'chartType':
					dispatchQueue.push(graphSlice.actions.changeChartToRender(value as ChartTypes))
					break;
				case 'comparePeriod':
					dispatchQueue.push(graphSlice.actions.updateComparePeriod({ comparePeriod: validateComparePeriod(value), currentTime: moment() }))
					break;
				case 'compareSortingOrder':
					dispatchQueue.push(graphSlice.actions.changeCompareSortingOrder(validateSortingOrder(value)))
					break;
				case 'groupIDs':
					dispatchQueue.push(graphSlice.actions.updateSelectedGroups(value.split(',').map(s => parseInt(s))))
					break;
				case 'mapID':
					// 'TODO, Verify Behavior & FIXME! MapLink not working as expected
					dispatch(changeSelectedMap(parseInt(value)))
					break;
				case 'meterIDs':
					dispatchQueue.push(graphSlice.actions.updateSelectedMeters(value.split(',').map(s => parseInt(s))))
					break;
				case 'meterOrGroup':
					dispatchQueue.push(graphSlice.actions.updateThreeDMeterOrGroup(value as MeterOrGroup));
					break;
				case 'meterOrGroupID':
					dispatchQueue.push(graphSlice.actions.updateThreeDMeterOrGroupID(parseInt(value)));
					break;
				case 'minMax':
					dispatchQueue.push(graphSlice.actions.setShowMinMax(value === 'true' ? true : false))
					break;
				case 'optionsVisibility':
					dispatchQueue.push(appStateSlice.actions.setOptionsVisibility(value === 'true' ? true : false))
					break;
				case 'rate':
					{
						const params = value.split(',');
						const rate = { label: params[0], rate: parseFloat(params[1]) } as LineGraphRate;
						dispatchQueue.push(graphSlice.actions.updateLineGraphRate(rate))
					}
					break;
				case 'readingInterval':
					dispatchQueue.push(graphSlice.actions.updateThreeDReadingInterval(parseInt(value)));
					break;
				case 'serverRange':
					dispatchQueue.push(graphSlice.actions.updateTimeInterval(TimeInterval.fromString(value)));
					/**
					 * commented out since days from present feature is not currently used
					 */
					// const index = info.indexOf('dfp');
					// if (index === -1) {
					// 	options.serverRange = TimeInterval.fromString(info);
					// } else {
					// 	const message = info.substring(0, index);
					// 	const stringField = this.getNewIntervalFromMessage(message);
					// 	options.serverRange = TimeInterval.fromString(stringField);
					// }
					break;
				case 'sliderRange':
					dispatchQueue.push(graphSlice.actions.changeSliderRange(TimeInterval.fromString(value)));
					break;
				case 'unitID':
					dispatchQueue.push(graphSlice.actions.updateSelectedUnit(parseInt(value)))
					break;
				default:
					throw new Error('Unknown query parameter');
			}
		})

		dispatchQueue.forEach(dispatch)
	} catch (err) {
		showErrorNotification(translate('failed.to.link.graph'));
	}
	// All appropriate state updates should've been executed
	// redirect to root and clear the link in the search bar
	return <Navigate to='/' replace />
}
