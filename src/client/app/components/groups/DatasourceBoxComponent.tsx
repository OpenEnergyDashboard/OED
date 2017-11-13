/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import MultiSelectComponent from '../MultiSelectComponent';
import { DataType, metersFilterReduce, groupsFilterReduce } from '../../utils/Datasources';
import { NamedIDItem, SelectOption, DataTyped } from '../../utils/types';

interface DatasourceBoxProps {
	// TODO: This should be an enum
	type: string;
	datasource: NamedIDItem[];
	selectedOptions: NamedIDItem[];
	selectDatasource(ids: number[]): void;
}

export default class DatasourceBoxComponent extends React.Component<DatasourceBoxProps, {}> {
	constructor(props) {
		super(props);
		this.handleDatasourceSelect = this.handleDatasourceSelect.bind(this);
	}

	handleDatasourceSelect(selection) {
		if (this.props.type === 'meters' || this.props.type === 'meter') {
			this.props.selectDatasource(selection.reduce(metersFilterReduce, []));
		} else {
			this.props.selectDatasource(selection.reduce(groupsFilterReduce, []));
		}
	}

	render() {
		let type: DataType = DataType.Group;
		if (this.props.type === 'meters' || this.props.type === 'meter') {
			type = DataType.Meter;
		}

		const options: Array<SelectOption & DataTyped> = this.props.datasource.map(element => (
			{
				label: element.name,
				type,
				value: element.id
			}
		));
		let selectedOptions: Array<SelectOption & DataTyped> | null;
		if (this.props.selectedOptions) {
			selectedOptions = this.props.selectedOptions.map(element => (
				{
					label: element.name,
					type,
					value: element.id
				}
			));
		} else {
			selectedOptions = null;
		}

		return (
			<MultiSelectComponent
				options={options}
				selectedOptions={selectedOptions}
				placeholder={`Select ${this.props.type}s`}
				onValuesChange={this.handleDatasourceSelect}
			/>
		);
	}
}
