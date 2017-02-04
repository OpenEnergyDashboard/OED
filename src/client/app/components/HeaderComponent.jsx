import React from 'react';
import { Link } from 'react-router';
import LogoComponent from './LogoComponent';

export default function HeaderComponent(props) {
	const titleStyle = {
		textAlign: 'center'
	};
	const divRightStyle = {
		float: 'right',
		marginRight: '75px'
	};
	const loginLinkStyle = {
		display: localStorage.getItem('token') || props.renderLoginButton === 'false' ? 'none' : 'block'
	};
	const adminLinkStyle = {
		display: localStorage.getItem('token') ? 'block' : 'none'
	};
	return (
		<div>
			<LogoComponent url="./app/images/logo.png" />
			<div style={divRightStyle}>
				<Link style={loginLinkStyle} to="/login"><button className="btn btn-default">Log in</button></Link>
				<Link style={adminLinkStyle} to="/admin"><button className="btn btn-default">Admin panel</button></Link>
			</div>
			<h1 style={titleStyle}>Environmental Dashboard</h1>
		</div>
	);
}
