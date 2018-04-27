# Technologies in Use

We use many technologies in OED, from compilation/transpilation to HTTP request handling.

## Frontend Technologies

Some of the most complex technologies we use are those that turn the code we write - TypeScript and ES6 JavaScript - into tiny, optimized code that the browser can execute. This is known as packing, tree-shaking, and uglification. See the diagram below for a quick overview of how this works.

![The flow of OED's source code from source JS, TS, and CSS, through various loaders, into Webpack, out into source maps, back into Webpack, and finally into the final bundle which is served to the client.](images/comp_flow.jpeg)

After this process, our hundreds of source files and dependencies are converted into a single multi-megabyte file which will be transmitted to our users over HTTP. Plugins within Webpack, such as the LodashModuleReplacementPlugin, further optimize the size of this bundle.
