/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Col, Input, FormGroup, FormText, Label } from 'reactstrap';

interface FileUploader {
	reference: React.RefObject<HTMLInputElement>;
	required: boolean;
	buttonText: string;
	labelStyle?: React.CSSProperties;
}

export default function FileUploaderComponent(props: FileUploader) {
	return (
		<FormGroup>
			<Label style={props.labelStyle}>
				CSV File
			</Label>
			<Col>
				<Input innerRef={props.reference} type='file' name='csvfile' required={props.required} />
			</Col>
			<FormText color='muted'>
				{props.buttonText}
			</FormText>
		</FormGroup>
	)
}
