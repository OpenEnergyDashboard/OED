/**
 * Created by Eduardo on 4/12/2017.
 */
import React from 'react';

export default function MeterDropDownComponent(props) {
	console.log(props);
	const handleMeterSelect = () => {
		console.log('it works m8');
	};
	return (
		<select multiple onChange={handleMeterSelect}>
			{props.meters.map(meter =>
				<option key={meter.id} value={meter.id}>{meter.name}</option>
			)}
		</select>
	);
}
