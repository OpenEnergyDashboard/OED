import React from 'react';

/**
 * React component that displays a 404 Not Found error page
 * @return JSX to create the 404 Not Found error page
 */
export default function NotFoundComponent() {
	const textStyle = {
		fontWeight: 'bold',
		paddingLeft: '15px'
	};
	return (
		<h1 style={textStyle}>404 Not Found</h1>
	);
}
