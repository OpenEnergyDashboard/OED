/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Col, Input, FormGroup, FormText, Label } from 'reactstrap';

interface FileUploader {
	reference: React.RefObject<HTMLInputElement>;
	required: boolean;
	formText: string;
	labelStyle?: React.CSSProperties;
}

/**
 * Defines component used to upload files
 * @param props defined above
 * @returns File uploader element
 */
export default function FileUploaderComponent(props: FileUploader) {
	return (
		<FormGroup>
			<Label style={props.labelStyle}>
				<FormattedMessage id='csv.file' />
			</Label>
			<Col>
				<Input innerRef={props.reference} type='file' name='csvfile' required={props.required} />
			</Col>
			<FormText color='muted'>
				<FormattedMessage id={props.formText}/>
			</FormText>
		</FormGroup>
	)
}
