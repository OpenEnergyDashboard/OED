const viewports = [
	{ name: 'desktop', width: 1280, height: 800 },
	{ name: 'mobile',  width: 375,  height: 667 }
];

before(() => {
	cy.visit('/');
});

describe('Login/Logout UI Tests for Open Energy Dashboard', () => {
	viewports.forEach(({ name, width, height }) => {
		context(`${name} viewport`, () => {

			beforeEach(()=> {
				cy.viewport(width, height);
			});

			if(name == 'mobile'){
				it('should open the menu (mobile viewport only)',()=>{
					cy.contains('button', 'Menu')
						.click();
				})
			};

			it('should open the login modal when clicking Log in',()=>{
				cy.contains('a.dropdown-toggle', 'Options')
					.click();

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

			it('should login successfully with test credentials', ()=>{
				cy.get('.modal.show')
					.within(() => {
						cy.get('#username').type('test');
						cy.get('#password').type('password');
						cy.contains('button','Submit')
							.should('not.be.disabled')
							.click();
					});
			});

			it('should find and close the login success popup', ()=>{
				cy.get('.Toastify__toast--success')
					.should('contain','Login Successful')
					.find('.Toastify__close-button')
					.click();
			});


			// it('should log in successfully with test credentials',()=>{

			// 	testLogIn();

			// 	cy.contains('a.dropdown-toggle', 'Options')
			// 		.click();

			// 	cy.contains('.dropdown-menu button','Log out')
			// 		.should('be.visible');

			// 	cy.contains('.dropdown-menu button','Log in')
			// 		.should('not.be.visible');

			// });

			// it('should log out successfully', () => {
			// 	testLogIn();
			// 	cy.contains('a.dropdown-toggle', 'Options')
			// 		.click();

			// 	cy.contains('.dropdown-menu button','Log out')
			// 		.should('be.visible')
			// 		.click();

			// 	cy.contains('a.dropdown-toggle', 'Options')
			// 		.click();

			// 	cy.contains('.dropdown-menu button','Log out')
			// 		.should('not.be.visible');
			// 	cy.contains('.dropdown-menu button','Log in')
			// 		.should('be.visible');
			// });
		});
	});
});
