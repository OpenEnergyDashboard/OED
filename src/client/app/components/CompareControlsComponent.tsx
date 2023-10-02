import * as moment from 'moment';
import * as React from 'react';
import { Button, ButtonGroup, Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'reactstrap';
import { graphSlice } from '../reducers/graph';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { ComparePeriod, SortingOrder } from '../utils/calculateCompare';
import translate from '../utils/translate';
import TooltipMarkerComponent from './TooltipMarkerComponent';

/**
 * @returns controls for the compare page
 */
export default function CompareControlsComponent() {
	const dispatch = useAppDispatch();
	const comparePeriod = useAppSelector(state => state.graph.comparePeriod);
	const compareSortingOrder = useAppSelector(state => state.graph.compareSortingOrder);
	const [compareSortingDropdownOpen, setCompareSortingDropdownOpen] = React.useState<boolean>(false);
	const handleCompareButton = (comparePeriod: ComparePeriod) => {
		dispatch(graphSlice.actions.updateComparePeriod({ comparePeriod, currentTime: moment() }))
	}
	const handleSortingButton = (sortingOrder: SortingOrder) => {
		dispatch(graphSlice.actions.changeCompareSortingOrder(sortingOrder))
	}

	return (
		<div>
			<ButtonGroup
				style={zIndexFix}
			>
				<Button
					outline={comparePeriod !== ComparePeriod.Day}
					active={comparePeriod === ComparePeriod.Day}
					onClick={() => handleCompareButton(ComparePeriod.Day)}
				>
					{translate('day')}
				</Button>
				<Button
					outline={comparePeriod !== ComparePeriod.Week}
					active={comparePeriod === ComparePeriod.Week}
					onClick={() => handleCompareButton(ComparePeriod.Week)}
				>
					{translate('week')}
				</Button>
				<Button
					outline={comparePeriod !== ComparePeriod.FourWeeks}
					active={comparePeriod === ComparePeriod.FourWeeks}
					onClick={() => handleCompareButton(ComparePeriod.FourWeeks)}
				>
					{translate('4.weeks')}
				</Button>
			</ButtonGroup>
			<TooltipMarkerComponent page='home' helpTextId='help.home.compare.interval.tip' />
			<Dropdown isOpen={compareSortingDropdownOpen} toggle={() => setCompareSortingDropdownOpen(current => !current)}>
				<DropdownToggle caret>
					{translate('sort')}
				</DropdownToggle>
				<TooltipMarkerComponent page='home' helpTextId='help.home.compare.sort.tip' />
				<DropdownMenu>
					<DropdownItem
						active={compareSortingOrder === SortingOrder.Alphabetical}
						onClick={() => handleSortingButton(SortingOrder.Alphabetical)}
					>
						{translate('alphabetically')}
					</DropdownItem>
					<DropdownItem
						active={compareSortingOrder === SortingOrder.Ascending}
						onClick={() => handleSortingButton(SortingOrder.Ascending)}
					>
						{translate('ascending')}
					</DropdownItem>
					<DropdownItem
						active={compareSortingOrder === SortingOrder.Descending}
						onClick={() => handleSortingButton(SortingOrder.Descending)}
					>
						{translate('descending')}
					</DropdownItem>
				</DropdownMenu>
			</Dropdown>
		</div>
	)
}

const zIndexFix: React.CSSProperties = {
	zIndex: 0
};