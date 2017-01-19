import React from 'react';
import DashboardComponent from './DashboardComponent.jsx'
import LogoComponent from './LogoComponent.jsx'

export default class AppComponent extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div>
                <LogoComponent url="../old-mockup/images/logo.png"/>
                <DashboardComponent />
            </div>
        );
    }
}