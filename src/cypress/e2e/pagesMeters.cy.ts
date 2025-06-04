/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

describe("Navigation to Meters Page", () => {
	beforeEach(() => {
		// Visit the application home page
		cy.visit("/");
	});

	it("should navigate to the Meters page when 'Meters' is clicked from the Pages dropdown", () => {
		// Open the Pages dropdown
		cy.get("#header > div > div.col-4.justify-content-end.d-lg-flex.d-none > div > nav > div > ul > li:nth-child(2) > a").click();

		// Click the 'Meters' option in the dropdown
		cy.get("#header > div > div.col-4.justify-content-end.d-lg-flex.d-none > div > nav > div > ul > li.dropdown.show.nav-item > div > a:nth-child(6)").click();


		// Verify that the Meters page has the correct title
		cy.get("h2").should("have.text", "Meters");

		// Verify the tooltip icon is present in the title
		cy.get("h2 > div > i").should("have.attr", "data-for", "meters");
		cy.get("h2 > div > i").should("have.attr", "data-tip", "help.meters.meterview");
	});
});
