/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import MultiSelectComponent from '../MultiSelectComponent';
import { DATA_TYPE_METER, DATA_TYPE_GROUP, metersFilterReduce, groupsFilterReduce } from '../../utils/Datasources';

export default class DatasourceBoxComponent extends React.Component {
	constructor(props) {
		super(props);
		this.handleDatasourceSelect = this.handleDatasourceSelect.bind(this);
	}

	handleDatasourceSelect(selection) {
		if (this.props.type === 'meters') {
			this.props.selectDatasource(selection.reduce(metersFilterReduce, []));
		} else {
			this.props.selectDatasource(selection.reduce(groupsFilterReduce, []));
		}
	}

	render() {
		const selectOptions = this.props.datasource.map(element => (
			{
				label: element.name,
				type: this.props.type === 'meters' ? DATA_TYPE_METER : DATA_TYPE_GROUP,
				value: element.id,
			}
		));

		return (
			<MultiSelectComponent options={selectOptions} placeholder={`Select ${this.props.type}s`} onValuesChange={this.handleDatasourceSelect} />
		);
	}
}
