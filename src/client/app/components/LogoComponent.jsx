import React from 'react';

export default function LogoComponent(props) {
	const imgStyle = {
		width: '175px',
		height: '70px',
		top: '2px',
		left: '2px',
		position: 'absolute'
	};
	return (
		<img src={props.url} alt="Logo" style={imgStyle}/>
	);
}
