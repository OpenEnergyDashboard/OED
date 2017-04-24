/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
// This is the main component for the groups display page
import { Link } from 'react-router';
import React from 'react';
import LogoComponent from '../LogoComponent';
import GroupViewContainer from '../../containers/groups/GroupViewContainer';
import GroupSidebarContainer from '../../containers/groups/GroupSidebarContainer';

export default class GroupComponent extends React.Component {

	constructor(props) {
		super(props);
	}

	componentWillMount() {
		this.props.fetchGroupsDetailsIfNeeded();
		this.props.fetchMetersDetailsIfNeeded();
		this.props.selectGroups(this.props.selectedGroups);
	}

	render() {
		const center = {
			display: 'table',
			tableLayout: 'auto',
			width: '100%'
		};
		const backButton = {
			float: 'right',
			width: '15%',
		};

		const boxStyle = {
			// todo: testing hack
			display: 'inline-block',
			textAlign: 'center',
			width: '100%'
		};

		const footerStyle = {
			width: '100%',
			position: 'fixed',
			bottom: '0'
		};

		// todo: The back link currently messes with the react display on the main page
		return (
			<div>
				<div className="groupDisplay col-xs-12">
					<Link to="/"><LogoComponent url="./app/images/logo.png" /> </Link>
					<h1 style={boxStyle}>Group Main Page</h1>
					<div className="col-xs-2">
						<GroupSidebarContainer />
					</div>
					<div className="col-xs-10">
						{this.props.selectedGroups.map(groupID =>
							<div key={groupID} className="col-xs-12"><GroupViewContainer key={groupID} id={groupID} /></div>
						)}
					</div>

				</div>
				<div style={footerStyle}>
					<Link style={backButton} to="/">
						<button className="btn btn-default">Back to Dashboard</button>
					</Link>
				</div>
			</div>
		);
	}
}
