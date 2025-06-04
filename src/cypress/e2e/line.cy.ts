/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

 // TODO These tests assume a clean setup/test data. In the future we should wipe the database
 // and load the needed data (maybe without the actual meter data until needed) in a similar way
 // to how the Chai/Mocha tests work.

// This test is a great template to start with for understanding testing using cypress.
describe('testing line graph selecting groups and meters and test for plotly line graph ', () => {
	beforeEach(() => {
		// Visit the OED application
		cy.visit('/');
	});

	// Graph Type is Line.
	// TODO This is the default line type when OED is created but can be changed by the admin. It might be good
	//      to first set it to this value at some point (but it does make another possible failure).
	it('should display a line graph type automatically', () => {
		// Find the line chart
		cy.get('#root > div:nth-child(2) > div.container-fluid.flexGrowOne > div > div.col-2.d-none.d-lg-block > div > div.dropdown > button').should('have.text', 'Line');
		cy.screenshot('ShowLineTypeOption')

	});
	// Checking all group options
	it('groups should be clickable and display 10 options and 1 incompatible option', () => {
		// Find and click the group 
		cy.get('#root > div:nth-child(2) > div.container-fluid.flexGrowOne > div > div.col-2.d-none.d-lg-block > div > div:nth-child(4) > div:nth-child(2) > div > div.css-1fdsijx-ValueContainer').click().should('be.visible');
		// Check if the 10 options are there
		cy.get('#react-select-2-listbox > div:nth-child(1) > div:nth-child(2)').children().should('have.length', 10);
		cy.get('#react-select-2-group-0-heading > div > span.badge.bg-primary.rounded-pill').should('have.text', '10');
		// check if the incompatible option is visible and not clickable
		cy.get('#react-select-2-option-1-0').should('exist')
			.should('have.attr', 'aria-disabled', 'true') // Check the aria-disabled attribute
			.should('have.attr', 'tabindex', '-1') // Validate tabindex to confirm it’s not focusable
	});
	// Checking all meter options
	it('selecting menu option should display 25 options and plotly graph', () => {
		// open menu option
		cy.get("#root > div:nth-child(2) > div.container-fluid.flexGrowOne > div > div.col-2.d-none.d-lg-block > div > div:nth-child(4) > div:nth-child(4) > div > div.css-1fdsijx-ValueContainer").click().should('be.visible');
		// Verify all options
		cy.get("#react-select-3-listbox > div > div:nth-child(2)").children().should('have.length', 25);
		// click on Cos 23 Min KWH
		cy.get("#react-select-3-option-0-0").should('exist').click();

		// plotly element show be dynamically created: check for plotly display
		cy.get("#root > div:nth-child(2) > div.container-fluid.flexGrowOne > div > div.col-12.col-lg-10.align-self-auto.text-center > div > div.js-plotly-plot > div")
			.should('exist');

		//meter name should be displayed
		cy.get("#root > div:nth-child(2) > div.container-fluid.flexGrowOne > div > div.col-12.col-lg-10.align-self-auto.text-center > div > div.js-plotly-plot > div > div > svg:nth-child(3) > g.infolayer > g.legend > g > g > g > text").should('have.text', 'Cos 23 Min kWh');

		// checking x-axis labels
		cy.get("#root > div:nth-child(2) > div.container-fluid.flexGrowOne > div > div.col-12.col-lg-10.align-self-auto.text-center > div > div.js-plotly-plot > div > div > svg:nth-child(1) > g.cartesianlayer > g > g.xaxislayer-above > g:nth-child(1) > text").should('have.text', 'Mar 2020');
		cy.get("#root > div:nth-child(2) > div.container-fluid.flexGrowOne > div > div.col-12.col-lg-10.align-self-auto.text-center > div > div.js-plotly-plot > div > div > svg:nth-child(1) > g.cartesianlayer > g > g.xaxislayer-above > g:nth-child(2) > text").should('have.text', 'May 2020');
		cy.get("#root > div:nth-child(2) > div.container-fluid.flexGrowOne > div > div.col-12.col-lg-10.align-self-auto.text-center > div > div.js-plotly-plot > div > div > svg:nth-child(1) > g.cartesianlayer > g > g.xaxislayer-above > g:nth-child(3) > text").should('have.text', 'Jul 2020');
		cy.get("#root > div:nth-child(2) > div.container-fluid.flexGrowOne > div > div.col-12.col-lg-10.align-self-auto.text-center > div > div.js-plotly-plot > div > div > svg:nth-child(1) > g.cartesianlayer > g > g.xaxislayer-above > g:nth-child(4) > text").should('have.text', 'Sep 2020');
		cy.get("#root > div:nth-child(2) > div.container-fluid.flexGrowOne > div > div.col-12.col-lg-10.align-self-auto.text-center > div > div.js-plotly-plot > div > div > svg:nth-child(1) > g.cartesianlayer > g > g.xaxislayer-above > g:nth-child(5) > text").should('have.text', 'Nov 2020');

		// checking y-axis labels
		cy.get("#root > div:nth-child(2) > div.container-fluid.flexGrowOne > div > div.col-12.col-lg-10.align-self-auto.text-center > div > div.js-plotly-plot > div > div > svg:nth-child(1) > g.cartesianlayer > g > g.yaxislayer-above > g:nth-child(1) > text").should('have.text', '0');
		cy.get("#root > div:nth-child(2) > div.container-fluid.flexGrowOne > div > div.col-12.col-lg-10.align-self-auto.text-center > div > div.js-plotly-plot > div > div > svg:nth-child(1) > g.cartesianlayer > g > g.yaxislayer-above > g:nth-child(2) > text").should('have.text', '0.5');
		cy.get("#root > div:nth-child(2) > div.container-fluid.flexGrowOne > div > div.col-12.col-lg-10.align-self-auto.text-center > div > div.js-plotly-plot > div > div > svg:nth-child(1) > g.cartesianlayer > g > g.yaxislayer-above > g:nth-child(3) > text").should('have.text', '1');
		cy.get("#root > div:nth-child(2) > div.container-fluid.flexGrowOne > div > div.col-12.col-lg-10.align-self-auto.text-center > div > div.js-plotly-plot > div > div > svg:nth-child(1) > g.cartesianlayer > g > g.yaxislayer-above > g:nth-child(4) > text").should('have.text', '1.5');
		cy.get("#root > div:nth-child(2) > div.container-fluid.flexGrowOne > div > div.col-12.col-lg-10.align-self-auto.text-center > div > div.js-plotly-plot > div > div > svg:nth-child(1) > g.cartesianlayer > g > g.yaxislayer-above > g:nth-child(5) > text").should('have.text', '2');
		cy.get("#root > div:nth-child(2) > div.container-fluid.flexGrowOne > div > div.col-12.col-lg-10.align-self-auto.text-center > div > div.js-plotly-plot > div > div > svg:nth-child(1) > g.cartesianlayer > g > g.yaxislayer-above > g:nth-child(6) > text").should('have.text', '2.5');
		cy.get("#root > div:nth-child(2) > div.container-fluid.flexGrowOne > div > div.col-12.col-lg-10.align-self-auto.text-center > div > div.js-plotly-plot > div > div > svg:nth-child(1) > g.cartesianlayer > g > g.yaxislayer-above > g:nth-child(7) > text").should('have.text', '3');


		/*
		TODO: We want to check if the graph displays correct information.     
		After a meter or group is selected a get request is made to the server to get the data for the graph to the following endpoint:
		http://localhost:3000/api/unitReadings/line/meters/21?timeInterval=all&graphicUnitId=1
		The response is a json object with the data that is used to plot the graph.
		It might be possible to check the json object to see if the data is correct.    

		Testing methods to 
		The line in the graph is rendered as path class ="js-line" 

		Main Graph:
		#root > div:nth-child(2) > div.container-fluid.flexGrowOne > div > div.col-12.col-lg-10.align-self-auto.text-center > div > div.js-plotly-plot > div > div > svg:nth-child(1) > g.cartesianlayer > g > g.plot > g > g > g.lines > path

		Drag Bar:
		#root > div:nth-child(2) > div.container-fluid.flexGrowOne > div > div.col-12.col-lg-10.align-self-auto.text-center > div > div.js-plotly-plot > div > div > svg:nth-child(3) > g.infolayer > g.rangeslider-container > g.rangeslider-rangeplot.xy > g.plot > g > g > g.lines > path

		We could possibly simulate moving a mouse over the graph to check if the data is correct.
		Clicking and dragging the bottom drag bar then refreshing the page
		
		And checking the time interval in which the data is displayed. (From seconds to day...)
		*/
	});
});
