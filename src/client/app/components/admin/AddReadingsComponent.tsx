/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import Dropzone from 'react-dropzone';
import { showSuccessNotification, showErrorNotification } from '../../utils/notifications';
import { SelectOption } from '../../types/items';
import SingleSelectComponent from '../SingleSelectComponent';
import { UpdateImportMeterAction } from '../../types/redux/admin';
import { fileProcessingApi } from '../../utils/api';
import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';

interface AddReadingProps {
	selectedImportMeter: SelectOption | null;
	meters: SelectOption[];
	updateSelectedImportMeter(meterID: number): UpdateImportMeterAction;
}

type AddReadingsPropsWithIntl = AddReadingProps & InjectedIntlProps;

class AddReadingComponent extends React.Component<AddReadingsPropsWithIntl, {}> {
	constructor(props: AddReadingsPropsWithIntl) {
		super(props);
		this.handleFileToImport = this.handleFileToImport.bind(this);
	}

	public handleFileToImport(files: File[]) {
		if (!this.props.selectedImportMeter) {
			showErrorNotification('Please select a meter');
		} else {
			const file = files[0];
			fileProcessingApi.submitNewReadings(this.props.selectedImportMeter.value, file)
				.then(() => {
					showSuccessNotification('Successfully uploaded meter data');
				})
				.catch(() => {
					showErrorNotification('Error uploading meter data');
				});
		}
	}

	public render() {
		const titleStyle: React.CSSProperties = {
			fontWeight: 'bold',
			margin: 0,
			paddingBottom: '5px'
		};
		const smallMarginBottomStyle: React.CSSProperties = {
			marginBottom: '5px'
		};
		const messages = defineMessages({ selectMeter: { id: 'select.meter' }});
		const { formatMessage } = this.props.intl;

		return (
			<div>
				<p style={titleStyle}>
					<FormattedMessage id='import.meter.readings' />:
				</p>
				<SingleSelectComponent
					style={smallMarginBottomStyle}
					options={this.props.meters}
					selectedOption={this.props.selectedImportMeter}
					placeholder={formatMessage(messages.selectMeter)}
					onValueChange={s => this.props.updateSelectedImportMeter(s.value)}
				/>
				{this.props.selectedImportMeter &&
				<Dropzone accept='text/csv, application/vnd.ms-excel,' onDrop={this.handleFileToImport}>
					<div>
						<FormattedMessage id='upload.readings.csv' />
					</div>
				</Dropzone>
				}
			</div>
		);
	}
}

export default injectIntl<AddReadingProps>(AddReadingComponent);
