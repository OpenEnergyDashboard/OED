//Box classes for displaying child meters and groups
import React from 'react';

export default class ChildBox extends React.Component {

    constructor(props) {
        super(props);
        this.state = {};
    }
    render () {

        const boxStyle = {
            display: "inline-block",
            width: "100",
            height: "100"
        }
        return <div><h1>I am a ChildBox!</h1></div>;
    }
}
