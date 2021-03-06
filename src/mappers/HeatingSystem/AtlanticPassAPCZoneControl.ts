import { Perms } from 'homebridge';
import { Characteristics } from '../../Platform';
import { Command } from 'overkiz-client';
import HeatingSystem from '../HeatingSystem';

export default class AtlanticPassAPCZoneControl extends HeatingSystem { 
    protected registerServices() {
        this.registerThermostatService();
        this.targetTemperature?.setProps({ perms: [Perms.PAIRED_READ, Perms.EVENTS] });
        this.targetTemperature?.updateValue(19);
        this.currentTemperature?.updateValue(19);
    }

    protected getTargetStateCommands(value): Command | Array<Command> {
        switch(value) {
            case Characteristics.TargetHeatingCoolingState.AUTO:
                return [
                    new Command('setPassAPCOperatingMode', 'heating'),
                    new Command('setHeatingCoolingAutoSwitch', 'on'),
                ];

            case Characteristics.TargetHeatingCoolingState.HEAT:
                return [
                    new Command('setPassAPCOperatingMode', 'heating'),
                    new Command('setHeatingCoolingAutoSwitch', 'off'),
                ];

            case Characteristics.TargetHeatingCoolingState.COOL:
                return [
                    new Command('setPassAPCOperatingMode', 'cooling'),
                    new Command('setHeatingCoolingAutoSwitch', 'off'),
                ];

            default:
            case Characteristics.TargetHeatingCoolingState.OFF:
                return [
                    new Command('setPassAPCOperatingMode', 'stop'),
                ];
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected getTargetTemperatureCommands(value): Command | Array<Command> {
        return [];
    }

    protected onStateChanged(name, value) {
        switch(name) {
            case 'io:PassAPCOperatingModeState':
            case 'core:HeatingCoolingAutoSwitchState':
                this.postpone(this.computeStates);
        }
    }

    protected computeStates() {
        let targetState;
        switch(this.device.get('io:PassAPCOperatingModeState')) {
            case 'heating':
                if(this.device.get('core:HeatingCoolingAutoSwitchState') === 'on') {
                    targetState = Characteristics.TargetHeatingCoolingState.AUTO;
                } else {
                    targetState = Characteristics.TargetHeatingCoolingState.HEAT;
                }
                this.currentState?.updateValue(Characteristics.CurrentHeatingCoolingState.HEAT);
                break;
            case 'cooling':
                if(this.device.get('core:HeatingCoolingAutoSwitchState') === 'on') {
                    targetState = Characteristics.TargetHeatingCoolingState.AUTO;
                } else {
                    targetState = Characteristics.TargetHeatingCoolingState.COOL;
                }
                this.currentState?.updateValue(Characteristics.CurrentHeatingCoolingState.COOL);
                break;
            case 'stop':
                targetState = Characteristics.TargetHeatingCoolingState.OFF;
                this.currentState?.updateValue(Characteristics.CurrentHeatingCoolingState.OFF);
                break;
        }
        
        // eslint-disable-next-line eqeqeq
        if(this.targetState !== undefined && targetState != null && this.isIdle) {
            this.targetState.updateValue(targetState);
        }
    }
}