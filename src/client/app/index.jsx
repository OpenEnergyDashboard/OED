import React from 'react';
import { render } from 'react-dom';
import AppComponent from './components/AppComponent';
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
	<AppComponent />, document.getElementById('root')
);
