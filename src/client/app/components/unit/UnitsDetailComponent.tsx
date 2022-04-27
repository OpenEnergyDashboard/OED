/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import HeaderContainer from '../../containers/HeaderContainer';
import FooterContainer from '../../containers/FooterContainer';
import UnitViewContainer from '../../containers/unit/UnitViewContainer';
import store from '../../index';
import TooltipHelpContainerAlternative from '../../containers/TooltipHelpContainerAlternative';
import UnsavedWarningContainer from '../../containers/UnsavedWarningContainer';
import { removeUnsavedChanges } from '../../actions/unsavedWarning';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import CreateUnitContainer from '../../containers/unit/CreateUnitContainer';

interface UnitsDetailProps{
	loggedInAsAdmin: boolean;
	units: number[];
	unsavedChanges: boolean;
	fetchUnitsDetails(): Promise<any>;
	submitEditedUnits(): Promise<any>;
}

export default class UnitsDetailContainer extends React.Component<UnitsDetailProps> {
	constructor(props: UnitsDetailProps) {
		super(props);
		this.handleSubmitClicked = this.handleSubmitClicked.bind(this);
	}

	public componentWillMount() {
		this.props.fetchUnitsDetails();
	}

	public render() {
		const loggedInAsAdmin = this.props.loggedInAsAdmin;

		const titleStyle: React.CSSProperties = {
			textAlign: 'center'
		};

		const tooltipStyle = {
			display: 'inline-block',
			fontSize: '50%',
			tooltipUnitView: loggedInAsAdmin? 'help.admin.unitview' : 'help.units.unitview'
		};
		return (
			<div>
				<UnsavedWarningContainer />
				<HeaderContainer />
				<TooltipHelpContainerAlternative page='units' />

				<div className='container-fluid'>
					<h2 style={titleStyle}>
						<FormattedMessage id='units' />
						<div style={tooltipStyle}>
							<TooltipMarkerComponent page='units' helpTextId={tooltipStyle.tooltipUnitView} />
						</div>
					</h2>
					{loggedInAsAdmin && <div className="edit-btn">
						<CreateUnitContainer/>
						{/* @TODO:
							Currently, when a new unit is added, you will need to referesh the unit page in order to see the new unit
							It would great to implements a function that would auto referesh the page when a new unit is added.*/}
					</div>}
					<div className="card-container">
						{ this.props.units.map(unitID =>
							( <UnitViewContainer key={unitID} id={unitID} show={false} onHide={false} onSubmitClicked={this.handleSubmitClicked}/> ))}
					</div>
				</div>
				<FooterContainer />
			</div>
		);
	}

	private removeUnsavedChanges() {
		store.dispatch(removeUnsavedChanges());
	}

	private handleSubmitClicked() {
		this.props.submitEditedUnits();
		this.removeUnsavedChanges();
	}
}