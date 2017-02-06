import React from 'react';
import { render } from 'react-dom';
import RouteComponent from './components/RouteComponent';
// import { createStore } from 'redux'
// import { Provider } from 'react-redux'
// import reducer from './reducers'

// const store = createStore(reducer);
// render(
//     <Provider store={store}>
//         <AppComponent />
//     </Provider>,
//     document.getElementById('root')
// );

render(
	<RouteComponent />,
	document.getElementById('root')
);
