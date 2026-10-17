/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
 
 import * as React from 'react';
 import { CacheProvider } from '@emotion/react';
 import emotionCache from './emotionCache';
 import { createRoot } from 'react-dom/client';
 import { Provider } from 'react-redux';

 // These lines take the nonce, and create the webpack and plotly nonces from it
 // These are additional nonces that contribute to styling with webpack and plotly

const __webpack_nonce__ = (document.querySelector('script[nonce]') as HTMLScriptElement | null)?.nonce;
(window as any).__webpack_nonce__ = __webpack_nonce__;
(window as any).__plotly_nonce__ = __webpack_nonce__;

declare global {
	interface Window {
		__webpack_nonce__?: string;
		__plotly_nonce__?: string;
	}
}


const originalAppendChild = document.head.appendChild;
document.head.appendChild = function (node: any) {
	if (
		node instanceof HTMLStyleElement
	) {
		node.setAttribute('nonce', __webpack_nonce__ || '');
	}

	try {
		return originalAppendChild.call(this, node);
	} catch (err) {
		console.error('Failed to append style:', err);
		throw err;
	}
};

// The CSS-related imports must be initialized after the nonce is set, so they are placed here instead of at the top of the file.
// Otherwise, the styles may not be applied correctly due to the nonce not being set in time.

import 'bootstrap/dist/css/bootstrap.css';
import { store } from './store';
import RouteComponent from './components/RouteComponent';
import { initApp } from './redux/slices/appStateSlice';
import './styles/index.css';

store.dispatch(initApp());

// Renders the entire application, starting with RouteComponent, into the root div
const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);

root.render(
	//  Provides the Redux store to all child components
	<CacheProvider value={emotionCache}>
		<Provider store={store} stabilityCheck="always">
			<RouteComponent />
		</Provider>
	</CacheProvider>
);
