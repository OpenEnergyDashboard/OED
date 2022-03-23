import * as React from 'react';
import {Alert, Button, Input} from 'reactstrap';
import { FormattedMessage } from 'react-intl';


// TODO: Add props for state handlers from container
interface CreateUnitFormProps{
    name: string,
    identifier: string,
    unitRepresent: string,
    secInRate: number,
    typeOfUnit: string,
    unitIndex?: number,
    suffix: string,
    displayable: string,
    preferredDisplay: boolean,
    note: string,
    submitNewUnit: () => void;
    handleNameChange: (val: string) => void;
    handleIdentifierChange: (val : string) => void;
    handleUnitRepresentChange: (val : string) => void;
    handleSecInRateChange: (val : number) => void;
    handleTypeOfUnitChange: (val : string) => void;
    handleSuffixChange: (val : string) => void;
    handleDisplayableChange: (val : string) => void;
    handlePreferredDisplayChange: (val : boolean) => void;
    handleNoteChange: (val : string) => void;
}


export default class CreateUnitComponent extends React.Component<CreateUnitFormProps, {}>{
    constructor(props: any){
        super(props);
    }

    public render() {
        const formInputStyle: React.CSSProperties = {
            paddingBottom: '5px'
        }
        const titleStyle: React.CSSProperties = {
            textAlign: 'center'
        };
    
        const tableStyle: React.CSSProperties = {
            marginLeft: '25%',
            marginRight: '25%',
            width: '50%'
        };
        return(
            <div className="containter-fluid">
                {/* add create.unit text */}
                <h1 style={titleStyle}><FormattedMessage id="unit.create_new_unit"/></h1>
                <div style={tableStyle}>
                    <form onSubmit={e => { e.preventDefault(); this.props.submitNewUnit(); }}>
                        <div style={formInputStyle}>
                            {/* need name formatted message */}
                        <label><FormattedMessage id="unit.name"/></label><br />
                        <Input type='text' onChange={({target}) => this.props.handleNameChange(target.value)} required value={this.props.name} />
                        </div>
                        <div style={formInputStyle}>
                            {/* need identfier formatted message */}
                        <label><FormattedMessage id="unit.identifier"/></label><br />
                        <Input type='text' onChange={({target}) => this.props.handleIdentifierChange(target.value)} required value={this.props.identifier} />
                        </div>
                        <div style={formInputStyle}>
                            {/* need name formatted message */}
                        <label><FormattedMessage id="unit.represent"/></label><br />
                        <Input type='select' onChange={({target}) => this.props.handleUnitRepresentChange(target.value)} required value={this.props.unitRepresent}>
                            <option >Select a unit representation</option>
                            <option value='quantity' key='quantity'>Quantity</option>
                            <option value='flow' key='flow'>Flow</option>
                            <option value='raw' key='raw'>raw</option>
                            <option value='unused' key='unused'>Unused</option>
                        </Input>
                        </div>
                        <div style={formInputStyle}>
                            {/* need name formatted message */}
                        <label><FormattedMessage id="unit.sec_in_rate"/></label><br />
                        <Input type='number' onChange={({target}) => this.props.handleSecInRateChange(parseInt(target.value))} required value={this.props.secInRate} />
                        </div>
                        <div style={formInputStyle}>
                            {/* need name formatted message */}
                        <label><FormattedMessage id="unit.type_of_unit"/></label><br />
                        <Input type='select' onChange={({target}) => this.props.handleTypeOfUnitChange(target.value)} required value={this.props.typeOfUnit}>
                            <option >Select a unit</option>
                            <option value='unit' key='unit'>Unit</option>
                            <option value='meter' key='meter'>Meter</option>
                            <option value='suffix' key='suffix'>Suffix</option>
                        </Input>
                        </div>
                        <div style={formInputStyle}>
                            {/* need name formatted message */}
                        <label><FormattedMessage id="unit.suffix"/></label><br />
                        <Input type='text' onChange={({target}) => this.props.handleSuffixChange(target.value)} required value={this.props.suffix} />
                        </div>
                        <div style={formInputStyle}>
                        <label><FormattedMessage id="unit.displayable"/></label><br />
                        <Input type='select' onChange={({target}) => this.props.handleDisplayableChange(target.value)} required value={this.props.displayable}>
                            <option ><FormattedMessage id="unit.dropdown_displayable"/></option>
                            <option value='none' key='none'>None</option>
                            <option value='all' key='all'>All</option>
                            <option value='admin' key='admin'>Admin</option>
                        </Input>
                        </div>
                            
                            {/* use JSON.parse to convert from target.value string to boolean; not sure about overhead from using JSON.parse shoudl check with Steve */}
                            <Input type='checkbox' onChange={({target}) => this.props.handlePreferredDisplayChange(JSON.parse(target.value))} value={this.props.preferredDisplay.toString()} />
                                {/* need identfier formatted message */}
                            <label><FormattedMessage id="unit.preferred_display"/></label>
                            
                        <div style={formInputStyle}>
                                {/* need name formatted message */}
                            <label><FormattedMessage id="unit.note_optional"/></label><br />
                            <Input type='textarea' onChange={({target}) => this.props.handleNoteChange(target.value)} value={this.props.note} />
                        </div>
                        <div>
                            {/* need name formatted message */}
						    <Button><FormattedMessage id="unit.submit_new_unit"/></Button>
					    </div>
                    </form>
                </div>
            </div>
        );
    }

}