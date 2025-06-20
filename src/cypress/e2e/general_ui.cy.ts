/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// TODO: The commented out tests were attempts to test the UI that are
// not yet working. They need to be fixed.

describe('UI Functionality Tests for Open Energy Dashboard', () => {
	beforeEach(() => {
		// Visit the page before each test
		cy.visit('/');
	});

	// it('Tests all buttons functionality', () => {
	// 	// Ensure buttons are visible and clickable
	// 	cy.get('button').should('have.length.greaterThan', 0); // Ensure buttons exist
	// 	cy.get('button').each((button) => {
	// 		cy.wrap(button).should('be.visible'); // Check visibility
	// 		cy.wrap(button).click({ force: true }); // Test click
	// 	});
	// });

	// it('Tests all form inputs', () => {
	// 	// Test text and email inputs
	// 	cy.get('input[type="text"], input[type="email"]').each((input) => {
	// 		cy.wrap(input).should('be.visible').type("Sample Text"); // Check visibility and type
	// 	});

	// 	// Test password inputs
	// 	cy.get('input[type="password"]').each((input) => {
	// 		cy.wrap(input).should('be.visible').type('password');
	// 	});

	// 	// Test textareas
	// 	cy.get('textarea').each((textarea) => {
	// 		cy.wrap(textarea).should('be.visible').type('Sample description text');
	// 	});

	// 	// Submit forms
	// 	cy.get('form').each((form) => {
	// 		cy.wrap(form).within(() => {
	// 			cy.get('button[type="submit"], input[type="submit"]').click({ force: true });
	// 		});
	// 	});
	// });

	// it('Tests dropdown menus', () => {
	// 	// Ensure dropdowns are visible and options are selectable
	// 	cy.get('select').should('have.length.greaterThan', 0); // Ensure dropdowns exist
	// 	cy.get('select').each((dropdown) => {
	// 		cy.wrap(dropdown)
	// 			.should('be.visible') // Check visibility
	// 			.find('option')
	// 			.should('have.length.greaterThan', 1); // Ensure options exist

	// 		// Select the first option (change index as needed)
	// 		cy.wrap(dropdown).select(0);
	// 	});
	// });

	it('Tests links for navigation', () => {
		// Ensure links have valid href attributes
		cy.get('a[href]').each((link) => {
			cy.wrap(link).should('have.attr', 'href').and('not.be.empty'); // Check href exists
		});
	});

	// it('Tests modals for correct behavior', () => {
	// 	// Ensure modals can be triggered and closed
	// 	cy.get('[data-bs-toggle="modal"]').each((modalTrigger) => {
	// 		cy.wrap(modalTrigger).should('be.visible').click(); // Trigger modal
	// 		cy.get('.modal').should('be.visible'); // Check modal is visible
	// 		cy.get('.modal .close').click(); // Close modal
	// 		cy.get('.modal').should('not.be.visible'); // Check modal is closed
	// 	});
	// });
	// it('Tests tables for data population', () => {
	// 	// Ensure tables are populated with rows
	// 	cy.get('table').should('have.length.greaterThan', 0); // Ensure tables exist
	// 	cy.get('table').each((table) => {
	// 		cy.wrap(table).find('tr').should('have.length.greaterThan', 1); // At least one row
	// 	});
	// });
	// it('Tests interactive inputs (checkboxes and radio)', () => {
	// 	// Check and uncheck checkboxes
	// 	cy.get('input[type="checkbox"]').each((checkbox) => {
	// 		cy.wrap(checkbox).check({ force: true }).should('be.checked'); // Check it
	// 		cy.wrap(checkbox).uncheck({ force: true }).should('not.be.checked'); // Uncheck it
	// 	});
	// 	cy.get('input[type="radio"]').each((radio) => {
	// 		cy.wrap(radio).check({ force: true }).should('be.checked'); // Check radio
	// 	});
	// });
	// it('Tests for dynamic elements', () => {
	// 	// Ensure dynamically loaded elements exist and are visible
	// 	cy.get('[data-dynamic]').should('exist').and('be.visible');
	// });
});
