import { connect } from 'react-redux';
import { mapStateToProps } from './LineChartContainer';
import BarChartComponent from '../components/BarChartComponent';

/**
 * Connects changes to the Redux store to BarChartComponent via mapStateToProps
 */
export default connect(mapStateToProps)(BarChartComponent);
