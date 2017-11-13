/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as PropTypes from 'prop-types';
import * as React from 'react';
import Select from 'react-select';
import 'react-select/dist/react-select.css';
import { SelectOption } from '../utils/types';
import '../styles/react-select-css.css';

interface MultiSelectProps {
	placeholder: string;
	options: SelectOption[];
	selectedOptions: SelectOption[] | null;
	style?: React.CSSProperties;
	onValuesChange(values: SelectOption[]): void;
}

interface MultiSelectState {
	selectedOptions: SelectOption[];
}

export default class MultiSelectComponent extends React.Component<MultiSelectProps, MultiSelectState> {
	constructor(props) {
		super(props);
		this.onValuesChangeInternal = this.onValuesChangeInternal.bind(this);
		// selectedOptions holds a list of the options that have been selected
		this.state = {
			selectedOptions: this.props.selectedOptions ? this.props.selectedOptions : []
		};
	}

	public componentWillReceiveProps(nextProps) {
		if (nextProps.selectedOptions) {
			this.setState({ selectedOptions: nextProps.selectedOptions });
		}
	}

	public render() {
		return (
			<Select
				multi
				options={this.props.options}
				value={this.state.selectedOptions}
				placeholder={this.props.placeholder}
				style={this.props.style}
				onChange={this.onValuesChangeInternal}
				clearable={false}
				closeOnSelect={false}
			/>
		);
	}

	private onValuesChangeInternal(items) {
		// Defer to the underlying MultiSelect when it has a state change
		// Note that the MSC state selectedOptions is in fact the canonical source of truth
		this.setState({ selectedOptions: items });
		this.props.onValuesChange(items);
	}
}
