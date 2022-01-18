/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import MultiSelectComponent from '../MultiSelectComponent';
import { metersFilterReduce, groupsFilterReduce } from '../../utils/Datasources';
import { NamedIDItem, SelectOption } from '../../types/items';
import { DataType, DatasourceID } from '../../types/Datasources';
import { defineMessages, injectIntl, WrappedComponentProps } from 'react-intl';

interface DatasourceBoxProps {
	// TODO: This should be an enum
	type: string;
	datasource: NamedIDItem[];
	selectedOptions: NamedIDItem[];
	selectDatasource(ids: number[]): void;
}

type DatasourceBoxPropsWithIntl = DatasourceBoxProps & WrappedComponentProps;

// This is just an alias, so it's ok to have it in this file.
// Aliasing this specialization is required because the meaning of < and > conflict in TypeScript and JSX.
// tslint:disable max-classes-per-file
class MultiSelectDatasourceComponent extends MultiSelectComponent<DatasourceID> { }

class DatasourceBoxComponent extends React.Component<DatasourceBoxPropsWithIntl, {}> {
	constructor(props: DatasourceBoxPropsWithIntl) {
		super(props);
		this.handleDatasourceSelect = this.handleDatasourceSelect.bind(this);
	}

	public render() {
		let type: DataType = DataType.Group;
		if (this.props.type === 'meter') {
			type = DataType.Meter;
		}

		/* tslint:disable:array-type */
		const options: Array<SelectOption & DatasourceID> = this.props.datasource.map((element: NamedIDItem) => (
			/* tslint:enable:array-type */
			{
				label: element.name,
				type,
				value: element.id
			}
		));
		/* tslint:disable:array-type */
		let selectedOptions: Array<SelectOption & DatasourceID> | undefined;
		/* tslint:enable:array-type */
		if (this.props.selectedOptions) {
			selectedOptions = this.props.selectedOptions.map((element: NamedIDItem) => (
				{
					label: element.name,
					type,
					value: element.id
				}
			));
		} else {
			selectedOptions = undefined;
		}
		const messages = defineMessages({
			selectMeters: { id: 'select.meters' },
			selectGroups: { id: 'select.groups' }
		});

		return (
			<MultiSelectDatasourceComponent
				options={options}
				selectedOptions={selectedOptions}
				placeholder={this.props.type === 'meter' ? this.props.intl.formatMessage(messages.selectMeters) :
															this.props.intl.formatMessage(messages.selectGroups)}
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

export default injectIntl(DatasourceBoxComponent);
