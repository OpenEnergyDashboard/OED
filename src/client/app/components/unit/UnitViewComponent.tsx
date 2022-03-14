import * as React from 'react'; 
import {Button} from 'reactstrap'; 
import { UnitData } from '../../types/redux/unit';
import { FormattedMessage, injectIntl, WrappedComponentProps } from 'react-intl';



interface UnitViewProps {
    id: number; 
    unit: UnitData;
    isEdited: boolean;
	isSubmitting: boolean;
	loggedInAsAdmin: boolean;

    //editUnitDetails(unit: UnitMetadata): EditUnitDetailsAction;
}

type UnitViewPropsWithIntl = UnitViewProps & WrappedComponentProps;

class UnitViewComponent extends React.Component<UnitViewPropsWithIntl, {}> {
    constructor(props: UnitViewPropsWithIntl){
        super(props); 
    }
    public render() {
        const loggedInAsAdmin = this.props.loggedInAsAdmin;
        return (
            <tr>
                {loggedInAsAdmin && <td> {this.props.unit.id} {this.formatStatus()} </td>}
                {loggedInAsAdmin && <td> {this.props.unit.name} {this.formatStatus()} </td>}
                {loggedInAsAdmin && <td> {this.props.unit.identifier} {this.formatStatus()} </td>}
                {loggedInAsAdmin && <td> {this.props.unit.unitRepresent} {this.formatStatus()} </td>}
                {loggedInAsAdmin && <td> {this.props.unit.secInRate} {this.formatStatus()} </td>}
                {loggedInAsAdmin && <td> {this.props.unit.typeOfUnit} {this.formatStatus()} </td>}
                {loggedInAsAdmin && <td> {this.props.unit.suffix} {this.formatStatus()} </td>}
                {loggedInAsAdmin && <td> {this.props.unit.displayable} {this.formatStatus()} </td>}
                {loggedInAsAdmin && <td> {this.props.unit.preferredDisplay} {this.formatStatus()} </td>}
                {loggedInAsAdmin && <td> {this.props.unit.note} {this.formatStatus()} </td>}
            </tr>
        );
    }

    private formatStatus(): string {
		if (this.props.isSubmitting) {
			return '(' + this.props.intl.formatMessage({id: 'submitting'}) + ')';
		}

		if (this.props.isEdited) {
			return this.props.intl.formatMessage({id: 'edited'});
		}

		return '';
	}
}
export default injectIntl(UnitViewComponent);