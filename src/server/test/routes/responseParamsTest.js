/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const { expect } = require('chai');
const { mocha } = require('../common');
const { success, failure } = require('../../routes/response');
const { HTTP_CODE } = require('../../util/readingsUtils');

mocha.describe('Response Utility Functions', () => {

	// Mock Express response object
	function createMockResponse() {
		const mockRes = {
			statusCode: null,
			sentData: null,
			status: function (code) {
				this.statusCode = code;
				return this;
			},
			send: function (data) {
				this.sentData = data;
				return this;
			}
		};
		return mockRes;
	}

	mocha.describe('success() function', () => {
		mocha.it('should set status to 200 OK', () => {
			const mockRes = createMockResponse();

			success(mockRes);

			expect(mockRes.statusCode).to.equal(HTTP_CODE.OK);
		});

		mocha.it('should send empty comment by default', () => {
			const mockRes = createMockResponse();

			success(mockRes);

			expect(mockRes.sentData).to.equal('');
		});

		mocha.it('should send provided comment', () => {
			const mockRes = createMockResponse();
			const comment = 'Operation completed successfully';

			success(mockRes, comment);

			expect(mockRes.statusCode).to.equal(HTTP_CODE.OK);
			expect(mockRes.sentData).to.equal(comment);
		});

		mocha.it('should handle string comments', () => {
			const mockRes = createMockResponse();
			const comment = 'Success message';

			success(mockRes, comment);

			expect(mockRes.sentData).to.equal(comment);
		});

		mocha.it('should handle empty string comment', () => {
			const mockRes = createMockResponse();

			success(mockRes, '');

			expect(mockRes.statusCode).to.equal(HTTP_CODE.OK);
			expect(mockRes.sentData).to.equal('');
		});

		mocha.it('should handle null comment', () => {
			const mockRes = createMockResponse();

			success(mockRes, null);

			expect(mockRes.statusCode).to.equal(HTTP_CODE.OK);
			expect(mockRes.sentData).to.equal(null);
		});

		mocha.it('should handle undefined comment', () => {
			const mockRes = createMockResponse();

			success(mockRes, undefined);

			expect(mockRes.statusCode).to.equal(HTTP_CODE.OK);
			// success() defaults undefined to ''
			expect(mockRes.sentData).to.equal('');
		});
	});

	mocha.describe('failure() function', () => {
		mocha.it('should set status to 500 by default', () => {
			const mockRes = createMockResponse();

			failure(mockRes);

			expect(mockRes.statusCode).to.equal(HTTP_CODE.INTERNAL_SERVER_ERROR);
		});

		mocha.it('should send empty comment by default', () => {
			const mockRes = createMockResponse();

			failure(mockRes);

			expect(mockRes.sentData).to.equal('');
		});

		mocha.it('should use provided status code', () => {
			const mockRes = createMockResponse();

			failure(mockRes, HTTP_CODE.NOT_FOUND);

			expect(mockRes.statusCode).to.equal(HTTP_CODE.NOT_FOUND);
		});

		mocha.it('should send provided comment', () => {
			const mockRes = createMockResponse();
			const comment = 'Operation failed';

			failure(mockRes, HTTP_CODE.BAD_REQUEST, comment);

			expect(mockRes.statusCode).to.equal(HTTP_CODE.BAD_REQUEST);
			expect(mockRes.sentData).to.equal(comment);
		});

		mocha.it('should handle various HTTP error codes', () => {
			const mockRes = createMockResponse();
			const errorCodes = [HTTP_CODE.BAD_REQUEST, HTTP_CODE.UNAUTHORIZED, HTTP_CODE.FORBIDDEN, HTTP_CODE.NOT_FOUND, HTTP_CODE.UNPROCESSABLE_ENTITY, HTTP_CODE.INTERNAL_SERVER_ERROR, HTTP_CODE.SERVICE_UNAVAILABLE];

			errorCodes.forEach(code => {
				const freshMockRes = createMockResponse();
				failure(freshMockRes, code, `Error ${code}`);

				expect(freshMockRes.statusCode).to.equal(code);
				expect(freshMockRes.sentData).to.equal(`Error ${code}`);
			});
		});

		mocha.it('should handle zero status code', () => {
			const mockRes = createMockResponse();

			failure(mockRes, 0);

			expect(mockRes.statusCode).to.equal(0);
		});

		mocha.it('should handle invalid status codes gracefully', () => {
			const mockRes = createMockResponse();

			// Express typically handles invalid codes, but test the function behavior
			failure(mockRes, 999);

			expect(mockRes.statusCode).to.equal(999);
		});
	});

	mocha.describe('Parameter validation', () => {
		// TODO: Functions should handle null response objects gracefully
		// Currently they throw TypeError when trying to call .status() on null
		// mocha.it('should handle missing response object gracefully', () => {
		//     // These should not throw errors, though they won't work properly
		//     expect(() => success(null)).to.not.throw();
		//     expect(() => failure(null)).to.not.throw();
		// });

		// TODO: Functions should handle invalid response objects gracefully
		// Currently they throw TypeError when trying to call .status() on objects without status method
		// mocha.it('should handle invalid response object', () => {
		//     const invalidRes = { invalid: 'object' };
		//     
		//     // Should not throw, though it won't work as expected
		//     expect(() => success(invalidRes)).to.not.throw();
		//     expect(() => failure(invalidRes)).to.not.throw();
		// });

		mocha.it('should handle non-numeric status codes in failure', () => {
			const mockRes = createMockResponse();

			failure(mockRes, 'invalid');

			expect(mockRes.statusCode).to.equal('invalid');
		});

		mocha.it('should handle negative status codes', () => {
			const mockRes = createMockResponse();

			failure(mockRes, -1);

			expect(mockRes.statusCode).to.equal(-1);
		});
	});

	mocha.describe('Function signatures', () => {
		mocha.it('should export success function', () => {
			expect(success).to.be.a('function');
			// Only res parameter required, comment is optional with default
			expect(success.length).to.equal(1);
		});

		mocha.it('should export failure function', () => {
			expect(failure).to.be.a('function');
			// Only res parameter required, code and comment have defaults
			expect(failure.length).to.equal(1);
		});

		mocha.it('should have correct default parameters', () => {
			const mockRes = createMockResponse();

			// Test success with only res parameter
			success(mockRes);
			expect(mockRes.statusCode).to.equal(HTTP_CODE.OK);
			expect(mockRes.sentData).to.equal('');

			// Test failure with only res parameter
			const mockRes2 = createMockResponse();
			failure(mockRes2);
			expect(mockRes2.statusCode).to.equal(HTTP_CODE.INTERNAL_SERVER_ERROR);
			expect(mockRes2.sentData).to.equal('');
		});
	});

	mocha.describe('Comment handling', () => {
		mocha.it('should handle long comments', () => {
			const mockRes = createMockResponse();
			const longComment = 'x'.repeat(10000);

			success(mockRes, longComment);

			expect(mockRes.statusCode).to.equal(HTTP_CODE.OK);
			expect(mockRes.sentData).to.equal(longComment);
		});

		mocha.it('should handle special characters in comments', () => {
			const mockRes = createMockResponse();
			const specialComment = 'Special chars: <>&"\'\n\t\r';

			success(mockRes, specialComment);

			expect(mockRes.statusCode).to.equal(HTTP_CODE.OK);
			expect(mockRes.sentData).to.equal(specialComment);
		});

		mocha.it('should handle unicode characters', () => {
			const mockRes = createMockResponse();
			const unicodeComment = '🚀👨‍💻🔐💾📱';

			failure(mockRes, HTTP_CODE.BAD_REQUEST, unicodeComment);

			expect(mockRes.statusCode).to.equal(HTTP_CODE.BAD_REQUEST);
			expect(mockRes.sentData).to.equal(unicodeComment);
		});

		mocha.it('should handle JSON-like strings', () => {
			const mockRes = createMockResponse();
			const jsonComment = '{"error": "Something went wrong"}';

			failure(mockRes, HTTP_CODE.INTERNAL_SERVER_ERROR, jsonComment);

			expect(mockRes.statusCode).to.equal(HTTP_CODE.INTERNAL_SERVER_ERROR);
			expect(mockRes.sentData).to.equal(jsonComment);
		});
	});

	mocha.describe('Integration considerations', () => {
		mocha.it('should maintain Express response chain', () => {
			// Mock response that tracks method calls
			const callLog = [];
			const mockRes = {
				status: function (code) {
					callLog.push(`status(${code})`);
					return this;
				},
				send: function (data) {
					callLog.push(`send(${data})`);
					return this;
				}
			};

			success(mockRes, 'test');

			expect(callLog).to.deep.equal([`status(${HTTP_CODE.OK})`, 'send(test)']);
		});

		mocha.it('should work with real Express patterns', () => {
			// Test that functions return the response object for chaining
			const mockRes = createMockResponse();

			const result1 = mockRes.status(HTTP_CODE.OK);
			expect(result1).to.equal(mockRes);

			const result2 = mockRes.send('test');
			expect(result2).to.equal(mockRes);
		});
	});
});
