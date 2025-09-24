/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

describe("Navigation to Groups Page", () => {
	beforeEach(() => {
		// Visit the application home page
		cy.visit("/");
	});

	it("should navigate to the Groups page when 'Groups' is clicked from the Pages dropdown", () => {
		// Open the Pages dropdown
		cy.get("#header > div > div.col-4.justify-content-end.d-lg-flex.d-none > div > nav > div > ul > li:nth-child(2) > a").click();

		// Click the 'Groups' option in the dropdown
		cy.contains("Groups").click();

		// Verify that the Groups page has the correct title
		cy.get("h2").should("have.text", "Groups");

		// Verify the tooltip icon is present in the title
		cy.get("h2 > div > i").should("have.attr", "data-for", "groups");
		cy.get("h2 > div > i").should("have.attr", "data-tip", "help.groups.groupview");
	});
});
