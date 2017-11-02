/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import PropTypes from 'prop-types';
import React from 'react';
import Select from 'react-select';
import 'react-select/dist/react-select.css';
import '../styles/react-select-css.css';

export default class SelectComponent extends React.Component {
	constructor(props) {
		super(props);
		this.onValuesChangeInternal = this.onValuesChangeInternal.bind(this);
		// selectedOption holds a list of the options that have been selected
		if (props.selectedOption) {
			this.state = { selectedOption: props.selectedOption };
		} else {
			this.state = { selectedOption: {} };
		}
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.selectedOption) {
			this.setState({ selectedOption: nextProps.selectedOption });
		}
	}

	onValuesChangeInternal(items) {
		// Defer to the underlying Select when it has a state change
		// Note that the MSC state selectedOptions is in fact the canonical source of truth
		this.setState({ selectedOption: items });
		this.props.onValuesChange(items);
	}

	render() {
		return (
			<Select
				options={this.props.options}
				value={this.state.selectedOption}
				placeholder={this.props.placeholder}
				style={this.props.style}
				onChange={this.onValuesChangeInternal}
				clearable={false}
				closeOnSelect
			/>
		);
	}
}

SelectComponent.propTypes = {
	placeholder: PropTypes.string,
	options: PropTypes.arrayOf(PropTypes.shape({
		label: PropTypes.string.isRequired,
		value: PropTypes.number,
	})),
	selectedOption: PropTypes.shape({
		label: PropTypes.string.isRequired,
		value: PropTypes.number,
	}),
	onValuesChange: PropTypes.func.isRequired,
};
