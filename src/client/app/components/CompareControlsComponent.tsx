/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// import * as moment from 'moment';
// import * as React from 'react';
// import { Button, ButtonGroup, Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'reactstrap';
// import { graphSlice, selectComparePeriod, selectSortingOrder } from '../redux/slices/graphSlice';
// import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
// import { ComparePeriod, SortingOrder } from '../utils/calculateCompare';
// import translate from '../utils/translate';
// import TooltipMarkerComponent from './TooltipMarkerComponent';

// /**
//  * @returns controls for the compare page
//  */
// export default function CompareControlsComponent() {
// 	const dispatch = useAppDispatch();
// 	const comparePeriod = useAppSelector(selectComparePeriod);
// 	const compareSortingOrder = useAppSelector(selectSortingOrder);
// 	const [compareSortingDropdownOpen, setCompareSortingDropdownOpen] = React.useState<boolean>(false);
// 	const handleCompareButton = (comparePeriod: ComparePeriod) => {
// 		dispatch(graphSlice.actions.updateComparePeriod({ comparePeriod, currentTime: moment() }));
// 	};
// 	const handleSortingButton = (sortingOrder: SortingOrder) => {
// 		dispatch(graphSlice.actions.changeCompareSortingOrder(sortingOrder));
// 	};

// 	return (
// 		<div>
// 			<ButtonGroup
// 				style={zIndexFix}
// 			>
// 				<Button
// 					outline={comparePeriod !== ComparePeriod.Day}
// 					active={comparePeriod === ComparePeriod.Day}
// 					onClick={() => handleCompareButton(ComparePeriod.Day)}
// 				>
// 					{translate('day')}
// 				</Button>
// 				<Button
// 					outline={comparePeriod !== ComparePeriod.Week}
// 					active={comparePeriod === ComparePeriod.Week}
// 					onClick={() => handleCompareButton(ComparePeriod.Week)}
// 				>
// 					{translate('week')}
// 				</Button>
// 				<Button
// 					outline={comparePeriod !== ComparePeriod.FourWeeks}
// 					active={comparePeriod === ComparePeriod.FourWeeks}
// 					onClick={() => handleCompareButton(ComparePeriod.FourWeeks)}
// 				>
// 					{translate('4.weeks')}
// 				</Button>
// 			</ButtonGroup>
// 			<TooltipMarkerComponent page='home' helpTextId='help.home.compare.interval.tip' />
// 			<Dropdown isOpen={compareSortingDropdownOpen} toggle={() => setCompareSortingDropdownOpen(current => !current)}>
// 				<DropdownToggle caret>
// 					{translate('sort')}
// 				</DropdownToggle>
// 				<TooltipMarkerComponent page='home' helpTextId='help.home.compare.sort.tip' />
// 				<DropdownMenu>
// 					<DropdownItem
// 						active={compareSortingOrder === SortingOrder.Alphabetical}
// 						onClick={() => handleSortingButton(SortingOrder.Alphabetical)}
// 					>
// 						{translate('alphabetically')}
// 					</DropdownItem>
// 					<DropdownItem
// 						active={compareSortingOrder === SortingOrder.Ascending}
// 						onClick={() => handleSortingButton(SortingOrder.Ascending)}
// 					>
// 						{translate('ascending')}
// 					</DropdownItem>
// 					<DropdownItem
// 						active={compareSortingOrder === SortingOrder.Descending}
// 						onClick={() => handleSortingButton(SortingOrder.Descending)}
// 					>
// 						{translate('descending')}
// 					</DropdownItem>
// 				</DropdownMenu>
// 			</Dropdown>
// 		</div>
// 	);
// }

// const zIndexFix: React.CSSProperties = {
// 	zIndex: 0
// };

import * as moment from 'moment';
import * as React from 'react';
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'reactstrap';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { graphSlice, selectComparePeriod, selectSortingOrder } from '../redux/slices/graphSlice';
import { ComparePeriod, SortingOrder } from '../utils/calculateCompare';
import translate from '../utils/translate';
import TooltipMarkerComponent from './TooltipMarkerComponent';

/**
 * @returns controls for the compare page
 */
export default function CompareControlsComponent() {
    const dispatch = useAppDispatch();
    const comparePeriod = useAppSelector(selectComparePeriod);
    const compareSortingOrder = useAppSelector(selectSortingOrder);
    const [comparePeriodDropdownOpen, setComparePeriodDropdownOpen] = React.useState<boolean>(false);
    const [compareSortingDropdownOpen, setCompareSortingDropdownOpen] = React.useState<boolean>(false);
    const handleCompare = (comparePeriod: ComparePeriod) => {
        dispatch(graphSlice.actions.updateComparePeriod({ comparePeriod, currentTime: moment() }));
    };
    const handleSorting = (sortingOrder: SortingOrder) => {
        dispatch(graphSlice.actions.changeCompareSortingOrder(sortingOrder));
    };

    const getComparePeriodDisplayText = () => {
        switch (comparePeriod) {
            case ComparePeriod.Day:
                return translate('day');
            case ComparePeriod.Week:
                return translate('week');
            case ComparePeriod.FourWeeks:
                return translate('4.weeks');
        }
    };

    const getSortDisplayText = () => {
        switch (compareSortingOrder) {
            case SortingOrder.Alphabetical:
                return translate('alphabetically');
            case SortingOrder.Ascending:
                return translate('ascending');
            case SortingOrder.Descending:
                return translate('descending');
        }
    };

    return (
        <div>
            <div style={divTopBottomPadding}>
                <p style={labelStyle}>
                    {translate('compare.interval')}:
                    <TooltipMarkerComponent page='home' helpTextId='help.home.compare.interval.tip' />
                </p>
                <Dropdown isOpen={comparePeriodDropdownOpen} toggle={() => setComparePeriodDropdownOpen(current => !current)}>
                    <DropdownToggle caret style={dropdownToggleStyle}>
                        {getComparePeriodDisplayText()}
                    </DropdownToggle>
                    <DropdownMenu>
                        <DropdownItem
                            active={comparePeriod === ComparePeriod.Day}
                            onClick={() => handleCompare(ComparePeriod.Day)}
                        >
                            {translate('day')}
                        </DropdownItem>
                        <DropdownItem
                            active={comparePeriod === ComparePeriod.Week}
                            onClick={() => handleCompare(ComparePeriod.Week)}
                        >
                            {translate('week')}
                        </DropdownItem>
                        <DropdownItem
                            active={comparePeriod === ComparePeriod.FourWeeks}
                            onClick={() => handleCompare(ComparePeriod.FourWeeks)}
                        >
                            {translate('4.weeks')}
                        </DropdownItem>
                        {/* TODO: Add custom option. Compare is currently not ready for this. */}
                    </DropdownMenu>
                </Dropdown>
            </div>
            <div style={divTopBottomPadding}>
                <p style={labelStyle}>
                    {translate('sort')}:
                    <TooltipMarkerComponent page='home' helpTextId='help.home.compare.sort.tip'/>
                </p>
                <Dropdown isOpen={compareSortingDropdownOpen} toggle={() => setCompareSortingDropdownOpen(current => !current)}>
                    <DropdownToggle caret style={dropdownToggleStyle}>
                        {getSortDisplayText()}
                    </DropdownToggle>
                    <DropdownMenu>
                        <DropdownItem
                            active={compareSortingOrder === SortingOrder.Alphabetical}
                            onClick={() => handleSorting(SortingOrder.Alphabetical)}
                        >
                            {translate('alphabetically')}
                        </DropdownItem>
                        <DropdownItem
                            active={compareSortingOrder === SortingOrder.Ascending}
                            onClick={() => handleSorting(SortingOrder.Ascending)}
                        >
                            {translate('ascending')}
                        </DropdownItem>
                        <DropdownItem
                            active={compareSortingOrder === SortingOrder.Descending}
                            onClick={() => handleSorting(SortingOrder.Descending)}
                        >
                            {translate('descending')}
                        </DropdownItem>
                    </DropdownMenu>
                </Dropdown>
            </div>
        </div>
    );
}

const divTopBottomPadding: React.CSSProperties = {
    paddingTop: '10px',
    paddingBottom: '10px'
};

const labelStyle: React.CSSProperties = {
    fontWeight: 'bold',
    margin: 0
};

const dropdownToggleStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    color: '#000000',
    border: '1px solid #ced4da',
    boxShadow: 'none'
};
