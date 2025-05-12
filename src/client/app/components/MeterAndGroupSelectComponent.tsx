/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import Select, {
	ActionMeta, MultiValue,
	MultiValueGenericProps, MultiValueProps,
	StylesConfig, components
} from 'react-select';
import makeAnimated from 'react-select/animated';
import ReactTooltip from 'react-tooltip';
import { Badge } from 'reactstrap';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { selectMeterGroupSelectData } from '../redux/selectors/uiSelectors';
import {
	selectChartToRender, selectSelectedUnit, updateSelectedMeters, updateThreeDMeterOrGroupInfo,
	updateSelectedGroups, updateSelectedUnit
} from '../redux/slices/graphSlice';
import { GroupedOption, SelectOption } from '../types/items';
import { ChartTypes, MeterOrGroup } from '../types/redux/graph';
import { useTranslate } from '../redux/componentHooks';
import TooltipMarkerComponent from './TooltipMarkerComponent';
import { selectAnythingFetching } from '../redux/selectors/apiSelectors';
import { labelStyle } from '../styles/modalStyle';

/**
 * Creates a React-Select component for the UI Options Panel.
 * @returns A React-Select component.
 */
export default function MeterAndGroupSelectComponent() {
	const translate = useTranslate();
	const dispatch = useAppDispatch();
	const { meterGroupedOptions, groupsGroupedOptions, allSelectedMeterValues, allSelectedGroupValues } = useAppSelector(selectMeterGroupSelectData);
	const selectedUnit = useAppSelector(selectSelectedUnit);
	const somethingIsFetching = useAppSelector(selectAnythingFetching);

	// Set the current component's appropriate meter or group update from the graphSlice's Payload-Action Creator
	// const value = meterOrGroup === MeterOrGroup.meters ? allSelectedMeterValues : allSelectedGroupValues;

	// Merge meterGroupedOptions and groupsGroupedOptions into a single list with two categories
	const combinedOptions = [
		{
			label: 'Options', // Category name
			options: [
				// Compatible meters with "ᵐ" added to the label
				...meterGroupedOptions.find(group => group.label === 'Meters')?.options.map(option => ({
					...option,
					label: `${option.label}ᴹ`
				})) || [],
				// Compatible groups with "ᶢ" added to the label
				...groupsGroupedOptions.find(group => group.label === 'Options')?.options.map(option => ({
					...option,
					label: `${option.label}ᴳ`
				})) || []
			].sort((a, b) => a.label.localeCompare(b.label)) //Sort alphabetically by label
		},
		{
			label: 'Incompatible Options',
			options: [
				// Incompatible meters with "ᵐ" added to the label
				...meterGroupedOptions.find(group => group.label === 'Incompatible Meters')?.options.map(option => ({
					...option,
					label: `${option.label}ᴹ`
				})) || [],
				// Incompatible groups with "ᶢ" added to the label
				...groupsGroupedOptions.find(group => group.label === 'Incompatible Options')?.options.map(option => ({
					...option,
					label: `${option.label}ᴳ`
				})) || []
			].sort((a, b) => a.label.localeCompare(b.label))
		}
	];
	//Combine the selected values into one array with a type property to differentiate between meters and groups
	const combinedValue = [
		...allSelectedMeterValues.map(value => ({ ...value, meterOrGroup: MeterOrGroup.meters })),
		...allSelectedGroupValues.map(value => ({ ...value, meterOrGroup: MeterOrGroup.groups }))
	];
	// Set the current component's appropriate meter or group SelectOption
	//const options = meterOrGroup === MeterOrGroup.meters ? meterGroupedOptions : groupsGroupedOptions;

	const onChange = (newValues: MultiValue<SelectOption>, meta: ActionMeta<SelectOption>) => {
		const newMeters = newValues.filter(option => option.meterOrGroup === MeterOrGroup.meters).map(option => option.value);
		const newGroups = newValues.filter(option => option.meterOrGroup === MeterOrGroup.groups).map(option => option.value);

		dispatch(updateSelectedMeters(newMeters));
		dispatch(updateSelectedGroups(newGroups));
		console.log(meta);
		const lastAdded = newValues[newValues.length - 1];
		if (lastAdded && selectedUnit === -99 && lastAdded.defaultGraphicUnit) {
			dispatch(updateSelectedUnit(lastAdded.defaultGraphicUnit));
		}

	};

	return (
		<>
			<p style={labelStyle}>
				{translate('data.sources')}:
				<TooltipMarkerComponent page='home' helpTextId={'help.home.select.meters'} />
			</p>
			<Select<SelectOption, true, GroupedOption>
				isMulti
				placeholder={translate('select.meter.group')}
				options={combinedOptions}
				value={combinedValue}
				onChange={onChange}
				closeMenuOnSelect={false}
				// Customize Labeling for Grouped Labels
				formatGroupLabel={formatGroupLabel}
				// Included React-Select Animations
				components={animatedComponents}
				styles={customStyles}
				isLoading={somethingIsFetching}
			/>
		</>
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


const MultiValueLabel = (props: MultiValueGenericProps<SelectOption, true, GroupedOption>) => {
	// Types for makeAnimated are generic, and does not offer completion, so type assert
	const typedProps = props as MultiValueProps<SelectOption, true, GroupedOption>;
	const ref = React.useRef<HTMLDivElement | null>(null);
	// TODO would be nice if relevant message was derived from uiSelectors, which currently only tracks / trims non-compatible ids
	// TODO Add meta data along chain? i.e. disabled due to chart type, area norm... etc. and display relevant message.
	const isDisabled = typedProps.data.isDisabled;
	const dispatch = useAppDispatch();
	const onThreeD = useAppSelector(state => selectChartToRender(state) === ChartTypes.threeD);
	// TODO Verify behavior, and set proper message/ translate
	return (
		< div ref={ref}
			key={`${typedProps.data.value}:${typedProps.data.label}:${typedProps.data.isDisabled}`}
			data-for={isDisabled ? 'home' : 'select-tooltips'}
			data-tip={isDisabled ? 'help.home.area.normalize' : `${props.data.label}`}
			onMouseDown={e => {
				e.stopPropagation();
				ReactTooltip.rebuild();
				ref.current && ReactTooltip.show(ref.current);
				if (onThreeD && !isDisabled) {
					dispatch(
						updateThreeDMeterOrGroupInfo({
							meterOrGroupID: typedProps.data.value,
							meterOrGroup: typedProps.data.meterOrGroup!
						})
					);
				}
			}}
			onClick={e => e.stopPropagation()}
			style={{ overflow: 'hidden' }}
			onMouseEnter={e => {
				if (!isDisabled) {
					const multiValueLabel = e.currentTarget.children[0];
					// display a react tooltip for options that have overflowing/cutoff labels.
					if (multiValueLabel.scrollWidth > e.currentTarget.clientWidth) {
						ref.current && ReactTooltip.show(ref.current);
					}
				}
			}}
			onMouseLeave={() => {
				ref.current && ReactTooltip.hide(ref.current);
			}}
		>
			<components.MultiValueLabel {...props} />
		</div >
	);

};

const animatedComponents = makeAnimated({
	...components,
	MultiValueLabel
});


const customStyles: StylesConfig<SelectOption, true, GroupedOption> = {
	multiValue: (base, props) => ({
		...base,
		backgroundColor: props.data.isDisabled ? 'hsl(0, 0%, 70%)' : base.backgroundColor
	})
};
