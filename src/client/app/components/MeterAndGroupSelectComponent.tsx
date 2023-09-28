/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import Select, { ActionMeta, MultiValue } from 'react-select';
import makeAnimated from 'react-select/animated';
import { Badge } from 'reactstrap';
import { GroupedOption, SelectOption } from 'types/items';
import { graphSlice } from '../reducers/graph';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { selectMeterGroupSelectData } from '../redux/selectors/uiSelectors';
import { MeterOrGroup } from '../types/redux/graph';
import translate from '../utils/translate';

const animatedComponents = makeAnimated();

/**
 * Creates a React-Select component for the UI Options Panel.
 * @param props - Helps differentiate between meter or group options
 * @returns A React-Select component.
 */
export default function MeterAndGroupSelectComponent(props: MeterAndGroupSelectProps) {
	const dispatch = useAppDispatch();
	const meterAndGroupSelectOptions = useAppSelector(state => selectMeterGroupSelectData(state));
	const { meterOrGroup } = props;

	// Set the current component's appropriate meter or group update from the graphSlice's Payload-Action Creator

	const value = meterOrGroup === MeterOrGroup.meters ?
		meterAndGroupSelectOptions.selectedMeterValues
		:
		meterAndGroupSelectOptions.selectedGroupValues

	// Set the current component's appropriate meter or group SelectOption
	const options = meterOrGroup === MeterOrGroup.meters ?
		meterAndGroupSelectOptions.meterGroupedOptions
		:
		meterAndGroupSelectOptions.groupsGroupedOptions

	const onChange = (newValues: MultiValue<SelectOption>, meta: ActionMeta<SelectOption>) => {
		const newMetersOrGroups = newValues.map((option: SelectOption) => option.value);
		dispatch(graphSlice.actions.updateSelectedMetersOrGroups({ newMetersOrGroups, meta }))
	}

	return (
		<Select<SelectOption, true, GroupedOption>
			isMulti
			placeholder={meterOrGroup === MeterOrGroup.meters ? translate('select.meters') : translate('select.groups')}
			options={options}
			value={value}
			onChange={onChange}
			closeMenuOnSelect={false}
			// Customize Labeling for Grouped Labels
			formatGroupLabel={formatGroupLabel}
			// Included React-Select Animations
			components={animatedComponents}
		/>
	)
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

	)
}

interface MeterAndGroupSelectProps {
	meterOrGroup: MeterOrGroup;
}
