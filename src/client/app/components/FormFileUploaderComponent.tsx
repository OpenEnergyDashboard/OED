/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Col, Input, FormGroup, Label } from 'reactstrap';
import translate from '../utils/translate';

interface FileUploader {
	reference: React.RefObject<HTMLInputElement>;
	required: boolean;
	formText: string;
	labelStyle?: React.CSSProperties;
	onFileChange: (file: File | null) => void;
}

/**
 * Defines component used to upload files
 * @param props defined above
 * @returns File uploader element
 */
export default function FileUploaderComponent(props: FileUploader) {

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0] || null;
		props.onFileChange(file);
	};

	return (
		<FormGroup>
			<Label style={props.labelStyle}>
				<div className='pb-1'>
					{translate('csv.file')}
				</div>
				<Col>
					<Input
						innerRef={props.reference}
						type='file'
						name='csvfile'
						required={props.required}
						onChange={handleFileChange}
					/>
				</Col>
			</Label>
		</FormGroup>
	);
}
