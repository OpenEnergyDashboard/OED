import * as React from "react";
import { Modal, Button, Dropdown } from "react-bootstrap";
import { GPSPoint } from "utils/calibration";
import '../../styles/meter-edit-modal.css';

interface meterTypes {
    MAMAC?: string;
	  METASYS?: string;
	  OBVIUS?: string;
	  OTHER?: string
}
interface MetaDataProps {
  onhide: () => void;
  show: boolean;
  id: number;
  identifier: string;
  name: string;
  units?: string;
  meterType?: string;
  gps?: GPSPoint;
  Area: number;
  displayable: boolean;
  enabled: boolean;
  meterAddress?: string;
  graphicUnit: number;
  notes: string;
  cumulative: boolean;
  cumulativeReset: boolean;
  cumulativeResetStart: string;
  cumulativeResetEnd: string;
  endOnlyTime: boolean;
  readingGap: string;
  readingVariation: number;
  readingDuplication: number;
  timesort: boolean;
  startTimeStamp: string;
  endTimeStamp: string;
}

 type MeterViewPropsWithIntl = MetaDataProps;

 class MeterModalEditComponent extends React.Component<MeterViewPropsWithIntl, {show: boolean}>{
   constructor(props: MeterViewPropsWithIntl){
     super(props);
     this.state = {
       show: this.props.show
     };
   }
   render() {
    return (
       <>
      <Modal show={this.props.show} onHide={this.props.onhide}>
        <Modal.Header closeButton>
          <Modal.Title> Edit Meter Information</Modal.Title>
        </Modal.Header>
  
        <Modal.Body className="show-grid">
          <div id="container">
            <div id="modalChild">
              {isIdentifier(this.props.identifier)}
  
              {isUnits(this.props.units)}
              
              {isMeterType(this.props.meterType)}

              {isGraphicUnits(this.props.graphicUnit)}

              {isGPS(this.props.gps)}

              {isArea(this.props.Area)}
              
              {isDisplaying(this.props.displayable)}

              {isEnabled(this.props.enabled)}
              
              {isMeterIP(this.props.meterAddress)}
  
              {isTimeZone()}
              {isNotes(this.props.notes)}
  
            </div>
            <div id="modalChild">
              {isCumulative(this.props.cumulative)}

              {isCumulativeReset(this.props.cumulativeReset)}

              {isResetStartTime(this.props.cumulativeResetStart)}

              {isTimeSort(this.props.timesort)}
              
              {isEndOnly(this.props.endOnlyTime)}

              {isReadGap(this.props.readingGap)}

              {isReadingVariation(this.props.readingVariation)}  
              
              {isReadingDuplication(this.props.readingDuplication)}

              {isReading()}

              {isStartDateTime(this.props.startTimeStamp)}

              {isEndDateTime(this.props.endTimeStamp)}

              {isID(this.props.id)}

              {isName(this.props.name)}
            </div>
        </div>
        </Modal.Body>
  
        <Modal.Footer>
          <Button variant="secondary" onClick={this.props.onhide}>
            Close
          </Button>
          <Button variant="primary" onClick={() => this.props.onhide}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
  </>
    );
   }
}

function isIdentifier(identifier: string) {
  return(
    <div>
      Identifier: <span><br/><input type="text" defaultValue={identifier} placeholder="Identifier" readOnly={true} /></span>
    </div>
  )
}

function isID(id: number){
  return ( 
    <div>
      ID: <br/><input type="text" defaultValue={id} placeholder="ID" readOnly/>
    </div>
  )
}

function isName (name: string){
  return( 
    <div>
      Name of Meter: <br/> <input type="text" defaultValue={name} placeholder="Name" readOnly={true}/> 
    </div>
  )
}
function isGPS(gps?: GPSPoint) {
  if(gps != null) {
    return(
      <div>
     GPS: <span><br/><input type="text" value={"Latitude:" + gps.latitude + " Longitude: "+ gps.longitude}/></span>
    </div>
    )
  }
  return(
    <div>
     GPS: <span><br/><input type="text" value="Filler Information" autoFocus/></span>
    </div>
  );
}
/**
 * TODO ADD METER UNITS FROM RESOURCE GENERALIZATION 
 * @param unit 
 * @returns 
 */
function isUnits(unit?: string){
  return(
    <div>
        Units: <span> 
          <Dropdown>
          <Dropdown.Toggle id="dropdown-button-dark-example1" size="sm" variant="secondary">
          Dropdown Button
        </Dropdown.Toggle>
            <Dropdown.Menu variant="dark">
              <Dropdown.Item active>
                Action
              </Dropdown.Item>
              <Dropdown.Item >option1</Dropdown.Item>
              <Dropdown.Item >Something else</Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item >other option </Dropdown.Item>
          </Dropdown.Menu>
          </Dropdown>
          </span>
              </div>
  );
}

function isMeterType(type?: string) {
   const types : meterTypes = {
    MAMAC: 'MAMAC',
	  METASYS: 'METASYS',
	  OBVIUS: 'OBVIUS',
	  OTHER: 'other'
  } 
  for(var property in types){
    if (type == types['MAMAC']){
       delete types['MAMAC']
       break
    }
    if(type == types['METASYS']){
      delete types.METASYS
      break
    }
    if(type == types['OBVIUS']){
      delete types.OBVIUS
      break
    }
    if(type == types['OTHER']){
      delete types.OTHER
      break
    }
  }
  if(type == 'other'){
  return(
      <div>
        Meter-Type: <span>
          <Dropdown>
            <Dropdown.Toggle id="dropdown-button-dark-example1" size="sm" variant="secondary">
              {type}
            </Dropdown.Toggle>
            <Dropdown.Menu variant="dark">
              <Dropdown.Item >{types.MAMAC}</Dropdown.Item>
              <Dropdown.Item >{types.METASYS}</Dropdown.Item>
              <Dropdown.Item >{types.OBVIUS}</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          </span>
      </div>
    )
  }
  if(type == 'MAMAC'){
    return(
      <div>
        Meter-Type: <span>
          <Dropdown>
            <Dropdown.Toggle id="dropdown-button-dark-example1" size="sm" variant="secondary">
              {type}
            </Dropdown.Toggle>
            <Dropdown.Menu variant="dark">
              <Dropdown.Item >{types.METASYS}</Dropdown.Item>
              <Dropdown.Item >{types.OBVIUS}</Dropdown.Item>
              <Dropdown.Item >{types.OTHER}</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          </span>
      </div>
    )
  }
  if(type == 'METASYS'){
    return(
      <div>
        Meter-Type: <span>
          <Dropdown>
            <Dropdown.Toggle id="dropdown-button-dark-example1" size="sm" variant="secondary">
              {type}
            </Dropdown.Toggle>
            <Dropdown.Menu variant="dark">
              <Dropdown.Item >{types.MAMAC}</Dropdown.Item>
              <Dropdown.Item >{types.OBVIUS}</Dropdown.Item>
              <Dropdown.Item >{types.OTHER}</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          </span>
      </div>
    )
  }
  if(type == 'OBVIUS'){
    return(
      <div>
        Meter-Type: <span>
          <Dropdown>
            <Dropdown.Toggle id="dropdown-button-dark-example1" size="sm" variant="secondary">
              {type}
            </Dropdown.Toggle>
            <Dropdown.Menu variant="dark">
              <Dropdown.Item >{types.MAMAC}</Dropdown.Item>
              <Dropdown.Item >{types.METASYS}</Dropdown.Item>
              <Dropdown.Item >{types.OTHER}</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
          </span>
      </div>
    )
  }
}
/** TODO ADD GRAPHICAL UNITS FROM RESOURCE GENERALIZATION
 * 
 * @param gUnit 
 * @returns 
 */
function isGraphicUnits(gUnit: number){
  return(
  <div>
    Graphic Units: 
      <Dropdown>
      <Dropdown.Toggle id="dropdown-button-dark-example1" size="sm"variant="secondary">
        Dropdown Button
      </Dropdown.Toggle>
        <Dropdown.Menu variant="dark">
          <Dropdown.Item active>
            Action
          </Dropdown.Item>
          <Dropdown.Item >option1</Dropdown.Item>
          <Dropdown.Item >Something else</Dropdown.Item>
          <Dropdown.Divider />
          <Dropdown.Item >other option </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
  </div>   
  )
}

function isDisplaying(display: boolean) {
    return (
      <div>
        Displayable: <span><input type="checkbox" checked={display}/></span>
      </div>
    );
}

function isEnabled(enabled: boolean) {
  if(!enabled) {
    <div>
        Enabled: <span><input type="checkbox"/></span>
      </div>
  }
  return(
      <div>
      Enabled: <span><input type="checkbox" checked/></span>
    </div>
    )
}

function isArea(area: number){
  if(area!= null){
    return(
    <div>
    Area: <span><br/><input type="text" defaultValue={area} placeholder="Identifier" /></span>
    </div>
    )
  }
  return(
    <div>
      Area: <span><br/><input type="text" defaultValue="" /></span>
    </div>
  )
}

function isMeterIP(address?: string){
  return(
  <div>
    Meter Address: <span><br/><input type="text" defaultValue={address} placeholder="MeterAddress"/></span>
  </div>
  )
}

function isNotes(note: string){
  return(
    <div>
      Notes:<br/> <input type="text" defaultValue={note} placeholder=""/>
    </div>
  )
}

function isCumulative(cumulative: boolean){
  return(
    <div>
      Cumulative: <input type="checkbox" checked={cumulative}/>
    </div>
  )
}

function isCumulativeReset(cumulativeReset: boolean){
  return(
    <div>
     CumulativeReset: <input type="checkbox" checked={cumulativeReset}/>
    </div>
    )
}

function isResetStartTime(time: string){
  return(
    <div>
      Reset Start-Time: <input type="text" defaultValue={time} placeholder="ResetTime" />
    </div>
  )
}

function isTimeSort(sort: boolean){
  return(
  <div>
    Time Sort: <input type="checkbox" checked={sort}/>
  </div>
  )
}

function isEndOnly(end: boolean){
  return(
    <div>
      End Only: <input type="checkbox" checked={end}/>
    </div>
  )
}

function isReadGap(readGap: string){
  return(
    <div>
      Read Gap: <br/> <input type="text" defaultValue={readGap} placeholder="" />
    </div>
  )
}

function isReadingVariation(readingVariation: number) {
  return(
    <div>
      Reading Variation: <br/> <input type="text" defaultValue={readingVariation}/>
    </div>
  )
}
/**
 * TODO ADD READING VARIATIONS FROM RESOURCE GENERALIZATION
 * @param variation 
 * @returns 
 */
function isReadingDuplication(variation: number){
  return(
    <div>
      Reading Duplication: <br/> 
      <span> 
        <Dropdown>
        <Dropdown.Toggle id="dropdown-button-dark-example1" size="sm" variant="secondary">
        {variation}
      </Dropdown.Toggle>
          <Dropdown.Menu variant="dark">
            <Dropdown.Item >{variation + 1}</Dropdown.Item>
            <Dropdown.Item >{variation + 2}</Dropdown.Item>
            <Dropdown.Item >{variation + 3}</Dropdown.Item>
        </Dropdown.Menu>
        </Dropdown>
        </span>
    </div>
  )
}
/**
 * TODO ADD TIMEZONE IMPLEMENTATION
 * @returns 
 */
function isTimeZone(){
  return( 
    <div>
    Timezones:
    <span> 
      <Dropdown>
      <Dropdown.Toggle id="dropdown-button-dark-example1" size="sm" variant="secondary">
      EST/PST/CST
    </Dropdown.Toggle>
        <Dropdown.Menu variant="dark">
          <Dropdown.Item active>
            Action
          </Dropdown.Item>
          <Dropdown.Item >option1</Dropdown.Item>
          <Dropdown.Item >Something else</Dropdown.Item>
          <Dropdown.Divider />
          <Dropdown.Item >other option </Dropdown.Item>
      </Dropdown.Menu>
      </Dropdown>
      </span>
  </div>
  )
}
/**
 * TODO RESOURCE GENERALIZATION TO IMPLEMENT READING
 * @returns 
 */
function isReading(){
  return( 
    <div>
      Reading:<br/> <input type="text" value="Filler Information"/>
    </div>
  )
}

function isStartDateTime(startTime: string){
  return( 
    <div>
      Start Date/Time:<br/> <input type="text" defaultValue={startTime}/>
    </div>
  )
}

function isEndDateTime(endTime: string){
  return ( 
    <div>
      End Date/Time:<br/> <input type="text" defaultValue={endTime}/>
    </div>
  )
}
export default MeterModalEditComponent;