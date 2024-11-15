/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { UncontrolledAlert } from 'reactstrap';
import CompareChartContainer, { CompareEntity } from '../containers/CompareChartContainer';
import { selectGraphAreaNormalization, selectSelectedGroups, selectSelectedMeters, selectSortingOrder } from '../redux/slices/graphSlice';
import { selectGroupDataById } from '../redux/api/groupsApi';
import { selectMeterDataById } from '../redux/api/metersApi';
import { readingsApi } from '../redux/api/readingsApi';
import { useAppSelector } from '../redux/reduxHooks';
import { selectCompareChartQueryArgs } from '../redux/selectors/chartQuerySelectors';
import { SortingOrder } from '../utils/calculateCompare';
import { AreaUnitType } from '../utils/getAreaUnitConversion';
import { selectSelectedLanguage } from '../redux/slices/appStateSlice';
import { LanguageTypes } from 'types/redux/i18n';

/**
 * Component that defines compare chart
 * @returns Multi Compare Chart element
 */
export default function MultiCompareChartComponent() {
	const { meterArgs, groupArgs, meterShouldSkip, groupShouldSkip } = useAppSelector(selectCompareChartQueryArgs);
	const { data: meterReadings = {} } = readingsApi.useCompareQuery(meterArgs, { skip: meterShouldSkip });
	const { data: groupReadings = {} } = readingsApi.useCompareQuery(groupArgs, { skip: groupShouldSkip });

	const areaNormalization = useAppSelector(selectGraphAreaNormalization);
	const sortingOrder = useAppSelector(selectSortingOrder);
	const selectedMeters = useAppSelector(selectSelectedMeters);
	const selectedGroups = useAppSelector(selectSelectedGroups);
	const locale = useAppSelector(selectSelectedLanguage);

	const meterDataByID = useAppSelector(selectMeterDataById);
	const groupDataById = useAppSelector(selectGroupDataById);

	// TODO SEEMS UNUSED, kept due to uncertainty when migrating to RTK VERIFY BEHAVIOR
	const errorEntities: string[] = [];
	let selectedCompareEntities: CompareEntity[] = [];

	// TODO These two blocks for meters & groups could probably be combined.
	Object.entries(meterReadings).forEach(([key, value]) => {
		const name = meterDataByID[Number(key)].name;
		const identifier = meterDataByID[Number(key)].identifier;

		const areaNormValid = (!areaNormalization || (meterDataByID[Number(key)].area > 0 && meterDataByID[Number(key)].areaUnit !== AreaUnitType.none));
		if (areaNormValid && selectedMeters.includes(Number(key))) {
			const change = calculateChange(value.curr_use, value.prev_use);
			const entity: CompareEntity = {
				id: Number(key),
				isGroup: false,
				name,
				identifier,
				change,
				currUsage: value.curr_use,
				prevUsage: value.prev_use
			};
			selectedCompareEntities.push(entity);
		}
	});
	Object.entries(groupReadings).forEach(([key, value]) => {
		const identifier = groupDataById[Number(key)].name;
		const areaNormValid = (!areaNormalization || (groupDataById[Number(key)].area > 0 && groupDataById[Number(key)].areaUnit !== AreaUnitType.none));
		if (areaNormValid && selectedGroups.includes(Number(key))) {
			const change = calculateChange(value.curr_use, value.prev_use);
			const entity: CompareEntity = {
				id: Number(key),
				isGroup: false,
				name: identifier,
				identifier,
				change,
				currUsage: value.curr_use,
				prevUsage: value.prev_use
			};
			selectedCompareEntities.push(entity);
		}
	});

	selectedCompareEntities = sortIDs(selectedCompareEntities, sortingOrder, locale);


	// Compute how much space should be used in the bootstrap grid system
	let size = 3;
	const numSelectedItems = selectedCompareEntities.length;
	if (numSelectedItems < 3) {
		size = numSelectedItems;
	}
	const childClassName = `col-12 col-lg-${12 / size}`;
	const centeredStyle = {
		marginTop: '20%'
	};

	return (
		<div>
			<div className='row'>
				{errorEntities.map(name =>
					<div className='col-12 clearfix' key={name}>
						<UncontrolledAlert color='danger' className='float-right text-right'>
							<FormattedMessage id='insufficient.readings' /> {name}
						</UncontrolledAlert>
					</div>
				)}
			</div>
			<div className='row'>
				{selectedCompareEntities.map(compareEntity =>
					<div className={childClassName} key={compareEntity.id + compareEntity.name}>
						{/* TODO These types of plotly containers expect a lot of passed
						values and it gives a TS error. Given we plan to  replace this
						with the react hooks version and it does not seem to cause any
						issues, this TS error is being suppressed for now.
						eslint-disable-next-line @typescript-eslint/ban-ts-comment
						@ts-ignore */}
						<CompareChartContainer
							key={compareEntity.id + compareEntity.name}
							entity={compareEntity}
						/>
					</div>
				)}
			</div>
			{selectedCompareEntities.length === 0 &&
				<div className='text-center' style={centeredStyle}>
					<FormattedMessage id='select.meter.group' />
				</div>
			}
		</div>
	);
}

/**
 *
 * @param currentPeriodUsage The current usage in the compare period
 * @param usedToThisPointLastTimePeriod The previous usage in the compare period
 * @returns The fraction change in usage where negative means less usage
 */
function calculateChange(currentPeriodUsage: number, usedToThisPointLastTimePeriod: number): number {
	return -1 + (currentPeriodUsage / usedToThisPointLastTimePeriod);
}



/**
 * @param ids An array of items being compared that contain but are more than the id
 * @param sortingOrder The desired order or the comparison items based on change
 * @param locale Current language selected from Redux state
 * @returns An array of items being compared in desired sortingOrder
 */
function sortIDs(ids: CompareEntity[], sortingOrder: SortingOrder, locale: LanguageTypes): CompareEntity[] {
	switch (sortingOrder) {
		case SortingOrder.Alphabetical:
			ids.sort((idA, idB) => idA.identifier.toLowerCase().localeCompare(idB.identifier.toLowerCase(), locale, { sensitivity: 'accent' }));
			break;
		case SortingOrder.Ascending:
			ids.sort((a, b) => {
				if (a.change < b.change) {
					return -1;
				}
				if (a.change > b.change) {
					return 1;
				}
				return 0;
			});
			break;
		case SortingOrder.Descending:
			ids.sort((a, b) => {
				if (a.change > b.change) {
					return -1;
				}
				if (a.change < b.change) {
					return 1;
				}
				return 0;
			});
			break;
		default:
			throw new Error(`Unknown sorting order: ${sortingOrder}`);
	}
	return ids;
}
