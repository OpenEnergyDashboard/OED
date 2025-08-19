const viewports = [
	{ name: 'desktop', width: 1280, height: 800 },
	{ name: 'mobile',  width: 375,  height: 667 }
];

// before(() => {
// 	cy.visit('/');
// });



describe('Login/Logout UI Tests for Open Energy Dashboard', () => {
	viewports.forEach(({ name, width, height }) => {
		context(`${name} viewport`, () => {

			before(()=> {
				cy.visit('/');
				cy.viewport(width, height);
			});

			// beforeEach(()=>{
			// 	cy.visit('/');
			//	cy.viewport(width, height);
			// });

			function openOptions(){
				if(name == 'mobile'){
					cy.contains('button', 'Menu')
						.click();
					cy.get('.modal.show')
						.should('be.visible')
						.find('a.dropdown-toggle')
						.contains('Options')
						.click();

					return cy.get('.modal.show .dropdown-menu').should('be.visible');
				} else {
					cy.contains('a.dropdown-toggle', 'Options')
						.scrollIntoView()
						.click();
					return cy.get('.dropdown-menu').should('be.visible');
				}
			}

			it('should allow a user to login and logout successfully',()=>{

				//login test
				openOptions().contains('button','Log in')
					.should('be.visible')
					.click();

					//div class="modal fade show" style="display: block;" aria-modal="true" role="dialog" tabindex="-1"

				cy.get('.modal.fade.show')
					.last()
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

				cy.get('.modal.show')
					.last()
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



				// logout test
				cy.contains('a.dropdown-toggle', 'Options')
					.should('be.visible')
					.click();

				cy.contains('button','Log in')
					.should('not.be.visible');

				cy.contains('button','Log out')
					.should('be.visible')
					.click();

				cy.contains('a.dropdown-toggle', 'Options')
					.should('be.visible')
					.click();

				cy.contains('button','Log in')
					.should('be.visible');

				cy.contains('button','Log out')
					.should('not.be.visible');
			});
		});
	});
});
