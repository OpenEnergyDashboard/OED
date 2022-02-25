import * as React from 'react';
import { Table, Button } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import { hasToken } from '../../utils/token';
import HeaderContainer from '../../containers/HeaderContainer';
import FooterContainer from '../../containers/FooterContainer';
import {Link} from 'react-router-dom';
import TooltipHelpContainerAlternative from '../../containers/TooltipHelpContainerAlternative';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import { removeUnsavedChanges } from '../../actions/unsavedWarning';
import store from '../../index';
import UnsavedWarningContainer from '../../containers/UnsavedWarningContainer';


export default class UnitsDetailContainer extends React.Component {
    constructor(props: any) {
        super(props);
    }


    public render() {
        const titleStyle: React.CSSProperties = {
			textAlign: 'center'
		};

		const tableStyle: React.CSSProperties = {
			marginLeft: '5%',
			marginRight: '5%'
		};

		const buttonContainerStyle: React.CSSProperties = {
			minWidth: '150px',
			width: '10%',
			marginLeft: '40%',
			marginRight: '40%'
		};

		const tooltipStyle = {
			display: 'inline-block',
			fontSize: '50%'
		};
        return (
            <div>
				<UnsavedWarningContainer />
				<HeaderContainer />
				<div className='container-fluid'>
					<h2 style={titleStyle}>
						<div style={tooltipStyle}>
						</div>
					</h2>
					<div style={tableStyle}>
					<Table striped bordered hover>
                        <thead>
                            <tr>
                                <th><FormattedMessage id="unit.id"/></th>
                                <th><FormattedMessage id="unit.name"/></th>
                                <th><FormattedMessage id="unit.identifier"/></th>
                                <th><FormattedMessage id="unit.represent"/></th>
                                <th><FormattedMessage id="unit.sec_in_rate"/></th>
                                <th><FormattedMessage id="unit.type_of_unit"/></th>
                                <th><FormattedMessage id="unit.suffix"/></th>
                                <th><FormattedMessage id="unit.displayable"/></th>
                                <th><FormattedMessage id="unit.preffered_display"/></th>
                                <th><FormattedMessage id="unit.note"/></th>
                                <th><FormattedMessage id="unit.remove"/></th>
                            </tr>
                            <tr>
                                <td colSpan={11}>
                                    {/* 
                                    Need to implement addUnit route later
                                     */}
                                    <Link to="/addUnit">
                                        <Button style={buttonContainerStyle} color='primary'>
                                            <FormattedMessage id="create.unit"/>
                                        </Button>
                                    </Link>
                                </td>
                            </tr>
                        </thead>
					</Table>
					</div>
				</div>
				<FooterContainer />
			</div>
        );
    }
}