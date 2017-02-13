import React from 'react';
import HeaderComponent from './HeaderComponent';

export default function GroupComponent(props) {

    const titleStyle = {
        display: 'inline-block',
    };
    return (
        <div>
           <HeaderComponent renderLoginButton="false" renderGroupButton="false" />
            <h1 style={titleStyle}>Group Editor</h1>
        </div>
    );

}
