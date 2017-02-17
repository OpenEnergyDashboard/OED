import React from 'react';

/**
 * React component that creates an logo image from a file path
 * @param props The props from the parent component which includes a path url
 * @return JSX to create logo image
 */
export default function LogoComponent(props) {
	const imgStyle = {
		width: '175px',
		height: '70px',
		top: '2px',
		left: '2px',
		position: 'absolute'
	};
	return (
		<img src={props.url} alt="Logo" style={imgStyle} />
	);
}
