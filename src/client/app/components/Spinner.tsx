/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';

/**
 * @returns spinner with oed logo
 */
export default function Spinner() {
	const [time, setTime] = React.useState(0);

	React.useEffect(() => {
		const interval = setInterval(() => {
			setTime(prevTime => prevTime + 0.25);
		}, 16);

		return () => clearInterval(interval);
	}, []);

	return (
		<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
			{[...Array(4)].map((_, index) => (
				<div key={index}
					style={{
						borderRadius: '100%',
						backgroundColor: 'black',
						height: '50px', width: '50px',
						transform: `translateY(${Math.sin(time + index) * 25}px)`,
						opacity: '0.9'
					}}
				/>

			))}
		</div>
	);
}
