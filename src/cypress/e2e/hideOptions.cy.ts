/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

describe("Options Menu Tests", () => {
	beforeEach(() => {
		// Visit the OED application
		cy.visit("/");
	});

	it("should toggle the visibility of graph configuration options when 'Hide options' is clicked", () => {
		// Open the Options dropdown
		cy.get("#header > div > div.col-4.justify-content-end.d-lg-flex.d-none > div > nav > div > ul > li:nth-child(3) > a").click();

		// Click "Hide options"
		cy.get("#header > div > div.col-4.justify-content-end.d-lg-flex.d-none > div > nav > div > ul > li.dropdown.show.nav-item > div > button:nth-child(2)").click();

		// Verify that graph configuration options are hidden
		cy.get("#header > div > div.col-4.justify-content-end.d-lg-flex.d-none > div > nav > div > ul > li:nth-child(2) > a").should("not.exist"); // pages
		cy.get("#header > div > div.col-4.justify-content-end.d-lg-flex.d-none > div > nav > div > ul > li:nth-child(3) > a").should("not.exist"); // options
		cy.get("#header > div > div.col-4.justify-content-end.d-lg-flex.d-none > div > nav > div > ul > a:nth-child(4)").should("not.exist"); // help



		// Click "Menu" again to toggle visibility back
		cy.get("#header > div > div.col-4.justify-content-end.d-lg-flex.d-none > div > button").click();
		cy.get("body > div:nth-child(4) > div > div.modal.fade.show > div > div > div.modal-header > div > h6 > div > nav > div > ul > li:nth-child(3) > a").click();
		cy.get("body > div:nth-child(4) > div > div.modal.fade.show > div > div > div.modal-header > div > h6 > div > nav > div > ul > li.dropdown.show.nav-item > div > button:nth-child(2)").click();



		cy.get("#header > div > div.col-4.justify-content-end.d-lg-flex.d-none > div > nav > div > ul > li:nth-child(2) > a").should("be.visible"); // pages
		cy.get("#header > div > div.col-4.justify-content-end.d-lg-flex.d-none > div > nav > div > ul > li:nth-child(3) > a").should("be.visible"); // options
		cy.get("#header > div > div.col-4.justify-content-end.d-lg-flex.d-none > div > nav > div > ul > a:nth-child(4)").should("be.visible"); // help


	});
});
