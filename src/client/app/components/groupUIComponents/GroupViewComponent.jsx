//This component is for viewing a single group via child box components + some buttons
import React from 'react';
import { Link } from 'react-router';
import ChildBox from './ChildBoxComponent';
import EditGroupComponent from './EditGroupComponent';

export default class GroupViewComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    /*editClicked() {
        React.render(<EditGroupComponent/>);
    }*/

//<button onClick={this.editClicked.bind(this)} className="btn btn-default">Edit Group</button>
    render () {
        //Right now this just links, ideally it will put the edit component up as an overlay
    const buttonStyle = {
        marginTop: '10px'
    };

        return (

            <div>
            <ChildBox/>
                <Link style={buttonStyle} to="/editGroup"><button className="btn btn-default">Edit Group</button></Link>
            </div>
        );
    }


}
