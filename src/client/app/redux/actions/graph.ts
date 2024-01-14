/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as moment from 'moment';
import { TimeInterval } from '../../../../common/TimeInterval';
import * as t from '../../types/redux/graph';
import { ComparePeriod, SortingOrder } from '../../utils/calculateCompare';

export interface LinkOptions {
	meterIDs?: number[];
	groupIDs?: number[];
	chartType?: t.ChartTypes;
	unitID?: number;
	rate?: t.LineGraphRate;
	barDuration?: moment.Duration;
	serverRange?: TimeInterval;
	sliderRange?: TimeInterval;
	toggleAreaNormalization?: boolean;
	areaUnit?: string;
	toggleMinMax?: boolean;
	toggleBarStacking?: boolean;
	comparePeriod?: ComparePeriod;
	compareSortingOrder?: SortingOrder;
	optionsVisibility?: boolean;
	mapID?: number;
	meterOrGroupID?: number;
	meterOrGroup?: t.MeterOrGroup;
	readingInterval?: t.ReadingInterval;
}
