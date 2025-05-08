const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

// Create jsdom window application and initialize
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

module.exports = DOMPurify;
