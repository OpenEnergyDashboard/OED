/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import Dropzone from 'react-dropzone';
import { FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import { fileProcessingApi } from '../../utils/api';
import { showSuccessNotification, showErrorNotification } from '../../utils/notifications';
import translate from '../../utils/translate';

interface AddMetersProps {
	fetchMeterDetailsIfNeeded(alwaysFetch?: boolean): Promise<any>;
}

type AddMetersPropsWithIntl = AddMetersProps & InjectedIntlProps;

class AddMetersComponent extends React.Component<AddMetersPropsWithIntl, {}> {
	constructor(props: AddMetersPropsWithIntl) {
		super(props);
		this.handleMeterToImport = this.handleMeterToImport.bind(this);
	}

	public handleMeterToImport(files: File[]) {
		const file = files[0];
		const reader = new FileReader();
		let dataLines = [];
		const listOfIps: string[] = [];

		reader.onload = () => {
			const fileAsBinaryString = reader.result;
			if (fileAsBinaryString === null || fileAsBinaryString === undefined) {
				throw new Error('fileAsBinaryString was null or undefined in meter import onload function');
			}
			if (typeof(fileAsBinaryString) !== 'string') {
				throw new Error('fileAsBinaryString was not a string in meter import onload function');
			}
			dataLines = fileAsBinaryString.split(/\r?\n/);
			dataLines[0] = dataLines[0].replace(/\"/g, '');
			if (dataLines[0] !==  'ip') {
				showErrorNotification(translate('incorrect.file.format'));
			} else {
				for (const items of dataLines) {
					const ips = items.replace(/\"/g, '');
					if (items.length !== 0 && items !== 'ip') {
						listOfIps.push(ips);
					}
				}
				fileProcessingApi.submitNewMeters(listOfIps)
					.then(() => {
						showSuccessNotification(translate('successfully.uploaded.meters'));
						this.props.fetchMeterDetailsIfNeeded(true);
					})
					.catch(() => {
						showErrorNotification(translate('failed.to.upload.meters'));
					});
			}
		};
		reader.onabort = () => showErrorNotification(translate('file.reading.aborted'));
		reader.onerror = () => showErrorNotification(translate('failed.to.read.file'));
		reader.readAsBinaryString(file);
	}

	public render() {
		const titleStyle: React.CSSProperties = {
			fontWeight: 'bold',
			margin: 0,
			paddingBottom: '5px',
			display: 'inline'
		};

		return (
			<div>
				<p style={titleStyle}>

					<FormattedMessage id='add.new.meters' />
				</p>
				<Dropzone accept='text/csv, application/vnd.ms-excel,' onDrop={this.handleMeterToImport}>
					<div style={{marginLeft: '10px'}}>
						<FormattedMessage id='upload.meters.csv' />
					</div>
				</Dropzone>
			</div>
		);
	}
}

export default injectIntl<AddMetersProps>(AddMetersComponent);
