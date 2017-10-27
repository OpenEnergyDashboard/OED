import React from 'react';

export default function DisplayComponent(props) {
	return (
		<select className="form-control" id="meterList" size={props.height || 8}>
			{props.items.map((item, index) =>
				<option key={index} disabled>{ item }</option>
			)}
		</select>
	);
}
