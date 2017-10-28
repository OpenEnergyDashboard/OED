/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';

export default function ListDisplayComponent(props) {
	const heightPx = (props.height || 8) * 18;
	const listWrapperStyle = {
		border: '1px solid #cccccc',
		borderRadius: '2px',
		minHeight: `${heightPx}px`,
		maxHeight: `${heightPx}px`,
		overflowY: 'scroll'
	};

	const listStyle = {
		listStyleType: 'none',
		paddingTop: '6px',
		paddingBottom: '6px',
		paddingLeft: '12px',
		paddingRight: '12px',
	};
	return (
		<div className="list-wrapper" style={listWrapperStyle} >
			<ul id="meterList" style={listStyle} >
				{props.items.map((item, index) =>
					<li key={index} disabled>{ item.toString() }</li>
				)}
			</ul>
		</div>
	);
}
