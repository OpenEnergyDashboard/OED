/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';

export default function ListDisplayComponent(props) {
	return (
		<select className="form-control" id="meterList" size={props.height || 8}>
			{props.items.map((item, index) =>
				<option key={index} disabled>{ item.toString() }</option>
			)}
		</select>
	);
}
