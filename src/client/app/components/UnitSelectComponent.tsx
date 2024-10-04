/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import Select from 'react-select';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { selectUnitSelectData } from '../redux/selectors/uiSelectors';
import { GroupedOption, SelectOption } from '../types/items';
// import TooltipMarkerComponent from './TooltipMarkerComponent';
// import { FormattedMessage } from 'react-intl';
import { Badge } from 'reactstrap';
import { graphSlice, selectSelectedUnit } from '../redux/slices/graphSlice';
import { useTranslate } from '../redux/componentHooks';
import TooltipMarkerComponent from './TooltipMarkerComponent';
import { selectUnitDataById, unitsApi } from '../redux/api/unitsApi';

/**
 * @returns A React-Select component for UI Options Panel
 */
export default function UnitSelectComponent() {
	const translate = useTranslate();
	const dispatch = useAppDispatch();
	const unitSelectOptions = useAppSelector(selectUnitSelectData);
	const selectedUnitID = useAppSelector(selectSelectedUnit);
	const unitsByID = useAppSelector(selectUnitDataById);

	const { isFetching: unitsIsFetching } = unitsApi.endpoints.getUnitsDetails.useQueryState();
	let selectedUnitOption: SelectOption | null = null;

	// Only use if valid/selected unit which means it is not -99.
	if (selectedUnitID !== -99) {
		selectedUnitOption = {
			// Units use the identifier to display.
			label: unitsByID[selectedUnitID]?.identifier,
			value: selectedUnitID,
			isDisabled: false
		} as SelectOption;
	}

	const onChange = (newValue: SelectOption) => dispatch(graphSlice.actions.updateSelectedUnit(newValue?.value));

	return (
		<div style={divBottomPadding}>
			<p style={labelStyle}>
				{translate('units')}
				<TooltipMarkerComponent page='home' helpTextId='help.home.select.units' />
			</p>
			<Select<SelectOption, false, GroupedOption>
				value={selectedUnitOption}
				options={unitSelectOptions}
				placeholder={translate('select.unit')}
				onChange={onChange}
				formatGroupLabel={formatGroupLabel}
				isClearable
				isLoading={unitsIsFetching}
			/>
		</div>
	);
}
const groupStyles: React.CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between'
};

const formatGroupLabel = (data: GroupedOption) => {
	return (
		< div style={groupStyles} >
			<span>{data.label}</span>
			<Badge pill color="primary">{data.options.length}</Badge>
		</div >

	);
};

const divBottomPadding: React.CSSProperties = {
	paddingBottom: '15px'
};
const labelStyle: React.CSSProperties = {
	fontWeight: 'bold',
	margin: 0
};
