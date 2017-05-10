import React from 'react';
import CellComponent from './CellComponent';

/**
 * component for displaying calculated number in a grid
 */
export default class AppliancesPageComponent extends React.Component {


	render() {
		const tableStyle = {
			width: '80%',
			position: 'absolute',
			left: '10%',
			height: '100%'
		};


		return (

			<table style={tableStyle}>
				<tr>
					<th />
					<th>DAY</th>
					<th>MONTH</th>
					<th>SEMESTER</th>
					<th>4 YEARS</th>
				</tr>
				<tr>
					<th>ME</th>
					<CellComponent unitEnergy={this.props.unitEnergy} peoplePerBuilding="1" constant="1" />
					<CellComponent unitEnergy={this.props.unitEnergy} peoplePerBuilding="1" constant="30" />
					<CellComponent unitEnergy={this.props.unitEnergy} peoplePerBuilding="1" constant="130" />
					<CellComponent unitEnergy={this.props.unitEnergy} peoplePerBuilding="1" constant="1040" />
				</tr>
				<tr>
					<th>BUILDING</th>
					<CellComponent unitEnergy={this.props.unitEnergy} peoplePerBuilding="52" constant="1" />
					<CellComponent unitEnergy={this.props.unitEnergy} peoplePerBuilding="52" constant="30" />
					<CellComponent unitEnergy={this.props.unitEnergy} peoplePerBuilding="52" constant="130" />
					<CellComponent unitEnergy={this.props.unitEnergy} peoplePerBuilding="52" constant="1040" />
				</tr>
				<tr>
					<th>SCHOOL</th>
					<CellComponent unitEnergy={this.props.unitEnergy} peoplePerBuilding="1" constant="1300" />
					<CellComponent unitEnergy={this.props.unitEnergy} peoplePerBuilding="1" constant="39000" />
					<CellComponent unitEnergy={this.props.unitEnergy} peoplePerBuilding="1" constant="169000" />
					<CellComponent unitEnergy={this.props.unitEnergy} peoplePerBuilding="1" constant="1352000" />
				</tr>
			</table>
		);
	}
}
