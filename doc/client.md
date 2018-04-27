# Client Code

All client-side code is stored in `src/client`. It follows a standard React/Redux structure with TypeScript.

## Public, index.html, and Webpack

The index.html is the entry point of the client-side code.
It is served by Express as defined in `src/server/app.js`.
When Webpack is run, it transpiles TypeScript (with some ES6+ syntax) into JavaScript ES5 code and bundles the entire application together.
This bundle is built in `src/client/public/bundle.js` (not tracked in Git).
The index.html loads the bundle as its only script.
The React application is mounted in the root HTML div.
The entry point for React is in `src/client/app/index.tsx`.

## Directory structure of `src/client/app`

* **actions/** contains all the Redux actions (and thunk) definitions.
* **components/** contains all the React components.
* **containers/** contains every Redux container. This structure matches the directory structure of */components*.
* **images/** contains all images.
* **reducers/** contains all the Redux reducers. They are combined into a single reducer in *reducers/index.ts*.
* **styles/** contains all CSS stylesheets. If possible, React inline styles are preferred. 
* **translations** contains the i18n translations.
* **types/** contains all TypeScript definitions.
* **types/redux** contains TypeScript definitions for OED specific Redux.
* **utils/** contains all other utility functions used throughout the client.
* **utils/api** contains classes that allow HTTP requests with the server.
