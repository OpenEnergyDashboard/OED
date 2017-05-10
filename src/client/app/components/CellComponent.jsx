import React from 'react';

/**
 * component for one cell in the number displaying grid.
 */
export default class CellComponent extends React.Component {
	render() {
		// calculate price
		let roundedCost = '';
		const value = this.props.unitEnergy * this.props.peoplePerBuilding * this.props.constant;
		const cost = value * 0.08;
		// convert to cent if low price.
		if (cost < 1) {
			roundedCost = `${Math.round(cost * 100)}¢`;
		}			else {
			roundedCost = `$${Math.round(cost)}`;
			roundedCost = roundedCost.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
		}
		const roundedValue = Math.round(value * 10) / 10;
		return (

			<td>
				{roundedValue} kWh<br />
				{roundedCost}
			</td>
		);
	}
}
