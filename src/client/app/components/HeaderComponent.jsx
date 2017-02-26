import React from 'react';
import {Link} from 'react-router';
import LogoComponent from './LogoComponent';

export default function HeaderComponent(props) {
	const titleStyle = {
		display: 'inline-block',
	};
	const divRightStyle = {
		float: 'right',
		marginTop: '5px',
		marginRight: '20px'
	};
	const loginLinkStyle = {
		display: localStorage.getItem('token') || props.renderLoginButton === 'false' ? 'none' : 'inline'
	};
	const adminLinkStyle = {
		display: localStorage.getItem('token') ? 'inline' : 'none'
	};
	const groupLinkStyle = {
		display: localStorage.getItem('token') || props.renderGroupButton === 'false' ? 'none' : 'inline'
	};
	return (
		<div className="text-center">
			<Link to="/"><LogoComponent url="./app/images/logo.png"/></Link>
			<h1 style={titleStyle}>Environmental Dashboard</h1>
			<div style={divRightStyle}>
				<Link style={loginLinkStyle} to="/login">
					<button className="btn btn-default">Log in</button>
				</Link>
				<Link style={groupLinkStyle} to="/group">
					<button className="btn btn-default">Groups</button>
				</Link>
				<Link style={adminLinkStyle} to="/admin">
					<button className="btn btn-default">Admin panel</button>
				</Link>
			</div>
		</div>
	);
}
