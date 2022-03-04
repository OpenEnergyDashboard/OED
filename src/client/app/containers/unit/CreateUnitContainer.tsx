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
                />
                <FooterContainer />
            </div>
        );
    }
}