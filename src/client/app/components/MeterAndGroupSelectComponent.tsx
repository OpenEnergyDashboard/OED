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
import { selectChartToRender, updateSelectedMetersOrGroups, updateThreeDMeterOrGroupInfo } from '../redux/slices/graphSlice';
import { GroupedOption, SelectOption } from '../types/items';
import { ChartTypes, MeterOrGroup } from '../types/redux/graph';
import { useTranslate } from '../redux/componentHooks';
import TooltipMarkerComponent from './TooltipMarkerComponent';
import { selectAnythingFetching } from '../redux/selectors/apiSelectors';
/**
 * Creates a React-Select component for the UI Options Panel.
 * @param props - Helps differentiate between meter or group options
 * @returns A React-Select component.
 */
export default function MeterAndGroupSelectComponent(props: MeterAndGroupSelectProps) {
	const translate = useTranslate();
	const dispatch = useAppDispatch();
	const { meterGroupedOptions, groupsGroupedOptions, allSelectedMeterValues, allSelectedGroupValues } = useAppSelector(selectMeterGroupSelectData);
	const somethingIsFetching = useAppSelector(selectAnythingFetching);
	const { meterOrGroup } = props;
	// Set the current component's appropriate meter or group update from the graphSlice's Payload-Action Creator
	const value = meterOrGroup === MeterOrGroup.meters ? allSelectedMeterValues : allSelectedGroupValues;

	// Set the current component's appropriate meter or group SelectOption
	const options = meterOrGroup === MeterOrGroup.meters ? meterGroupedOptions : groupsGroupedOptions;

	const onChange = (newValues: MultiValue<SelectOption>, meta: ActionMeta<SelectOption>) => {
		const newMetersOrGroups = newValues.map(option => option.value);
		dispatch(updateSelectedMetersOrGroups({ newMetersOrGroups, meta }));
	};

	return (
		<>
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

interface MeterAndGroupSelectProps {
	meterOrGroup: MeterOrGroup;
}

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

const labelStyle: React.CSSProperties = {
	fontWeight: 'bold',
	margin: 0
};
