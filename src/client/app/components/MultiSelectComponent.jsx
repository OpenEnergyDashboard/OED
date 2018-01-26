/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import PropTypes from 'prop-types';
import React from 'react';
import Select from 'react-select';
import 'react-select/dist/react-select.css';
import '../styles/react-select-css.css';

export default class MultiSelectComponent extends React.Component {
	constructor(props) {
		super(props);
		this.onValuesChangeInternal = this.onValuesChangeInternal.bind(this);
		// selectedOptions holds a list of the options that have been selected
		this.state = {
			selectedOptions: this.props.selectedOptions ? this.props.selectedOptions : null
		};
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.selectedOptions) {
			this.setState({ selectedOptions: nextProps.selectedOptions });
		}
	}

	onValuesChangeInternal(items) {
		// Defer to the underlying MultiSelect when it has a state change
		// Note that the MSC state selectedOptions is in fact the canonical source of truth
		this.setState({ selectedOptions: items });
		this.props.onValuesChange(items);
	}

	render() {
		return (
			<Select
				multi={!this.props.singleSelect}
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
}

MultiSelectComponent.propTypes = {
	placeholder: PropTypes.string,
	options: PropTypes.arrayOf(PropTypes.shape({
		label: PropTypes.string.isRequired,
		value: PropTypes.number,
	})),
	selectedOptions: PropTypes.oneOfType([
		PropTypes.arrayOf(PropTypes.shape({
			label: PropTypes.string.isRequired,
			value: PropTypes.number,
		})),
		PropTypes.shape({
			label: PropTypes.string.isRequired,
			value: PropTypes.number,
		})
	]),
	onValuesChange: PropTypes.func.isRequired,
	singleSelect: PropTypes.bool
};
