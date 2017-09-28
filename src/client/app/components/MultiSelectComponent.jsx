/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import _ from 'lodash';
import React from 'react';
import { MultiSelect } from 'react-selectize';
import 'react-selectize/themes/bootstrap3.css';
import '../styles/react-selectize-css.css';

/**
 * Needs props: placeholder (String), options (Object[]), and onValuesChange (fn Object[] -> ())
 */
export default class MultiSelectComponent extends React.Component {
	constructor(props) {
		super(props);
		this.onValuesChangeInternal = this.onValuesChangeInternal.bind(this);
		this.onValuesAdd = this.onValuesAdd.bind(this);
		this.onValuesRemove = this.onValuesRemove.bind(this);
		this.buildRemoveItemFromSelected = this.buildRemoveItemFromSelected.bind(this);
		this.renderValue = this.renderValue.bind(this);
		// selectedOptions holds a list of the options that have been selected
		this.state = { selectedOptions: [] };
		this.style = { ...this.props.style, maxWidth: '140%' };
	}

	onValuesAdd(items) {
		const newItems = _.filter(items, () => true)
		this.onValuesChangeInternal('Added an item', newItems);
	}
	onValuesRemove(items) { this.onValuesChangeInternal('Removed an item', items); }

	onValuesChangeInternal(reason, items) {
		console.log(`${reason} ... onValuesChangeInternal(`, items, ')');
		// Defer to the underlying MultiSelect when it has a state change
		// Note that the MSC state selectedOptions is in fact the canonical source of truth
		this.setState({ selectedOptions: items });
		this.props.onValuesChange(items);
	}

	// Returns a function that removes the given item from the current selection
	buildRemoveItemFromSelected(item) {
		// Remove only the item(s) with the same value as the given item
		return (() => {
			const newSelectedOptions = _.reject(this.state.selectedOptions,
					candidate => item.value === candidate.value && item.type === candidate.type);
			this.onValuesRemove(newSelectedOptions);
		});
	}

	renderValue(item) {
		const valueWrapperStyle = {
			padding: '4px',
			borderRadius: '4px',
		};
		return (
			<div className="simple-value" style={valueWrapperStyle}>
				<span>{item.label}</span>
				<button className="btn btn-xs" onClick={this.buildRemoveItemFromSelected(item)}>❌</button>
			</div>
		);
	}

	render() {
		return (
			<MultiSelect theme="bootstrap3" placeholder={this.props.placeholder} style={this.style} onValuesChange={this.onValuesAdd} renderValue={this.renderValue} options={this.props.options} values={this.state.selectedOptions} />
		);
	}
}
