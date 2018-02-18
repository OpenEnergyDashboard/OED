/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import * as React from 'react';
import Select from 'react-select';
import 'react-select/dist/react-select.css';
import { SelectOption } from '../types/items';
import '../styles/react-select-css.css';

interface SingleSelectProps<I> {
	placeholder: string;
	options: Array<SelectOption & I>;
	selectedOption?: SelectOption & I | null;
	style?: React.CSSProperties;
	onValueChange(value: SelectOption & I): void;
}

interface MultiSelectState {
	selectedOption?: SelectOption;
}

export default class MultiSelectComponent<I> extends React.Component<SingleSelectProps<I>, MultiSelectState> {
	constructor(props: SingleSelectProps<I>) {
		super(props);
		this.onValuesChangeInternal = this.onValuesChangeInternal.bind(this);
		// selectedOptions holds a list of the options that have been selected
		this.state = {
			selectedOption: this.props.selectedOption ? this.props.selectedOption : undefined
		};
	}

	public componentWillReceiveProps(nextProps: SingleSelectProps<I>) {
		if (nextProps.selectedOption) {
			this.setState({ selectedOption: nextProps.selectedOption });
		}
	}

	public render() {
		return (
			<Select
				options={this.props.options}
				value={this.state.selectedOption}
				placeholder={this.props.placeholder}
				style={this.props.style}
				onChange={this.onValuesChangeInternal}
				clearable={false}
				closeOnSelect={false}
			/>
		);
	}

	private onValuesChangeInternal(item: SelectOption & I) {
		// Defer to the underlying MultiSelect when it has a state change
		// Note that the MSC state selectedOptions is in fact the canonical source of truth
		this.setState({ selectedOption: item });
		this.props.onValueChange(item);
	}
}
