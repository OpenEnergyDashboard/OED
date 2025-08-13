/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const viewports = [
	{ name: 'desktop', width: 1280, height: 800 },
	{ name: 'mobile',  width: 375,  height: 667 }
];

beforeEach(() => {
	// Visit the page before each test
	cy.visit('/');
});

viewports.forEach(({ name, width, height }) => {
	describe('UI Functionality Tests for Open Energy Dashboard', () => {
		context(`${name} viewport`, () => {
			before(() => {
				cy.viewport(width, height);
			});

			it('should find and click all buttons', () => {
				cy.get('button').each((button) => {
					cy.wrap(button).should('have.length.greaterThan', 0);
					cy.wrap(button).click({ force: true }); // Test click
				});
			});

			it(`should click all visible buttons`, () => {
				cy.get('button:visible').then(($buttons) => {
					const count = $buttons.length;
					cy.log(`Found ${count} visible buttons on ${name}`)
				});
				cy.get('button:visible').each(($btn) => {
					cy.wrap($btn)
						.scrollIntoView()
						.click();
				});

			});

			function testDropdown(labelText: string){
				cy.contains('a.dropdown-toggle',labelText)
					.as('toggleLink')
					.should('have.attr','aria-expanded','false');

				cy.get('@toggleLink')
					.closest('li.dropdown')
					.find('.dropdown-menu')
					.as('dropdownMenu')
					.should('not.be.visible');

				cy.get('@toggleLink').click();

				cy.get('@toggleLink').should('have.attr','aria-expanded','true');

				cy.get('@dropdownMenu').should('be.visible');
			};

			it('should open the Pages dropdown correctly', () => {
				testDropdown('Pages');
			});

			it('should open the Options dropdown correctly', () => {
				testDropdown('Options');
			});

			function testLogIn(){
				cy.contains('a.dropdown-toggle', 'Options')
					.click();

				cy.contains('.dropdown-menu button','Log in')
					.should('be.visible')
					.click();

				cy.get('.modal.show')
					.within(() => {
						cy.get('#username').type('test');
						cy.get('#password').type('password');
						cy.contains('button','Submit')
							.should('not.be.disabled')
							.click();
					});

				cy.get('.Toastify__toast--success')
					.should('contain','Login Successful')
					.find('.Toastify__close-button')
					.click();
			};

			it('should open the login modal when clicking Log in',()=>{
				cy.contains('a.dropdown-toggle', 'Options')
					.click()

				cy.contains('.dropdown-menu button','Log in')
					.should('be.visible')
					.click();

				cy.get('.modal.show')
					.should('be.visible')
					.within(()=>{
						cy.contains('h5.modal-title','Log in')
							.should('exist');

						cy.get('input#username')
							.should('be.visible')
							.and('have.attr','type','text');

						cy.get('input#password')
							.should('be.visible')
							.and('have.attr', 'type', 'password');

						// Submit button (disabled initially)
						cy.contains('button', 'Submit')
							.should('exist')
							.and('be.disabled');

						// Close button
						cy.contains('button', 'Close')
							.should('be.visible');
					});
			});

			it('should log in successfully with test credentials',()=>{

				testLogIn();

				cy.contains('a.dropdown-toggle', 'Options')
					.click();

				cy.contains('.dropdown-menu button','Log out')
					.should('be.visible');

				cy.contains('.dropdown-menu button','Log in')
					.should('not.be.visible');

			});

			it('should log out successfully', () => {
				testLogIn();
				cy.contains('a.dropdown-toggle', 'Options')
					.click();

				cy.contains('.dropdown-menu button','Log out')
					.should('be.visible')
					.click();

				cy.contains('a.dropdown-toggle', 'Options')
					.click();

				cy.contains('.dropdown-menu button','Log out')
					.should('not.be.visible');
				cy.contains('.dropdown-menu button','Log in')
					.should('be.visible');
			});
		});
	});
});
