import React from 'react';

export default class LogoComponent extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        const imgStyle = {
            width: "175px",
            height: "70px",
            position: "absolute",
            top: "2px",
            left: "2px"
        };
        return (
            <img src={this.props.url} alt="Logo" style={imgStyle}/>
        );
    }
}