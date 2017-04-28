/**
 * Created by Eduardo on 4/28/2017.
 */
import { combineReducers } from 'redux';
import csvUpload from './csvUpload';

/**
 * @typedef {Object} State
 * @property {State~meterID} csvUpload
 */
const admin = combineReducers({ csvUpload });
export default admin;
