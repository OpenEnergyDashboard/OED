/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import React from 'react';

// needs setFilter and clearFilter dispatchers
// and filterTerm, the text in the box.
export default class MetersFilterComponent extends React.Component {
	/**
	 * Initializes the components state, binds all functions to this.
	 * @param props The props passed down through the MetersFilterContainer
	 */
	constructor(props) {
		super(props);
		this.handleChanged = this.handleChanged.bind(this);
		this.handleClearButtonClicked = this.handleClearButtonClicked.bind(this);
	}

	handleChanged(event) {
		this.props.setFilter(event.target.value);
	}

	handleClearButtonClicked() {
		this.props.clearFilter();
		// By default, the form field keeps its own state, so when it's
		// cleared it needs to be invalidated so the vDOM can redraw it.
		this.forceUpdate();
	}

	render() {
		const filterInputStyle = {
			maxWidth: '75%'
		};
		return (
			<div className="form-inline">
				<input type="text" className="form-control" placeholder="Filter..." style={filterInputStyle} value={this.props.filterTerm} onInput={this.handleChanged} />
				<button className="form-control btn btn-danger" onClick={this.handleClearButtonClicked}>❌</button>
			</div>
		);
	}
}
