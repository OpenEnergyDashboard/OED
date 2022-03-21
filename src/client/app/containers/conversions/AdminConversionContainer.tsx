/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import * as _ from 'lodash';
import { Conversion, User } from '../../types/items';
import AdminConversionComponent from '../../components/conversions/AdminConversionComponent';
import HeaderContainer from '../HeaderContainer';
import FooterContainer from '../FooterContainer';


interface UsersDisplayContainerProps {
	fetchUsers: () => User[];
}

interface AdminConversionsContainerState {
	conversion: Conversion[],
}

export default class AdminConversionsContainer extends React.Component {
	constructor(props: UsersDisplayContainerProps) {
		super(props);
	}

    state: AdminConversionsContainerState = {
        conversion: []
    }

	public render() {
		return (
			<div>
				<HeaderContainer />
				<AdminConversionComponent

				/>
				<FooterContainer />
			</div>
		)
	}
}