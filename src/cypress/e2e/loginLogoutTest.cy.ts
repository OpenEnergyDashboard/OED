/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import LocaleTranslationData from '../../client/app/translations/data';

// Pick the current locale (default to English if none is set)
const locale = Cypress.env('locale') || 'en';
const translate = LocaleTranslationData[locale];

/**
 * Returns the "Options" button in the navbar/dropdown menu.
 *
 * Uses a translation key so tests work in any supported language.
 * The `.last()` call ensures we get the most recent instance if there
 * are multiple matches (e.g. desktop vs mobile DOM differences).
 */
function getOptionsButton() {
	return cy.get(`a.dropdown-toggle:contains("${translate['options']}")`).last();
}

/**
 * Returns the currently visible dropdown menu.
 *
 * Some dropdowns may exist in the DOM but be hidden; this ensures
 * we only interact with the one that is open.
 */
function getVisibleDropdown() {
	return cy.get('.dropdown-menu:visible');
};

/**
 * Returns the top-most visible modal dialog.
 *
 * Useful for login forms and other popups. The `.should('be.visible')`
 * assertion ensures Cypress waits until the modal is actually rendered
 * and ready for interaction.
 */
function nextTopModal() {
	return cy.get('.modal.show').last().should('be.visible');
};

describe('Login/Logout UI Tests for Open Energy Dashboard', () => {
	// Define viewports for responsive testing
	const viewports = [
		{ name: 'desktop', width: 1280, height: 800 },
		{ name: 'mobile', width: 375, height: 667 }
	];

	viewports.forEach(({ name, width, height }) => {
		context(`${name} viewport`, () => {

			before(() => {
				cy.visit('/');
				cy.viewport(width, height);
			});

			it('should allow a user to login and logout successfully', () => {

				// On mobile, we have to click the menu button first
				if (name == 'mobile') {
					cy.contains('button', translate['menu']).click();
				};

				getOptionsButton().click();

				//login test
				getVisibleDropdown().contains('button', translate['log.in'])
					.should('be.visible')
					.click();

				nextTopModal().find('h5.modal-title').should('contain', translate['log.in']);

				// Close button
				nextTopModal().contains('button', translate['close'])
					.should('be.visible');

				// Submit button (disabled initially)
				nextTopModal().contains('button', translate['calibration.submit.button'])
					.should('exist')
					.and('be.disabled');

				// Username input
				nextTopModal().get('input#username')
					.should('be.visible')
					.and('have.attr', 'type', 'text')
					.type('test');

				// password input
				nextTopModal().get('input#password')
					.should('be.visible')
					.and('have.attr', 'type', 'password')
					.type('password');

				// submit button should work now
				nextTopModal().contains('button', translate['calibration.submit.button'])
					.should('not.be.disabled')
					.click();

				// we should get a success popup and close it.
				cy.get('.Toastify__toast--success')
					.should('contain', 'Login Successful')
					.find('.Toastify__close-button')
					.click();

				// logout test
				getOptionsButton().click();

				getVisibleDropdown().contains('button', translate['log.in'])
					.should('not.be.visible');

				getVisibleDropdown().contains('button', translate['log.out'])
					.should('be.visible')
					.click();

				getOptionsButton().click();

				getVisibleDropdown().contains('button', translate['log.in'])
					.should('be.visible');

				getVisibleDropdown().contains('button', translate['log.out'])
					.should('not.be.visible');
			});
		});
	});
});
