/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Prompt, withRouter, RouteComponentProps } from 'react-router-dom';
import Button from 'reactstrap/lib/Button';
import Modal from 'reactstrap/lib/Modal';
import ModalBody from 'reactstrap/lib/ModalBody';
import ModalFooter from 'reactstrap/lib/ModalFooter';
import { RemoveUnsavedChangesAction } from '../types/redux/unsavedWarning';

interface UnsavedWarningProps extends RouteComponentProps<any> {
    hasUnsavedChanges: boolean;
    removeFunction: () => any;
    submitFunction: () => any;
    removeUnsavedChanges(): RemoveUnsavedChangesAction;
}

class UnsavedWarningComponent extends React.Component<UnsavedWarningProps> {
    state = {
        warningVisible: false,
        confirmedToLeave: false,
        nextLocation: "",
        submitClicked: false
    }

    constructor(props: UnsavedWarningProps) {
        super(props);
        this.closeWarning = this.closeWarning.bind(this);
    }

    componentDidUpdate() {
        const { submitClicked } = this.state;
        if (submitClicked) {
            // Remove local changes and redirect to the desired path
            // We need to remove local changes since the new data may be invalid
            this.handleNavigateChange(this.props.removeFunction);
        }

        const { hasUnsavedChanges } = this.props;
        if (hasUnsavedChanges) {
            // Block reloading page or closing OED tab
            window.onbeforeunload = () => true;
        } else {
            window.onbeforeunload = () => undefined;
        }
    }

    render() {
        return (
            <>
                <Prompt 
                    when={this.props.hasUnsavedChanges} 
                    message={(nextLocation) => {
                        const { confirmedToLeave } = this.state;
                        const { hasUnsavedChanges } = this.props;
                        if (!confirmedToLeave && hasUnsavedChanges) {
                            this.setState({
                                warningVisible: true,
                                nextLocation: nextLocation.pathname
                            });
                            return false;
                        }
                        return true;
                }} /> 

                <Modal isOpen={this.state.warningVisible} toggle={this.closeWarning}>
                    <ModalBody><FormattedMessage id='unsaved.warning' /></ModalBody>
                    <ModalFooter>
                        <Button outline onClick={this.closeWarning}><FormattedMessage id='cancel' /></Button>
                        <Button 
                            color='danger' 
                            onClick={() => this.handleNavigateChange(this.props.removeFunction)}
                        >
                            <FormattedMessage id='leave' />
                        </Button>
                        <Button 
                            color='success' 
                            onClick={() => this.handleSubmitClick()}
                        >
                            <FormattedMessage id='save.all' />
                        </Button>
                    </ModalFooter>
                </Modal>
            </>
        )
    }

    private closeWarning() {
        this.setState({
            warningVisible: false
        });
    }

    private handleNavigateChange(func: () => any) {
        const { nextLocation } = this.state;
        if (nextLocation) {
            this.setState({
                confirmedToLeave: true,
                warningVisible: false,
                submitClicked: false
            }, () => {
                func();
                this.props.removeUnsavedChanges();
                // Unblock reloading page and closing tab
                window.onbeforeunload = () => undefined;
                // Navigate to the path that the user wants
                this.props.history.push(this.state.nextLocation);
            });
        }
    }

    private handleSubmitClick() {
        this.props.submitFunction();
        this.setState({
            submitClicked: true
        });
    }
}

export default withRouter(UnsavedWarningComponent);