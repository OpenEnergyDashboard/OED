//Box classes for displaying child meters and groups
import React from 'react';

export default function ChildGroupsBox(props) {


	const boxStyle = {
		display: "inline-block",
		width: "200px",
		alignSelf: "right",
		marginLeft: "40%",
		marginRight: "10%",
		//todo: testing hack
		border: "1px solid purple"
	};
	const listStyle = {
		textAlign: "left"
	};

	const groups = props.groups.map((group) =>
		<li>{group.name}</li>
	);



	return (
		<div style={boxStyle}>
			<h3>Child Groups:</h3>
			<ul style={listStyle}>{groups}</ul>
		</div>
	);

}
