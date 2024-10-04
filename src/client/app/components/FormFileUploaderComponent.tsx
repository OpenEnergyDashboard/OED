/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Col, Input, FormGroup, Label } from 'reactstrap';
import { useTranslate } from '../redux/componentHooks';

interface FileUploader {
	isInvalid: boolean;
	onFileChange: (file: File | null) => void;
}

/**
 * Defines component used to upload files
 * @param props defined above
 * @returns File uploader element
 */
export default function FileUploaderComponent(props: FileUploader) {
	const translate = useTranslate();
	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0] || null;
		props.onFileChange(file);
	};

	return (
		<FormGroup>
			<Label for='csvfile'>
				<div className='pb-1'>
					{translate('csv.file')}
				</div>
			</Label>
			<Col>
				<Input
					type='file'
					name='csvfile'
					id='csvfile'
					onChange={handleFileChange}
					invalid={!props.isInvalid}
				/>
			</Col>
		</FormGroup>
	);
}
