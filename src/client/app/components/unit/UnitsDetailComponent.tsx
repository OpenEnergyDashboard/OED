import * as React from 'react';
import { Table, Button } from 'reactstrap';
import { UnitData } from '../../types/redux/unit';
import { FormattedMessage } from 'react-intl';
import {Link} from 'react-router-dom';
import HeaderContainer from '../../containers/HeaderContainer';
import FooterContainer from '../../containers/FooterContainer';
import UnitViewContainer from '../../containers/unit/UnitViewContainer';

import UnsavedWarningContainer from '../../containers/UnsavedWarningContainer';

interface UnitsDetailProps{
    units: number[];
    unsavedChanges: boolean;
    fetchUnitsDetails(): Promise<any>;
}


export default class UnitsDetailContainer extends React.Component<UnitsDetailProps, {}> {
    constructor(props: UnitsDetailProps) {
        super(props);
    }

    public componentWillMount() {
        this.props.fetchUnitsDetails();
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
                        </thead>
                            <tbody>
                                {this.props.units.map(unitID => 
                                    ( <UnitViewContainer key={unitID} id={unitID} /> ))}
                                <tr>
                                    <td colSpan={11}>
                                        <Link to="/addUnit">
                                            <Button style={buttonContainerStyle} color='primary'>
                                                <FormattedMessage id="create.unit"/>
                                            </Button>
                                        </Link>
                                    </td>
                                </tr>
                            </tbody>
					</Table>
					</div>
				</div>
                <FooterContainer />
			</div>
        );
    }
}