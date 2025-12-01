/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import createCache from '@emotion/cache';

const nonce = (document.querySelector('script[nonce]') as HTMLScriptElement | null)?.nonce;

const emotionCache = createCache({
	key: 'css',
	nonce: nonce
});

export default emotionCache;
