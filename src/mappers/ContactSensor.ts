import { Characteristics, Services } from '../Platform';
import { Characteristic } from 'homebridge';
import Mapper from '../Mapper';

export default class ContactSensor extends Mapper {
    protected state: Characteristic | undefined;
    protected fault: Characteristic | undefined;
    protected battery: Characteristic | undefined;
    
    protected registerServices() {
        const service = this.registerService(Services.ContactSensor);
        this.state = service.getCharacteristic(Characteristics.ContactSensorState);
        if(this.device.hasState('core:SensorDefectState')) {
            this.fault = this.registerCharacteristic(service, Characteristics.StatusFault);
            this.battery = this.registerCharacteristic(service, Characteristics.StatusLowBattery);
        }
    }

    protected onStateChanged(name: string, value) {
        switch(name) {
            case 'core:ContactState':
                switch(value) {
                    case 'closed':
                        this.state?.updateValue(Characteristics.ContactSensorState.CONTACT_DETECTED);
                        break;
                    case 'tilt':
                    case 'open': 
                        this.state?.updateValue(Characteristics.ContactSensorState.CONTACT_NOT_DETECTED);
                        break;
                }
                break;
            case 'core:SensorDefectState':
                switch(value) {
                    case 'lowBattery':
                        this.battery?.updateValue(Characteristics.StatusLowBattery.BATTERY_LEVEL_LOW);
                        break;
                    case 'maintenanceRequired':
                    case 'dead':
                        this.fault?.updateValue(Characteristics.StatusFault.GENERAL_FAULT);
                        break;
                    case 'noDefect':
                        this.fault?.updateValue(Characteristics.StatusFault.NO_FAULT);
                        this.battery?.updateValue(Characteristics.StatusLowBattery.BATTERY_LEVEL_NORMAL);
                        break;
                }
                break;
        }
    }
}