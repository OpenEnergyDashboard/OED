/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

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

    // This is the current compare period for graphic
    const comparePeriod = useAppSelector(selectComparePeriod);
    // This is the current sorting order for graphic
    const compareSortingOrder = useAppSelector(selectSortingOrder);
    // State to manage the dropdown open status for compare period
    const [comparePeriodDropdownOpen, setComparePeriodDropdownOpen] = React.useState<boolean>(false);
    // State to manage the dropdown open status for sorting order
    const [compareSortingDropdownOpen, setCompareSortingDropdownOpen] = React.useState<boolean>(false);
    
    // Updates values when the compare period menu is used
    const handleCompare = (comparePeriod: ComparePeriod) => {
        dispatch(graphSlice.actions.updateComparePeriod({ comparePeriod, currentTime: moment() }));
    };
    
    // Updates sorting order when the sort order menu is used
    const handleSorting = (sortingOrder: SortingOrder) => {
        dispatch(graphSlice.actions.changeCompareSortingOrder(sortingOrder));
    };

    // Updates the text in the compare period dropdown menu when switching between periods
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

    // Updates the text in the sort dropdown menu when switching between sorting types
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
                    {translate('compare.period')}:
                    <TooltipMarkerComponent page='home' helpTextId='help.home.compare.period.tip' />
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
            <div style={{...divTopBottomPadding, paddingTop: '0px'}}>
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
    paddingTop: '15px',
    paddingBottom: '15px'
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
