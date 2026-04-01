'use strict';

/**
 * Goodwe GW10K-ET Modbus Register Map
 * Based on Goodwe Modbus Protocol Documentation
 * Compatible with Home Assistant goodwe integration
 */

const REGISTER_GROUPS = {
    'inverter': 'Inverter Info',
    'pv': 'PV (Solar Panels)',
    'grid': 'Grid',
    'battery': 'Battery',
    'load': 'Load / Consumption',
    'meter': 'Energy Meter (Totals)',
    'settings': 'Settings & Control',
    'status': 'Status & Alarms',
};

const REGISTERS = {
    // ─── INVERTER INFO (Read-only, 0x0000 area) ───────────────────────────────
    serial_number: {
        address: 0x0000, words: 8, dataType: 'string',
        name: 'Serial Number', group: 'inverter', role: 'info.serial',
        type: 'string',
    },
    model_name: {
        address: 0x0008, words: 8, dataType: 'string',
        name: 'Model Name', group: 'inverter', role: 'info.name',
        type: 'string',
    },
    dsp_firmware: {
        address: 0x0012, dataType: 'uint16',
        name: 'DSP Firmware Version', group: 'inverter', role: 'text',
        type: 'number',
    },
    arm_firmware: {
        address: 0x0013, dataType: 'uint16',
        name: 'ARM Firmware Version', group: 'inverter', role: 'text',
        type: 'number',
    },
    rated_power: {
        address: 0x0026, dataType: 'uint16', scale: 0.1,
        name: 'Rated Power', group: 'inverter', unit: 'kW', role: 'value.power',
    },

    // ─── STATUS ────────────────────────────────────────────────────────────────
    inverter_status: {
        address: 0x0200, dataType: 'uint16',
        name: 'Inverter Status', group: 'status', role: 'value',
        states: {
            0: 'Waiting',
            1: 'Normal',
            2: 'Error',
            3: 'Checking',
        },
        type: 'string',
    },
    work_mode: {
        address: 0x0168, dataType: 'uint16',
        name: 'Work Mode', group: 'status', role: 'value',
        states: {
            0: 'General Mode',
            1: 'Off Grid Mode',
            2: 'Backup Mode',
            3: 'Eco Mode',
            4: 'Eco Charge Mode',
            5: 'Peak Shaving Mode',
        },
        type: 'string',
    },
    safety_country: {
        address: 0x00F5, dataType: 'uint16',
        name: 'Safety Country Code', group: 'status', role: 'value',
        type: 'number',
    },
    temperature: {
        address: 0x0214, dataType: 'int16', scale: 0.1,
        name: 'Inverter Temperature', group: 'status', unit: '°C', role: 'value.temperature',
    },
    error_codes: {
        address: 0x0201, words: 2, dataType: 'uint32',
        name: 'Error Codes', group: 'status', role: 'value',
        type: 'number',
    },

    // ─── PV INPUT ──────────────────────────────────────────────────────────────
    pv1_voltage: {
        address: 0x0500, dataType: 'uint16', scale: 0.1,
        name: 'PV1 Voltage', group: 'pv', unit: 'V', role: 'value.voltage',
    },
    pv1_current: {
        address: 0x0501, dataType: 'uint16', scale: 0.1,
        name: 'PV1 Current', group: 'pv', unit: 'A', role: 'value.current',
    },
    pv1_power: {
        address: 0x0502, dataType: 'uint16',
        name: 'PV1 Power', group: 'pv', unit: 'W', role: 'value.power',
    },
    pv2_voltage: {
        address: 0x0503, dataType: 'uint16', scale: 0.1,
        name: 'PV2 Voltage', group: 'pv', unit: 'V', role: 'value.voltage',
    },
    pv2_current: {
        address: 0x0504, dataType: 'uint16', scale: 0.1,
        name: 'PV2 Current', group: 'pv', unit: 'A', role: 'value.current',
    },
    pv2_power: {
        address: 0x0505, dataType: 'uint16',
        name: 'PV2 Power', group: 'pv', unit: 'W', role: 'value.power',
    },
    pv_power_total: {
        address: 0x05BA, dataType: 'uint16',
        name: 'Total PV Power', group: 'pv', unit: 'W', role: 'value.power',
    },
    pv_energy_today: {
        address: 0x0534, dataType: 'uint16', scale: 0.1,
        name: 'PV Energy Today', group: 'pv', unit: 'kWh', role: 'value.power.consumption',
    },
    pv_energy_total: {
        address: 0x0534 + 2, words: 2, dataType: 'uint32', scale: 0.1,
        name: 'PV Energy Total', group: 'pv', unit: 'kWh', role: 'value.power.consumption',
    },

    // ─── GRID ──────────────────────────────────────────────────────────────────
    grid_voltage_r: {
        address: 0x0506, dataType: 'uint16', scale: 0.1,
        name: 'Grid Voltage L1', group: 'grid', unit: 'V', role: 'value.voltage',
    },
    grid_current_r: {
        address: 0x0507, dataType: 'int16', scale: 0.1,
        name: 'Grid Current L1', group: 'grid', unit: 'A', role: 'value.current',
    },
    grid_frequency: {
        address: 0x050A, dataType: 'uint16', scale: 0.01,
        name: 'Grid Frequency', group: 'grid', unit: 'Hz', role: 'value.frequency',
    },
    grid_power: {
        address: 0x0212, dataType: 'int16',
        name: 'Grid Power (+ export / - import)', group: 'grid', unit: 'W', role: 'value.power',
    },
    grid_power_r: {
        address: 0x050B, dataType: 'int16',
        name: 'Grid Power L1', group: 'grid', unit: 'W', role: 'value.power',
    },
    grid_power_s: {
        address: 0x0509, dataType: 'int16',
        name: 'Grid Power L2', group: 'grid', unit: 'W', role: 'value.power',
    },
    grid_power_t: {
        address: 0x050C, dataType: 'int16',
        name: 'Grid Power L3', group: 'grid', unit: 'W', role: 'value.power',
    },
    grid_apparent_power: {
        address: 0x050D, dataType: 'int16',
        name: 'Grid Apparent Power', group: 'grid', unit: 'VA', role: 'value.power',
    },
    grid_power_factor: {
        address: 0x050E, dataType: 'int16', scale: 0.001,
        name: 'Power Factor', group: 'grid', unit: '', role: 'value',
    },
    meter_power: {
        address: 0x050F, dataType: 'int32', words: 2,
        name: 'Meter Power (CT)', group: 'grid', unit: 'W', role: 'value.power',
    },
    grid_energy_export_today: {
        address: 0x0520, dataType: 'uint16', scale: 0.1,
        name: 'Energy Exported Today', group: 'grid', unit: 'kWh', role: 'value.power.consumption',
    },
    grid_energy_export_total: {
        address: 0x0521, words: 2, dataType: 'uint32', scale: 0.1,
        name: 'Energy Exported Total', group: 'grid', unit: 'kWh', role: 'value.power.consumption',
    },
    grid_energy_import_today: {
        address: 0x0524, dataType: 'uint16', scale: 0.1,
        name: 'Energy Imported Today', group: 'grid', unit: 'kWh', role: 'value.power.consumption',
    },
    grid_energy_import_total: {
        address: 0x0525, words: 2, dataType: 'uint32', scale: 0.1,
        name: 'Energy Imported Total', group: 'grid', unit: 'kWh', role: 'value.power.consumption',
    },
    grid_in_out: {
        address: 0x0213, dataType: 'uint16',
        name: 'Grid Feed-In Status', group: 'grid', role: 'value',
        states: { 0: 'Exporting', 1: 'Importing', 2: 'No exchange' },
        type: 'string',
    },

    // ─── BATTERY ───────────────────────────────────────────────────────────────
    battery_voltage: {
        address: 0x0600, dataType: 'uint16', scale: 0.1,
        name: 'Battery Voltage', group: 'battery', unit: 'V', role: 'value.voltage',
    },
    battery_current: {
        address: 0x0601, dataType: 'int16', scale: 0.1,
        name: 'Battery Current (+ charge / - discharge)', group: 'battery', unit: 'A', role: 'value.current',
    },
    battery_power: {
        address: 0x0606, dataType: 'int16',
        name: 'Battery Power (+ charge / - discharge)', group: 'battery', unit: 'W', role: 'value.power',
    },
    battery_mode: {
        address: 0x0168, dataType: 'uint16',
        name: 'Battery Mode', group: 'battery', role: 'value',
        states: {
            0: 'Normal', 1: 'Charging', 2: 'Discharging',
        },
        type: 'string',
    },
    battery_soc: {
        address: 0x0608, dataType: 'uint16',
        name: 'Battery State of Charge', group: 'battery', unit: '%', role: 'value.battery',
    },
    battery_soh: {
        address: 0x0609, dataType: 'uint16',
        name: 'Battery State of Health', group: 'battery', unit: '%', role: 'value',
    },
    battery_temperature: {
        address: 0x0607, dataType: 'int16', scale: 0.1,
        name: 'Battery Temperature', group: 'battery', unit: '°C', role: 'value.temperature',
    },
    battery_charge_today: {
        address: 0x0611, dataType: 'uint16', scale: 0.1,
        name: 'Battery Charged Today', group: 'battery', unit: 'kWh', role: 'value.power.consumption',
    },
    battery_charge_total: {
        address: 0x0612, words: 2, dataType: 'uint32', scale: 0.1,
        name: 'Battery Charged Total', group: 'battery', unit: 'kWh', role: 'value.power.consumption',
    },
    battery_discharge_today: {
        address: 0x0614, dataType: 'uint16', scale: 0.1,
        name: 'Battery Discharged Today', group: 'battery', unit: 'kWh', role: 'value.power.consumption',
    },
    battery_discharge_total: {
        address: 0x0615, words: 2, dataType: 'uint32', scale: 0.1,
        name: 'Battery Discharged Total', group: 'battery', unit: 'kWh', role: 'value.power.consumption',
    },
    battery_cycles: {
        address: 0x060A, dataType: 'uint16',
        name: 'Battery Charge Cycles', group: 'battery', role: 'value',
    },
    battery_bms_status: {
        address: 0x0610, dataType: 'uint16',
        name: 'BMS Status', group: 'battery', role: 'value',
        type: 'number',
    },
    battery_warning: {
        address: 0x0603, dataType: 'uint16',
        name: 'Battery Warning', group: 'battery', role: 'value',
        type: 'number',
    },

    // ─── LOAD / CONSUMPTION ────────────────────────────────────────────────────
    load_power: {
        address: 0x050E, dataType: 'int16',  // Derived from multiple readings
        name: 'House Load Power', group: 'load', unit: 'W', role: 'value.power',
    },
    backup_power: {
        address: 0x0510, dataType: 'int16',
        name: 'Backup/EPS Power', group: 'load', unit: 'W', role: 'value.power',
    },
    backup_voltage: {
        address: 0x0511, dataType: 'uint16', scale: 0.1,
        name: 'Backup/EPS Voltage', group: 'load', unit: 'V', role: 'value.voltage',
    },
    backup_current: {
        address: 0x0512, dataType: 'uint16', scale: 0.1,
        name: 'Backup/EPS Current', group: 'load', unit: 'A', role: 'value.current',
    },
    backup_frequency: {
        address: 0x0513, dataType: 'uint16', scale: 0.01,
        name: 'Backup/EPS Frequency', group: 'load', unit: 'Hz', role: 'value.frequency',
    },

    // ─── ENERGY TOTALS ─────────────────────────────────────────────────────────
    inverter_output_energy_today: {
        address: 0x0534, dataType: 'uint16', scale: 0.1,
        name: 'Inverter Output Today', group: 'meter', unit: 'kWh', role: 'value.power.consumption',
    },
    inverter_output_energy_total: {
        address: 0x0536, words: 2, dataType: 'uint32', scale: 0.1,
        name: 'Inverter Output Total', group: 'meter', unit: 'kWh', role: 'value.power.consumption',
    },
    load_energy_today: {
        address: 0x0527, dataType: 'uint16', scale: 0.1,
        name: 'House Load Today', group: 'meter', unit: 'kWh', role: 'value.power.consumption',
    },
    load_energy_total: {
        address: 0x0528, words: 2, dataType: 'uint32', scale: 0.1,
        name: 'House Load Total', group: 'meter', unit: 'kWh', role: 'value.power.consumption',
    },
    self_consumption_today: {
        address: 0x053A, dataType: 'uint16', scale: 0.1,
        name: 'Self Consumption Today', group: 'meter', unit: 'kWh', role: 'value.power.consumption',
    },

    // ─── SETTINGS (Writable) ───────────────────────────────────────────────────
    battery_reserve_soc: {
        address: 0x00BE, dataType: 'uint16',
        name: 'Battery Reserve SOC', group: 'settings',
        unit: '%', role: 'value', writable: true, min: 0, max: 100,
    },
    battery_charge_soc_limit: {
        address: 0x00BD, dataType: 'uint16',
        name: 'Battery Charge SOC Limit', group: 'settings',
        unit: '%', role: 'value', writable: true, min: 0, max: 100,
    },
    ac_charge_enabled: {
        address: 0x00F0, dataType: 'uint16',
        name: 'AC Charge Enabled', group: 'settings',
        role: 'switch', type: 'boolean', writable: true,
        states: { 0: false, 1: true },
    },
    export_limit: {
        address: 0x00D8, dataType: 'uint16',
        name: 'Grid Export Limit', group: 'settings',
        unit: 'W', role: 'value', writable: true, min: 0, max: 10000,
    },
    power_mode: {
        address: 0x0168, dataType: 'uint16',
        name: 'Power Mode', group: 'settings',
        role: 'value', writable: true,
        states: {
            0: 'General Mode',
            1: 'Off Grid Mode',
            2: 'Backup Mode',
            3: 'Eco Mode',
            4: 'Eco Charge Mode',
            5: 'Peak Shaving Mode',
        },
        type: 'string',
    },
    charge_time1_start: {
        address: 0x00F1, dataType: 'uint16',
        name: 'Charge Time 1 Start (HHMM)', group: 'settings',
        role: 'value', writable: true,
    },
    charge_time1_stop: {
        address: 0x00F2, dataType: 'uint16',
        name: 'Charge Time 1 Stop (HHMM)', group: 'settings',
        role: 'value', writable: true,
    },
    charge_time2_start: {
        address: 0x00F4, dataType: 'uint16',
        name: 'Charge Time 2 Start (HHMM)', group: 'settings',
        role: 'value', writable: true,
    },
    charge_time2_stop: {
        address: 0x00F5, dataType: 'uint16',
        name: 'Charge Time 2 Stop (HHMM)', group: 'settings',
        role: 'value', writable: true,
    },
};

// Add key property to each register for later reference
for (const [key, reg] of Object.entries(REGISTERS)) {
    reg.key = key;
}

module.exports = { REGISTERS, REGISTER_GROUPS };
