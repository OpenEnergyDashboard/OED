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
  onSaveChanges: (identifier: string, condition: boolean) => void;
  handleIdentifierChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
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
  startTimestamp: string;
  endTimestamp: string;
}

type MeterViewPropsWithIntl = MetaDataProps;

class MeterModalEditComponent extends React.Component<MeterViewPropsWithIntl,
  { show: boolean, nameinput: string, identifierinput: string, identifier: string }>{
  constructor(props: MeterViewPropsWithIntl) {
    super(props);
    this.state = {
      show: this.props.show,
      nameinput: this.props.name,
      identifier: this.props.identifier,
      identifierinput: this.props.identifier
    };
    this.identifierInput = this.identifierInput.bind(this);
  }

  identifierInput() {
    this.props.onhide();
    const identifier = this.state.identifierinput;
    return identifier;
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
                {this.isIdentifier(this.props.identifier)}

                {this.isUnits(this.props.units)}

                {this.isMeterType(this.props.meterType)}

                {this.isGraphicUnits(this.props.graphicUnit)}

                {this.isGPS(this.props.gps)}

                {this.isArea(this.props.Area)}

                {this.isDisplaying(this.props.displayable)}

                {this.isEnabled(this.props.enabled)}

                {this.isMeterIP(this.props.meterAddress)}

                {this.isTimeZone()}
                {this.isNotes(this.props.notes)}

                {this.isCumulative(this.props.cumulative)}

                {this.isCumulativeReset(this.props.cumulativeReset)}

              </div>
              <div id="modalChild">


                {this.isResetStartTime(this.props.cumulativeResetStart)}

                {this.isResetEndTime(this.props.cumulativeResetEnd)}

                {this.isTimeSort(this.props.timesort)}

                {this.isEndOnly(this.props.endOnlyTime)}

                {this.isReadGap(this.props.readingGap)}

                {this.isReadingVariation(this.props.readingVariation)}

                {this.isReadingDuplication(this.props.readingDuplication)}

                {this.isReading()}

                {this.isStartDateTime(this.props.startTimestamp)}

                {this.isEndDateTime(this.props.endTimestamp)}

                {this.isID(this.props.id)}

                {this.isName(this.props.name)}
              </div>
            </div>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={this.props.onhide}>
              Close
            </Button>
            <Button variant="primary" onClick={() => this.props.onSaveChanges(this.identifierInput(),true)}>
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }

  private handleNameChange(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({ nameinput: event.target.value });
    console.log(this.state.nameinput);
  }

  private handleIdentifier(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({ identifierinput: event.target.value });
    console.log(this.state.identifierinput);
  }

  private isIdentifier(identifier: string) {
    return (
      <div>
        Identifier: <span><br /><input type="textarea" defaultValue={identifier} placeholder="Identifier" onChange={event => this.props.handleIdentifierChange(event)} /></span>
      </div>
    )
  }

  private isID(id: number) {
    return (
      <div>
        ID: <br /><input type="text" defaultValue={id} placeholder="ID" readOnly />
      </div>
    )
  }

  private isName(name: string) {
    return (
      <div>
        Name of Meter: <br /> <input type="text" defaultValue={name} placeholder="Name" onChange={this.handleNameChange} />
      </div>
    )
  }
  private isGPS(gps?: GPSPoint) {
    if (gps != null) {
      return (
        <div>
          GPS: <span><br /><input type="text" value={"Latitude:" + gps.latitude + " Longitude: " + gps.longitude} /></span>
        </div>
      )
    }
    return (
      <div>
        GPS: <span><br /><input type="text" value="Filler Information" autoFocus /></span>
      </div>
    );
  }
  /**
   * TODO ADD METER UNITS FROM RESOURCE GENERALIZATION 
   * @param unit 
   * @returns 
   */

  private isUnits(unit?: string) {
    return (
      <div>
        Units: <span>
          <Dropdown>
            <Dropdown.Toggle id="dropdown-button-dark-example1" size="sm" variant="secondary">
              Kilowatts
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


  private isMeterType(type?: string) {
    const types: meterTypes = {
      MAMAC: 'MAMAC',
      METASYS: 'METASYS',
      OBVIUS: 'OBVIUS',
      OTHER: 'other'
    }
    for (var property in types) {
      if (type == types['MAMAC']) {
        delete types['MAMAC']
        break
      }
      if (type == types['METASYS']) {
        delete types.METASYS
        break
      }
      if (type == types['OBVIUS']) {
        delete types.OBVIUS
        break
      }
      if (type == types['OTHER']) {
        delete types.OTHER
        break
      }
    }
    if (type == 'other') {
      return (
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
    if (type == 'MAMAC') {
      return (
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
    if (type == 'METASYS') {
      return (
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
    if (type == 'OBVIUS') {
      return (
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

  private isGraphicUnits(gUnit: number) {
    return (
      <div>
        Graphic Units:
        <Dropdown>
          <Dropdown.Toggle id="dropdown-button-dark-example1" size="sm" variant="secondary">
            Units
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


  private isDisplaying(display: boolean) {
    return (
      <div>
        Displayable: <span><input type="checkbox" checked={display} /></span>
      </div>
    );
  }


  private isEnabled(enabled: boolean) {
    if (!enabled) {
      <div>
        Enabled: <span><input type="checkbox" /></span>
      </div>
    }
    return (
      <div>
        Enabled: <span><input type="checkbox" checked /></span>
      </div>
    )
  }


  private isArea(area: number) {
    if (area != null) {
      return (
        <div>
          Area: <span><br /><input type="text" defaultValue={area} placeholder="Identifier" /></span>
        </div>
      )
    }
    return (
      <div>
        Area: <span><br /><input type="text" defaultValue="" /></span>
      </div>
    )
  }


  private isMeterIP(address?: string) {
    return (
      <div>
        Meter Address: <span><br /><input type="text" defaultValue={address} placeholder="MeterAddress" /></span>
      </div>
    )
  }


  private isNotes(note: string) {
    return (
      <div>
        Notes:<br /> <input type="text" defaultValue={note} placeholder="" />
      </div>
    )
  }


  private isCumulative(cumulative: boolean) {
    return (
      <div>
        Cumulative: <input type="checkbox" checked={cumulative} />
      </div>
    )
  }


  private isCumulativeReset(cumulativeReset: boolean) {
    return (
      <div>
        CumulativeReset: <input type="checkbox" checked={cumulativeReset} />
      </div>
    )
  }


  private isResetStartTime(time: string) {
    return (
      <div>
        Reset Start-Time: <input type="text" defaultValue={time} placeholder="" />
      </div>
    )
  }


  private isResetEndTime(time: string) {
    return (
      <div>
        Reset End-Time: <input type="text" defaultValue={time} placeholder="" />
      </div>
    )
  }


  private isTimeSort(sort: boolean) {
    return (
      <div>
        Time Sort: <input type="checkbox" checked={sort} />
      </div>
    )
  }


  private isEndOnly(end: boolean) {
    return (
      <div>
        End Only: <input type="checkbox" checked={end} />
      </div>
    )
  }


  private isReadGap(readGap: string) {
    return (
      <div>
        Read Gap: <br /> <input type="text" defaultValue={readGap} placeholder="" />
      </div>
    )
  }


  private isReadingVariation(readingVariation: number) {
    return (
      <div>
        Reading Variation: <br /> <input type="text" defaultValue={readingVariation} />
      </div>
    )
  }
  /**
   * TODO ADD READING VARIATIONS FROM RESOURCE GENERALIZATION
   * @param variation 
   * @returns 
   */

  private isReadingDuplication(variation: number) {
    return (
      <div>
        Reading Duplication: <br />
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

  private isTimeZone() {
    return (
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

  private isReading() {
    return (
      <div>
        Reading:<br /> <input type="text" value="Filler Information" />
      </div>
    )
  }


  private isStartDateTime(startTime: string) {
    return (
      <div>
        Start Date/Time:<br /> <input type="text" defaultValue={startTime} />
      </div>
    )
  }


  private isEndDateTime(endTime: string) {
    return (
      <div>
        End Date/Time:<br /> <input type="text" defaultValue={endTime} />
      </div>
    )
  }
}
export default MeterModalEditComponent;