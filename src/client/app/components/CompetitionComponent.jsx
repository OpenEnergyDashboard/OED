import React from 'react';
import CompetitionContentContainer from '../containers/CompetitionContentContainer';

 export default class CompetitionComponent extends React.Component {

 	constructor(props) {
 		super(props);
 	// 	this.handleMeterSelect = this.handleMeterSelect.bind(this);
 	}



 	render() {
 	// 	const labelStyle = {
 	// 		textDecoration: 'underline'
 	// 	};
 	// 	const divPadding = {
 	// 		paddingTop: '35px'
 	// 	};
 		return (
      <div>
        <CompetitionContentContainer />
      </div>
    );
 	}
 }
