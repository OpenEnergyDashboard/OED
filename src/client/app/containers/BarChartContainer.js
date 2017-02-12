import { connect } from 'react-redux';
import { mapStateToProps } from './LineChartContainer';
import BarChartComponent from '../components/BarChartComponent';

export default connect(mapStateToProps)(BarChartComponent);
