//This component is for viewing a single group via child box components + some buttons
import React from 'react';
import {Link} from 'react-router';
import ChildBox from './ChildBoxComponent';
import EditGroupComponent from './EditGroupComponent';

export default function GroupViewComponent(props) {

	//Right now this just links, ideally it will put the edit component up as an overlay
	const buttonStyle = {
		marginTop: '10px'
	};

	const boxStyle ={
		marginLeft: '35%',
		marginRight: '35%',
		backgroundColor: '#9fffff'
	};

	return (

		<div style={boxStyle}>
			<h3>{props.name}</h3>
			<ChildBox/>
			<Link style={buttonStyle} to="/editGroup">
				<button className="btn btn-default">Edit Group</button>
			</Link>
		</div>
	);


}
