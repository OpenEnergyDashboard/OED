/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

describe("Language Selector Tests", () => {
	beforeEach(() => {
		// Visit the OED application
		cy.visit("/");
	});

	it("should update the UI and React state when the language is changed", () => {
		// Open the language selection dropdown

		cy.get("#header > div > div.col-4.justify-content-end.d-lg-flex.d-none > div > nav > div > ul > li:nth-child(3) > a").click();
		cy.get("#header > div > div.col-4.justify-content-end.d-lg-flex.d-none > div > nav > div > ul > li.dropdown.show.nav-item > div > div.dropdown.dropstart > a").click();


		// Select a specific language (e.g., Spanish)
		cy.get("#header > div > div.col-4.justify-content-end.d-lg-flex.d-none > div > nav > div > ul > li.dropdown.show.nav-item > div > div.dropdown.dropstart.show > div").contains("Español").click();

		// Verify that UI elements are updated to the selected language
		cy.get("body").should("contain", "Tipo de gráfico"); // Example text in Spanish for "Graph Type"

	});
});
