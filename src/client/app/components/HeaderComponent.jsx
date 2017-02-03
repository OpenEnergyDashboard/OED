import React from 'react';
import { Link } from 'react-router';
import LogoComponent from './LogoComponent';

export default function HeaderComponent(props) {
	const titleStyle = {
		textAlign: 'center'
	};
	const linkStyle = {
		float: 'right',
		marginRight: '75px',
		display: props.renderLoginButton === 'false' ? 'none' : 'block'
	};
	return (
		<div>
			<LogoComponent url="./app/images/logo.png" />
			<Link style={linkStyle} to="/login"><button className="btn btn-default">Log in</button></Link>
			<h1 style={titleStyle}>Environmental Dashboard</h1>
		</div>
	);
}
