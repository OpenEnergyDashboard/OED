//Cypress test for resetDatabase.js - Angel43v3r

describe('Database Reset', () => {
    it('should reset and repopulate the test database', () => {
        cy.log('Starting resetDatabase...')
        cy.task('resetDatabase').then((output: string) => {
            cy.log(`Database Reset Output: ${output}`);
            console.log('Full output:', output);
            expect(output).to.include('Finished generating the test data');
        });
    });
});