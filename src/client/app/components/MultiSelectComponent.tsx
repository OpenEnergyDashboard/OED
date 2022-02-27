/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import Select from 'react-select';
import 'react-select/dist/react-select.css';
import { SelectOption } from '../types/items';
import '../styles/react-select-css.css';

interface MultiSelectProps<I> {
	placeholder: string;
	/* tslint:disable:array-type */
	options: Array<SelectOption & I>;
	selectedOptions: Array<SelectOption & I> | undefined;
	style?: React.CSSProperties;
	singleSelect?: boolean;
	onValuesChange(values: Array<SelectOption & I>): void;
	/* tslint:enable:array-type */
}

interface MultiSelectState {
	selectedOptions?: SelectOption[];
}

export default class MultiSelectComponent<I> extends React.Component<MultiSelectProps<I>, MultiSelectState> {
	constructor(props: MultiSelectProps<I>) {
		super(props);
		this.onValuesChangeInternal = this.onValuesChangeInternal.bind(this);
		// selectedOptions holds a list of the options that have been selected
		this.state = {
			selectedOptions: this.props.selectedOptions ? this.props.selectedOptions : undefined
		};
	}

	public componentDidUpdate(prevProps: MultiSelectProps<any>) {
		if (this.props.selectedOptions !== prevProps.selectedOptions) {
			this.setState({ selectedOptions: this.props.selectedOptions });
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

	/* tslint:disable:array-type */
	private onValuesChangeInternal(items: Array<SelectOption & I>) {
	/* tslint:enable:array-type */
		// Defer to the underlying MultiSelect when it has a state change
		// Note that the MSC state selectedOptions is in fact the canonical source of truth
		this.setState({ selectedOptions: items });
		this.props.onValuesChange(items);
	}
}
