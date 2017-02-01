import React from 'react';
import LogoComponent from './LogoComponent';
import LoginComponent from './LoginComponent';

export default function HeaderComponent() {
	const titleStyle = {
		textAlign: 'center'
	};
	return (
		<div>
			<LogoComponent url="./app/images/logo.png" />
			<h1 style={titleStyle}>Environmental Dashboard</h1>
			<LoginComponent />
		</div>
	);
}
