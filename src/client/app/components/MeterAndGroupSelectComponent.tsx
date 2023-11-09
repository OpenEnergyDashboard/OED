/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import Select, { ActionMeta, MultiValue, StylesConfig } from 'react-select';
import makeAnimated from 'react-select/animated';
import { Badge } from 'reactstrap';
import { graphSlice } from '../reducers/graph';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { selectMeterGroupSelectData } from '../redux/selectors/uiSelectors';
import { useFetchingStates } from '../redux/componentHooks';
import { GroupedOption, SelectOption } from '../types/items';
import { MeterOrGroup } from '../types/redux/graph';
import translate from '../utils/translate';
import TooltipMarkerComponent from './TooltipMarkerComponent';


/**
 * Creates a React-Select component for the UI Options Panel.
 * @param props - Helps differentiate between meter or group options
 * @returns A React-Select component.
 */
export default function MeterAndGroupSelectComponent(props: MeterAndGroupSelectProps) {
	const dispatch = useAppDispatch();
	const meterAndGroupSelectOptions = useAppSelector(selectMeterGroupSelectData);
	const { somethingIsFetching } = useFetchingStates();
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
		dispatch(graphSlice.actions.updateSelectedMetersOrGroups({ newMetersOrGroups, meta }));
	}

	return (
		<div style={divBottomPadding}>
			<p style={labelStyle}>
				{translate(`${meterOrGroup}`)}:
				<TooltipMarkerComponent page='home' helpTextId={`help.home.select.${meterOrGroup}`} />
			</p>
			<Select<SelectOption, true, GroupedOption>
				isMulti
				placeholder={translate(`select.${meterOrGroup}`)}
				options={options}
				value={value}
				onChange={onChange}
				closeMenuOnSelect={false}
				// Customize Labeling for Grouped Labels
				formatGroupLabel={formatGroupLabel}
				// Included React-Select Animations
				components={animatedComponents}
				styles={customStyles}
				isLoading={somethingIsFetching}
			/>
		</div>
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
const divBottomPadding: React.CSSProperties = {
	paddingBottom: '15px'
};
const labelStyle: React.CSSProperties = {
	fontWeight: 'bold',
	margin: 0
};
const animatedComponents = makeAnimated();
const customStyles: StylesConfig<SelectOption, true, GroupedOption> = {
	valueContainer: base => ({
		...base,
		maxHeight: 175,
		overflowY: 'scroll',
		'&::-webkit-scrollbar': {
			display: 'none'
		},
		'msOverflowStyle': 'none',
		'scrollbarWidth': 'none'
	}),
	multiValue: base => ({
		...base
	})

};

