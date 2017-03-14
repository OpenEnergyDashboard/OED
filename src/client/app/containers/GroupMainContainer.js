/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import GroupMainComponent from '../components/groups/GroupMainComponent';

/**
 * Connects and passes down the Redux dispatch function to DashboardComponent
 */
export default connect()(GroupMainComponent);
