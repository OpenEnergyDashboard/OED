/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import { defineMessages, injectIntl, intlShape } from 'react-intl';
import MultiSelectComponent from '../MultiSelectComponent';
import { DATA_TYPE_METER, DATA_TYPE_GROUP, metersFilterReduce, groupsFilterReduce } from '../../utils/Datasources';

class DatasourceBoxComponent extends React.Component {
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
		const options = this.props.datasource.map(element => (
			{
				label: element.name,
				type: this.props.type === 'meters' ? DATA_TYPE_METER : DATA_TYPE_GROUP,
				value: element.id,
			}
		));
		let selectedOptions = null;
		if (this.props.selectedOptions) {
			selectedOptions = this.props.selectedOptions.map(element => (
				{
					label: element.name,
					type: this.props.type === 'meters' ? DATA_TYPE_METER : DATA_TYPE_GROUP,
					value: element.id,
				}
			));
		}
		let messages;
		if (this.props.type === 'meter') {
			messages = defineMessages({
				select: {
					id: 'select.meters',
					defaultMessage: 'Select Meters'
				}
			});
		} else {
			messages = defineMessages({
				select: {
					id: 'select.groups',
					defaultMessage: 'Select Groups'
				}
			});
		}
		const { formatMessage } = this.props.intl;

		return (
			<MultiSelectComponent
				options={options}
				selectedOptions={selectedOptions}
				placeholder={formatMessage(messages.select)}
				onValuesChange={this.handleDatasourceSelect}
			/>
		);
	}
}
DatasourceBoxComponent.propTypes = {
	intl: intlShape.isRequired
};

export default injectIntl(DatasourceBoxComponent);
