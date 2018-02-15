/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import '../styles/spinner.css';

function SpinnerComponent(props) {
	const spinnerStyle = {
		width: props.width ? props.width : '15px',
		height: props.height ? props.height : '15px',
		backgroundColor: props.color ? props.color : 'black'
	};

	return (
		<div>
			{props.loading &&
				<div>
					<div style={spinnerStyle} className="spinner spinner-item-1" />
					<div style={spinnerStyle} className="spinner spinner-item-2" />
					<div style={spinnerStyle} className="spinner spinner-item-1" />
				</div>
			}
		</div>
	);
}

export default SpinnerComponent;
