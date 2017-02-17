import { connect } from 'react-redux';
import DashboardComponent from '../components/DashboardComponent';

/**
 * Connects and passes down the Redux dispatch function to DashboardComponent
 */
export default connect()(DashboardComponent);
