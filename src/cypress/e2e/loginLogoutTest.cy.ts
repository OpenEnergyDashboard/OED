/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

function getOptionsButton() {
	return cy.get('a.dropdown-toggle:contains("Options")').last();
};

function getVisibleDropdown() {
  return cy.get('.dropdown-menu:visible');
};

function nextTopModal(){
	return cy.get('.modal.show').last().should('be.visible');
};

describe('Login/Logout UI Tests for Open Energy Dashboard', () => {

	const viewports = [
		{ name: 'desktop', width: 1280, height: 800 },
		{ name: 'mobile',  width: 375,  height: 667 }
	];

	viewports.forEach(({ name, width, height }) => {
		context(`${name} viewport`, () => {

			before(()=> {
				cy.visit('/');
				cy.viewport(width, height);
			});

			it('should allow a user to login and logout successfully',()=>{

				// On mobile, we have to click the menu button first
				if(name == 'mobile'){
					cy.contains('button', 'Menu').click();
				};

				getOptionsButton().click();

				//login test
				getVisibleDropdown().contains('button','Log in')
					.should('be.visible')
					.click();

				nextTopModal().find('h5.modal-title').should('contain','Log in');

				// Close button
				nextTopModal().contains('button', 'Close')
					.should('be.visible');

				// Submit button (disabled initially)
				nextTopModal().contains('button', 'Submit')
					.should('exist')
					.and('be.disabled');

				// Username input
				nextTopModal().get('input#username')
					.should('be.visible')
					.and('have.attr','type','text')
					.type('test');

				// password input
				nextTopModal().get('input#password')
					.should('be.visible')
					.and('have.attr', 'type', 'password')
					.type('password');

				// submit button should work now
				nextTopModal().contains('button','Submit')
					.should('not.be.disabled')
					.click();

				// we should get a success popup and close it.
				cy.get('.Toastify__toast--success')
					.should('contain','Login Successful')
					.find('.Toastify__close-button')
					.click();

				// logout test
				getOptionsButton().click();

				getVisibleDropdown().contains('button','Log in')
					.should('not.be.visible');

				getVisibleDropdown().contains('button','Log out')
					.should('be.visible')
					.click();

				getOptionsButton().click();

				getVisibleDropdown().contains('button','Log in')
					.should('be.visible');

				getVisibleDropdown().contains('button','Log out')
					.should('not.be.visible');
			});
		});
	});
});
