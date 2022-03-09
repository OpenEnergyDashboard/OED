import * as React from 'react';
import HeaderContainer from '../HeaderContainer';
import FooterContainer from '../FooterContainer';
import CreateUnitComponent from '../../components/unit/CreateUnitComponent';
import { showSuccessNotification, showErrorNotification } from '../../utils/notifications';
import { unitsApi } from 'utils/api';
import { UnitData } from 'types/redux/unit';

export default class CreateUnitContainter extends React.Component<{}, {}> {
    constructor(props: {}){
        super(props);
        //TODO: create rest of hanlder functions, bind them, and pass to CreateUnitComponent
        this.handleNameChange = this.handleNameChange.bind(this);
        this.submitNewUnit = this.submitNewUnit.bind(this);
        this.handleIdentifierChange = this.handleIdentifierChange.bind(this);
        this.handleUnitRepresentChange = this.handleUnitRepresentChange.bind(this);
        this.handleSecInRateChange = this.handleSecInRateChange.bind(this);
        this.handleTypeOfUnitChange = this.handleTypeOfUnitChange.bind(this);
        this.handleSuffixChange = this.handleSuffixChange.bind(this);
        this.handleDisplayableChange = this.handleDisplayableChange.bind(this);
        this.handlePreferredDisplayChange = this.handlePreferredDisplayChange.bind(this);
        this.handleNoteChange = this.handleNoteChange.bind(this);
    }

    state = {
        name: '',
        identifier: '',
        unitRepresent: '',
        secInRate: 3600,
        typeOfUnit: '',
        unitIndex: null,
        suffix: '',
        displayable: '',
        preferredDisplay: false,
        note: ''
    }

    //TODO: create rest of hanlder functions, bind them, and pass to CreateUnitComponent
    private handleNameChange = (newName: string) => {
        this.setState({ name :  newName});
    }

    private handleIdentifierChange = (newIdentifier: string) => {
        this.setState({ identifier :  newIdentifier});
    }

    private handleUnitRepresentChange = (newIdentifier: string) => {
        this.setState({ identifier :  newIdentifier});
    }


    private handleSecInRateChange = (newUnitRepresent: number) => {
        this.setState({ unitRepresent :  newUnitRepresent});
    }

    private handleTypeOfUnitChange = (newTypeOfUnit: string) => {
        this.setState({ typeOfUnit :  newTypeOfUnit});
    }
    private handleSuffixChange = (newsuffix: string) => {
        this.setState({ suffix :  newsuffix})
    }
    private handleDisplayableChange = (newDisplayable: string) => {
        this.setState({ displayable :  newDisplayable});
    }
    private handlePreferredDisplayChange = (newPreferredDisplay: boolean) => {
        this.setState({ preferredDisplay :  newPreferredDisplay});
    }
    private handleNoteChange = (newNote: string) => {
        this.setState({ note :  newNote});
    }

    private submitNewUnit = async () => {

    };
    public render() {
        return (
            <div>
                <HeaderContainer />
                <CreateUnitComponent
                    //TODO: create rest of hanlder functions, bind them, and pass to CreateUnitComponent
                    name= {this.state.name}
                    identifier= {this.state.identifier}
                    unitRepresent= {this.state.unitRepresent}
                    secInRate= {this.state.secInRate}
                    typeOfUnit= {this.state.typeOfUnit}
                    unitIndex= {this.state.unitIndex}
                    suffix= {this.state.suffix}
                    displayable= {this.state.displayable}
                    preferredDisplay= {this.state.preferredDisplay}
                    note= {this.state.note}
                    submitNewUnit= {this.submitNewUnit}
                    handleNameChange= {this.handleNameChange}
                    handleIdentifierChange = {this.handleIdentifierChange}
                    handleUnitRepresentChange = {this.handleUnitRepresentChange}
                    handleSecInRateChange = {this.handleSecInRateChange}
                    handleTypeOfUnitChange = {this.handleTypeOfUnitChange}
                    handleSuffixChange = {this.handleSuffixChange}
                    handleDisplayableChange = {this.handleDisplayableChange}
                    handlePreferredDisplayChange = {this.handlePreferredDisplayChange}
                    handleNoteChange = {this.handleNoteChange}
                />
                <FooterContainer />
            </div>
        );
    }
}