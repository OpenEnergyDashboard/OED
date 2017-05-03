import React from 'react';
import CompetitionContentContainer from '../containers/CompetitionContentContainer';


/**
 * competition page
 */
export default class CompetitionComponent extends React.Component {

	constructor(props) {
		super(props);
	}



	render() {

		return (
    <div>
      <CompetitionContentContainer />
    </div>
  );
	}
}
