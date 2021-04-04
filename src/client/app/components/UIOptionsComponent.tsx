/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { InjectedIntlProps, FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import sliderWithoutTooltips, { createSliderWithTooltip } from 'rc-slider';
import * as moment from 'moment';
import { Button, ButtonGroup, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import ExportContainer from '../containers/ExportContainer';
import ChartSelectContainer from '../containers/ChartSelectContainer';
import ChartDataSelectContainer from '../containers/ChartDataSelectContainer';
import { ChangeBarStackingAction, ChangeCompareSortingOrderAction, SetOptionsVisibility } from '../types/redux/graph';
import ChartLinkContainer from '../containers/ChartLinkContainer';
import LanguageSelectorContainer from '../containers/LanguageSelectorContainer'
import { ChartTypes } from '../types/redux/graph';
import { ComparePeriod, SortingOrder } from '../utils/calculateCompare';
import TooltipMarkerComponent from './TooltipMarkerComponent';
import 'rc-slider/assets/index.css';
import MapChartSelectContainer from '../containers/MapChartSelectContainer';

const Slider = createSliderWithTooltip(sliderWithoutTooltips);

export interface UIOptionsProps {
	chartToRender: ChartTypes;
	barStacking: boolean;
	barDuration: moment.Duration;
	comparePeriod: ComparePeriod;
	compareSortingOrder: SortingOrder;
	optionsVisibility: boolean;
	changeDuration(duration: moment.Duration): Promise<any>;
	changeBarStacking(): ChangeBarStackingAction;
	setOptionsVisibility(visibility: boolean): SetOptionsVisibility;
	changeCompareGraph(comparePeriod: ComparePeriod): Promise<any>;
	changeCompareSortingOrder(compareSortingOrder: SortingOrder): ChangeCompareSortingOrderAction;
}

type UIOptionsPropsWithIntl = UIOptionsProps & InjectedIntlProps;

interface UIOptionsState {
	barDurationDays: number;
	showSlider: boolean;
	compareSortingDropdownOpen: boolean;
}

class UIOptionsComponent extends React.Component<UIOptionsPropsWithIntl, UIOptionsState> {
	constructor(props: UIOptionsPropsWithIntl) {
		super(props);
		this.handleBarDurationChange = this.handleBarDurationChange.bind(this);
		this.handleBarDurationChangeComplete = this.handleBarDurationChangeComplete.bind(this);
		this.handleChangeBarStacking = this.handleChangeBarStacking.bind(this);
		this.formatSliderTip = this.formatSliderTip.bind(this);
		this.handleBarButton = this.handleBarButton.bind(this);
		this.handleCompareButton = this.handleCompareButton.bind(this);
		this.handleSortingButton = this.handleSortingButton.bind(this);
		this.handleSetOptionsVisibility = this.handleSetOptionsVisibility.bind(this);
		this.toggleSlider = this.toggleSlider.bind(this);
		this.toggleDropdown = this.toggleDropdown.bind(this);
		this.state = {
			barDurationDays: this.props.barDuration.asDays(),
			showSlider: false,
			compareSortingDropdownOpen: false
		};
	}

	public componentWillReceiveProps(nextProps: UIOptionsProps) {
		this.setState({ barDurationDays: nextProps.barDuration.asDays() });
	}

	public render() {
		const labelStyle: React.CSSProperties = {
			fontWeight: 'bold',
			margin: 0
		};
		const divTopPadding: React.CSSProperties = {
			paddingTop: '15px'
		};
		const zIndexFix: React.CSSProperties = {
			zIndex: 0
		};

		return (
			<div>
				<ChartSelectContainer />
				<ChartDataSelectContainer />

				{/* Controls specific to the bar chart. */}
				{this.props.chartToRender === ChartTypes.bar &&
					<div>
						<div className='checkbox'>
							<input type='checkbox' onChange={this.handleChangeBarStacking} checked={this.props.barStacking} id='barStacking' />
							<label htmlFor='barStacking'>
								<FormattedMessage id='bar.stacking' />
							</label>
							<TooltipMarkerComponent page='home' helpTextId='help.home.bar.stacking.tip' />
						</div>
						<p style={labelStyle}>
							<FormattedMessage id='bar.interval' />:
						</p>
						<ButtonGroup
							style={zIndexFix}
						>
							<Button
								outline={this.state.barDurationDays !== 1}
								onClick={() => this.handleBarButton(1)}
							>
								<FormattedMessage id='day' />
							</Button>
							<Button
								outline={this.state.barDurationDays !== 7}
								onClick={() => this.handleBarButton(7)}
							>
								<FormattedMessage id='week' />
							</Button>
							<Button
								outline={this.state.barDurationDays !== 28}
								onClick={() => this.handleBarButton(28)}
							>
								<FormattedMessage id='4.weeks' />
							</Button>
						</ButtonGroup>
						<TooltipMarkerComponent page='home' helpTextId='help.home.bar.interval.tip' />
						<Button
							outline={!this.state.showSlider}
							onClick={this.toggleSlider}
						>
							<FormattedMessage id='toggle.custom.slider' />
						</Button>
						<TooltipMarkerComponent page='home' helpTextId='help.home.bar.custom.slider.tip' />
						{this.state.showSlider &&
							<div style={divTopPadding}>
								<Slider
									min={1}
									max={365}
									value={this.state.barDurationDays}
									onChange={this.handleBarDurationChange}
									onAfterChange={this.handleBarDurationChangeComplete}
									tipFormatter={this.formatSliderTip}
									trackStyle={{ backgroundColor: 'gray', height: 10 }}
									handleStyle={[{
										height: 28,
										width: 28,
										marginLeft: -14,
										marginTop: -9,
										backgroundColor: 'white'
									}]}
									railStyle={{ backgroundColor: 'gray', height: 10 }}
								/>
							</div>
						}
					</div>

				}
				{/* Controls specific to the compare chart */}
				{this.props.chartToRender === ChartTypes.compare &&
					<div>
						<ButtonGroup
							style={zIndexFix}
						>
							<Button
								outline={this.props.comparePeriod !== ComparePeriod.Day}
								active={this.props.comparePeriod === ComparePeriod.Day}
								onClick={() => this.handleCompareButton(ComparePeriod.Day)}
							>
								<FormattedMessage id='day' />
							</Button>
							<Button
								outline={this.props.comparePeriod !== ComparePeriod.Week}
								active={this.props.comparePeriod === ComparePeriod.Week}
								onClick={() => this.handleCompareButton(ComparePeriod.Week)}
							>
								<FormattedMessage id='week' />
							</Button>
							<Button
								outline={this.props.comparePeriod !== ComparePeriod.FourWeeks}
								active={this.props.comparePeriod === ComparePeriod.FourWeeks}
								onClick={() => this.handleCompareButton(ComparePeriod.FourWeeks)}
							>
								<FormattedMessage id='4.weeks' />
							</Button>
						</ButtonGroup>
						<TooltipMarkerComponent page='home' helpTextId='help.home.compare.interval.tip' />
						<Dropdown isOpen={this.state.compareSortingDropdownOpen} toggle={this.toggleDropdown}>
							<DropdownToggle caret>
								<FormattedMessage id='sort' />
							</DropdownToggle>
							<TooltipMarkerComponent page='home' helpTextId='help.home.compare.sort.tip' />
							<DropdownMenu>
								<DropdownItem
									active={this.props.compareSortingOrder === SortingOrder.Alphabetical}
									onClick={() => this.handleSortingButton(SortingOrder.Alphabetical)}
								>
									<FormattedMessage id='alphabetically' />
								</DropdownItem>
								<DropdownItem
									active={this.props.compareSortingOrder === SortingOrder.Ascending}
									onClick={() => this.handleSortingButton(SortingOrder.Ascending)}
								>
									<FormattedMessage id='ascending' />
								</DropdownItem>
								<DropdownItem
									active={this.props.compareSortingOrder === SortingOrder.Descending}
									onClick={() => this.handleSortingButton(SortingOrder.Descending)}
								>
									<FormattedMessage id='descending' />
								</DropdownItem>
							</DropdownMenu>
						</Dropdown>
					</div>
				}

				{this.props.chartToRender === ChartTypes.map &&
					<MapChartSelectContainer />
				}

				{/* We can't export compare data or map data */}
				{this.props.chartToRender !== ChartTypes.compare && this.props.chartToRender !== ChartTypes.map &&
					<div style={divTopPadding}>
						<ExportContainer />
					</div>
				}
				<div style={divTopPadding}>
					<ChartLinkContainer />
				</div>

				{/* Language selector dropdown*/}
				<div style={divTopPadding}>
					<LanguageSelectorContainer />
				</div>

				<div style={divTopPadding} className='d-none d-lg-block'>
					<Button
						onClick={this.handleSetOptionsVisibility}
						outline
					>
						{this.props.optionsVisibility ?
							<FormattedMessage id='hide.options' />
							:
							<FormattedMessage id='show.options' />
						}
					</Button>
					<TooltipMarkerComponent page='home' helpTextId='help.home.hide.or.show.options' />
				</div>
			</div>
		);
	}

	private handleBarDurationChangeComplete(e: any) {
		this.props.changeDuration(moment.duration(this.state.barDurationDays, 'days'));
	}

	private handleBarButton(value: number) {
		this.props.changeDuration(moment.duration(value, 'days'));
	}

	/**
	 * Stores temporary barDuration until slider is released, used to update the UI of the slider
	 */
	private handleBarDurationChange(value: number) {
		this.setState({ barDurationDays: value });
	}

	private handleChangeBarStacking() {
		this.props.changeBarStacking();
	}

	private handleCompareButton(comparePeriod: ComparePeriod) {
		this.props.changeCompareGraph(comparePeriod);
	}

	private handleSortingButton(sortingOrder: SortingOrder) {
		this.props.changeCompareSortingOrder(sortingOrder);
	}

	private handleSetOptionsVisibility() {
		this.props.setOptionsVisibility(!this.props.optionsVisibility);
	}

	private toggleSlider() {
		this.setState({ showSlider: !this.state.showSlider });
	}

	private formatSliderTip(value: number) {
		const messages = defineMessages({
			day: { id: 'day' },
			days: { id: 'days' }
		});
		const { formatMessage } = this.props.intl;
		if (value <= 1) {
			return `${value} ${formatMessage(messages.day)}`;
		}
		return `${value} ${formatMessage(messages.days)}`;
	}

	private toggleDropdown() {
		this.setState({ compareSortingDropdownOpen: !this.state.compareSortingDropdownOpen });
	}
}

export default injectIntl<UIOptionsProps>(UIOptionsComponent);
