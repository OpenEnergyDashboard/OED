/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Input, FormGroup, FormText, Label } from 'reactstrap';

interface FileUploader {
	reference: React.RefObject<HTMLInputElement>;
	required: boolean;
	buttonText: string;
}

export default function FileUploaderComponent(props: FileUploader) {
	return (
		<FormGroup>
			<Label>CSV File</Label>
			<Input innerRef={props.reference} type='file' name='csvfile' required={props.required} />
			<FormText color='muted'>
				{props.buttonText}
			</FormText>
		</FormGroup>
	)
}
