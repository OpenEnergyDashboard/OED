import * as React from 'react';

/**
 * @returns spinner with oed logo
 */
export default function LogoSpinner() {
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
	)
}
// const spinnerStyle = {
// 	width: props.width ? props.width : 15,
// 	height: props.height ? props.height : 15,
// 	backgroundColor: props.color ? props.color : 'black'
// };

// return (
// 	<div>
// 		{props.loading &&
// 			<div>
// 				<div style={spinnerStyle} className='spinner spinner-item-1' />
// 				<div style={spinnerStyle} className='spinner spinner-item-2' />
// 				<div style={spinnerStyle} className='spinner spinner-item-1' />
// 			</div>
// 		}
// 	</div>
// );
// return (
// 	<div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
// 		<div style={{ position: 'relative', height: '300px', width: '300px', transform: `rotate(${rotation}deg)` }}>
// 			<img src="./logo.png" alt="spinner" style={{ position: 'absolute', left: '0', top: '104px' }} />
// 			<img src="./logo.png" alt="spinner" style={{ position: 'absolute', left: '80px', top: '20px', transform: `rotate(${90}deg)` }} />
// 			<img src="./logo.png" alt="spinner" style={{ position: 'absolute', right: '0', top: '104px', transform: `rotate(${180}deg)` }} />
// 			<img src="./logo.png" alt="spinner" style={{ position: 'absolute', left: '80px', bottom: '20px', transform: `rotate(${270}deg)` }} />
// 		</div>
// 	</div>
// )