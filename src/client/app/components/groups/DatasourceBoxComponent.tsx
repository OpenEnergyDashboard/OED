/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import MultiSelectComponent from '../MultiSelectComponent';
import { metersFilterReduce, groupsFilterReduce } from '../../utils/Datasources';
import { NamedIDItem, SelectOption } from '../../types/items';
import { DataType, DataTyped, DatasourceID } from '../../types/Datasources';

interface DatasourceBoxProps {
	// TODO: This should be an enum
	type: string;
	datasource: NamedIDItem[];
	selectedOptions: NamedIDItem[];
	selectDatasource(ids: number[]): void;
}

// This is just an alias, so it's ok to have it in this file.
// tslint:disable max-classes-per-file
class MultiSelectDatasourceComponent extends MultiSelectComponent<DatasourceID> {}

export default class DatasourceBoxComponent extends React.Component<DatasourceBoxProps, {}> {
	constructor(props: DatasourceBoxProps) {
		super(props);
		this.handleDatasourceSelect = this.handleDatasourceSelect.bind(this);
	}

	public render() {
		let type: DataType = DataType.Group;
		if (this.props.type === 'meter') {
			type = DataType.Meter;
		}

		const options: Array<SelectOption & DatasourceID> = this.props.datasource.map(element => (
			{
				label: element.name,
				type,
				value: element.id
			}
		));
		let selectedOptions: Array<SelectOption & DatasourceID> | null;
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
			<MultiSelectDatasourceComponent
				options={options}
				selectedOptions={selectedOptions}
				placeholder={`Select ${this.props.type}s`}
				onValuesChange={this.handleDatasourceSelect}
			/>
		);
	}

	private handleDatasourceSelect(selection: DatasourceID[]) {
		if (this.props.type === 'meter') {
			this.props.selectDatasource(selection.reduce(metersFilterReduce, []));
		} else {
			this.props.selectDatasource(selection.reduce(groupsFilterReduce, []));
		}
	}
}
