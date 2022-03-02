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

interface SingleSelectProps {
	placeholder: string;
	options: SelectOption[];
	selectedOption?: SelectOption | undefined;
	style?: React.CSSProperties;
	onValueChange(value: SelectOption): void;
}

interface SingleSelectState {
	selectedOption?: SelectOption;
}

export default class SingleSelectComponent extends React.Component<SingleSelectProps, SingleSelectState> {
	constructor(props: SingleSelectProps) {
		super(props);
		this.onValuesChangeInternal = this.onValuesChangeInternal.bind(this);
		this.state = {
			selectedOption: this.props.selectedOption ? this.props.selectedOption : undefined
		};
	}

	public componentDidUpdate(prevProps: SingleSelectProps) {
		if (this.props.selectedOption !== prevProps.selectedOption) {
			this.setState({ selectedOption: this.props.selectedOption });
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

	private onValuesChangeInternal(item: SelectOption) {
		// Defer to the underlying MultiSelect when it has a state change
		// Note that the MSC state selectedOptions is in fact the canonical source of truth
		this.setState({ selectedOption: item });
		this.props.onValueChange(item);
	}
}
