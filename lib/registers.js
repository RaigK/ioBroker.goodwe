'use strict';

/**
 * Goodwe ET/EH/BT Modbus Register Map
 * Portiert von der offiziellen Python-Bibliothek:
 * https://github.com/marcelblijleven/goodwe/blob/master/goodwe/et.py
 *
 * Adressbereiche (dezimal):
 *   35100 (0x891C) – Haupt-Sensordaten (PV, Grid, Battery, Load, Temps, Energie)
 *   36000 (0x8CA0) – Zählerdaten (Meter / CT)
 *   37000 (0x9088) – Batterie BMS Daten
 */

const REGISTER_GROUPS = {
    'inverter': 'Wechselrichter Info',
    'pv':       'PV (Solaranlage)',
    'grid':     'Netz (Grid)',
    'battery':  'Batterie',
    'backup':   'Backup / EPS',
    'load':     'Verbrauch (Load)',
    'meter':    'Energiezähler (Meter)',
    'bms':      'Batterie BMS',
    'settings': 'Einstellungen',
};

const REGISTERS = {

    // ── HAUPT-SENSOREN ab 35100 ───────────────────────────────────────────────
    timestamp_ymd: {
        address: 35100, dataType: 'uint16',
        name: 'Datum (Jahr/Monat/Tag kodiert)', group: 'inverter', role: 'value', type: 'number',
    },
    timestamp_hms: {
        address: 35101, dataType: 'uint16',
        name: 'Uhrzeit (Std/Min/Sek kodiert)', group: 'inverter', role: 'value', type: 'number',
    },

    // PV
    vpv1: { address: 35103, dataType: 'uint16', scale: 0.1, name: 'PV1 Spannung', group: 'pv', unit: 'V', role: 'value.voltage' },
    ipv1: { address: 35104, dataType: 'uint16', scale: 0.1, name: 'PV1 Strom', group: 'pv', unit: 'A', role: 'value.current' },
    ppv1: { address: 35105, words: 2, dataType: 'int32', name: 'PV1 Leistung', group: 'pv', unit: 'W', role: 'value.power' },
    vpv2: { address: 35107, dataType: 'uint16', scale: 0.1, name: 'PV2 Spannung', group: 'pv', unit: 'V', role: 'value.voltage' },
    ipv2: { address: 35108, dataType: 'uint16', scale: 0.1, name: 'PV2 Strom', group: 'pv', unit: 'A', role: 'value.current' },
    ppv2: { address: 35109, words: 2, dataType: 'int32', name: 'PV2 Leistung', group: 'pv', unit: 'W', role: 'value.power' },
    vpv3: { address: 35111, dataType: 'uint16', scale: 0.1, name: 'PV3 Spannung', group: 'pv', unit: 'V', role: 'value.voltage' },
    ipv3: { address: 35112, dataType: 'uint16', scale: 0.1, name: 'PV3 Strom', group: 'pv', unit: 'A', role: 'value.current' },
    ppv3: { address: 35113, words: 2, dataType: 'int32', name: 'PV3 Leistung', group: 'pv', unit: 'W', role: 'value.power' },
    vpv4: { address: 35115, dataType: 'uint16', scale: 0.1, name: 'PV4 Spannung', group: 'pv', unit: 'V', role: 'value.voltage' },
    ipv4: { address: 35116, dataType: 'uint16', scale: 0.1, name: 'PV4 Strom', group: 'pv', unit: 'A', role: 'value.current' },
    ppv4: { address: 35117, words: 2, dataType: 'int32', name: 'PV4 Leistung', group: 'pv', unit: 'W', role: 'value.power' },

    // Grid
    vgrid:                { address: 35121, dataType: 'uint16', scale: 0.1,  name: 'Netzspannung L1',              group: 'grid', unit: 'V',   role: 'value.voltage' },
    igrid:                { address: 35122, dataType: 'int16',  scale: 0.1,  name: 'Netzstrom L1',                 group: 'grid', unit: 'A',   role: 'value.current' },
    fgrid:                { address: 35123, dataType: 'uint16', scale: 0.01, name: 'Netzfrequenz L1',              group: 'grid', unit: 'Hz',  role: 'value.frequency' },
    pgrid:                { address: 35125, dataType: 'int16',               name: 'Netzleistung L1',              group: 'grid', unit: 'W',   role: 'value.power' },
    vgrid2:               { address: 35126, dataType: 'uint16', scale: 0.1,  name: 'Netzspannung L2',              group: 'grid', unit: 'V',   role: 'value.voltage' },
    igrid2:               { address: 35127, dataType: 'int16',  scale: 0.1,  name: 'Netzstrom L2',                 group: 'grid', unit: 'A',   role: 'value.current' },
    fgrid2:               { address: 35128, dataType: 'uint16', scale: 0.01, name: 'Netzfrequenz L2',              group: 'grid', unit: 'Hz',  role: 'value.frequency' },
    pgrid2:               { address: 35130, dataType: 'int16',               name: 'Netzleistung L2',              group: 'grid', unit: 'W',   role: 'value.power' },
    vgrid3:               { address: 35131, dataType: 'uint16', scale: 0.1,  name: 'Netzspannung L3',              group: 'grid', unit: 'V',   role: 'value.voltage' },
    igrid3:               { address: 35132, dataType: 'int16',  scale: 0.1,  name: 'Netzstrom L3',                 group: 'grid', unit: 'A',   role: 'value.current' },
    fgrid3:               { address: 35133, dataType: 'uint16', scale: 0.01, name: 'Netzfrequenz L3',              group: 'grid', unit: 'Hz',  role: 'value.frequency' },
    pgrid3:               { address: 35135, dataType: 'int16',               name: 'Netzleistung L3',              group: 'grid', unit: 'W',   role: 'value.power' },
    grid_mode:            { address: 35136, dataType: 'uint16',              name: 'Grid Modus',                   group: 'grid', role: 'value', type: 'number' },
    total_inverter_power: { address: 35138, dataType: 'int16',              name: 'Gesamtleistung WR',            group: 'grid', unit: 'W',   role: 'value.power' },
    active_power:         { address: 35140, dataType: 'int16',               name: 'Wirkleistung (+Export/-Import)',group: 'grid', unit: 'W',   role: 'value.power' },
    reactive_power:       { address: 35142, dataType: 'int16',               name: 'Blindleistung',                group: 'grid', unit: 'var', role: 'value.power' },
    apparent_power:       { address: 35144, dataType: 'int16',               name: 'Scheinleistung',               group: 'grid', unit: 'VA',  role: 'value.power' },

    // Backup / EPS
    backup_v1:     { address: 35145, dataType: 'uint16', scale: 0.1,  name: 'EPS Spannung L1',  group: 'backup', unit: 'V',  role: 'value.voltage' },
    backup_i1:     { address: 35146, dataType: 'uint16', scale: 0.1,  name: 'EPS Strom L1',     group: 'backup', unit: 'A',  role: 'value.current' },
    backup_f1:     { address: 35147, dataType: 'uint16', scale: 0.01, name: 'EPS Frequenz L1',  group: 'backup', unit: 'Hz', role: 'value.frequency' },
    backup_p1:     { address: 35150, dataType: 'int16',               name: 'EPS Leistung L1',  group: 'backup', unit: 'W',  role: 'value.power' },
    backup_v2:     { address: 35151, dataType: 'uint16', scale: 0.1,  name: 'EPS Spannung L2',  group: 'backup', unit: 'V',  role: 'value.voltage' },
    backup_p2:     { address: 35156, dataType: 'int16',               name: 'EPS Leistung L2',  group: 'backup', unit: 'W',  role: 'value.power' },
    backup_v3:     { address: 35157, dataType: 'uint16', scale: 0.1,  name: 'EPS Spannung L3',  group: 'backup', unit: 'V',  role: 'value.voltage' },
    backup_p3:     { address: 35162, dataType: 'int16',               name: 'EPS Leistung L3',  group: 'backup', unit: 'W',  role: 'value.power' },
    backup_ptotal: { address: 35170, dataType: 'int16',               name: 'EPS Gesamt',        group: 'backup', unit: 'W',  role: 'value.power' },

    // Load
    load_p1:     { address: 35164, dataType: 'int16', name: 'Verbrauch L1',       group: 'load', unit: 'W', role: 'value.power' },
    load_p2:     { address: 35166, dataType: 'int16', name: 'Verbrauch L2',       group: 'load', unit: 'W', role: 'value.power' },
    load_p3:     { address: 35168, dataType: 'int16', name: 'Verbrauch L3',       group: 'load', unit: 'W', role: 'value.power' },
    load_ptotal: { address: 35172, dataType: 'int16', name: 'Hausverbrauch Ges.', group: 'load', unit: 'W', role: 'value.power' },
    ups_load:    { address: 35173, dataType: 'uint16', name: 'UPS Last',          group: 'load', unit: '%', role: 'value' },

    // Temperaturen & Status
    temperature_air:    { address: 35174, dataType: 'int16', scale: 0.1, name: 'Temp. Luft',       group: 'inverter', unit: '°C', role: 'value.temperature' },
    temperature_module: { address: 35175, dataType: 'int16', scale: 0.1, name: 'Temp. Modul',      group: 'inverter', unit: '°C', role: 'value.temperature' },
    temperature:        { address: 35176, dataType: 'int16', scale: 0.1, name: 'Temp. Kühlkörper', group: 'inverter', unit: '°C', role: 'value.temperature' },
    bus_voltage:        { address: 35178, dataType: 'uint16', scale: 0.1, name: 'Bus Spannung',    group: 'inverter', unit: 'V',  role: 'value.voltage' },

    // Batterie (Hauptblock)
    vbattery1:    { address: 35180, dataType: 'uint16', scale: 0.1, name: 'Batteriespannung',                  group: 'battery', unit: 'V', role: 'value.voltage' },
    ibattery1:    { address: 35181, dataType: 'int16',  scale: 0.1, name: 'Batteriestrom (+Laden/-Entladen)',  group: 'battery', unit: 'A', role: 'value.current' },
    pbattery1:    { address: 35182, words: 2, dataType: 'int32',    name: 'Batterieleistung (+Laden/-Entl.)', group: 'battery', unit: 'W', role: 'value.power' },
    battery_mode: {
        address: 35184, dataType: 'uint16', name: 'Batterie Modus', group: 'battery', role: 'value',
        states: { 0: 'Normal', 1: 'Standby', 2: 'Discharge', 3: 'Fault', 4: 'Flash', 5: 'Charge' },
        type: 'string',
    },
    warning_code:   { address: 35185, dataType: 'uint16', name: 'Warnungscode',     group: 'inverter', role: 'value', type: 'number' },
    safety_country: { address: 35186, dataType: 'uint16', name: 'Sicherheitsland',  group: 'inverter', role: 'value', type: 'number' },
    work_mode: {
        address: 35187, dataType: 'uint16', name: 'Betriebsmodus', group: 'inverter', role: 'value',
        states: { 0: 'Waiting', 1: 'Normal (On-Grid)', 2: 'Error', 3: 'Checking' }, type: 'string',
    },
    operation_mode: { address: 35188, dataType: 'uint16', name: 'Betriebsmodus Code', group: 'inverter', role: 'value', type: 'number' },
    work_mode_set: {
        address: 47000, dataType: 'uint16', name: 'Betriebsmodus (Einstellung)', group: 'settings', role: 'value', writable: true,
        states: { 0: 'General Mode', 1: 'Off Grid', 2: 'Backup Mode', 3: 'Eco Mode', 4: 'Peak Shaving', 5: 'Self Use' },
        type: 'string', min: 0, max: 5,
    },
    ems_mode: {
        address: 47511, dataType: 'uint16', name: 'EMS Modus (Einstellung)', group: 'settings', role: 'value', writable: true,
        states: {
            1: 'Auto (Self-use)', 2: 'Charge PV', 3: 'Discharge PV',
            4: 'Import AC', 5: 'Export AC', 6: 'Conserve',
            7: 'Off Grid', 8: 'Battery Standby', 9: 'Buy Power',
            10: 'Sell Power', 11: 'Charge Battery', 12: 'Discharge Battery',
        },
        type: 'string', min: 1, max: 12,
    },
    error_codes:     { address: 35189, words: 2, dataType: 'uint32', name: 'Fehlercodes',       group: 'inverter', role: 'value', type: 'number' },

    // Energie-Totals
    e_total:               { address: 35191, words: 2, dataType: 'uint32', scale: 0.1, name: 'Gesamt PV Ertrag',        group: 'meter', unit: 'kWh', role: 'value.power.consumption' },
    e_day:                 { address: 35193, words: 2, dataType: 'uint32', scale: 0.1, name: 'PV Ertrag heute',          group: 'meter', unit: 'kWh', role: 'value.power.consumption' },
    e_total_exp:           { address: 35195, words: 2, dataType: 'uint32', scale: 0.1, name: 'Gesamt Einspeisung',       group: 'meter', unit: 'kWh', role: 'value.power.consumption' },
    h_total:               { address: 35197, words: 2, dataType: 'uint32',             name: 'Betriebsstunden',          group: 'inverter', unit: 'h', role: 'value' },
    e_day_exp:             { address: 35199, dataType: 'uint16', scale: 0.1,           name: 'Einspeisung heute',        group: 'meter', unit: 'kWh', role: 'value.power.consumption' },
    e_total_imp:           { address: 35200, words: 2, dataType: 'uint32', scale: 0.1, name: 'Gesamt Netzbezug',         group: 'meter', unit: 'kWh', role: 'value.power.consumption' },
    e_day_imp:             { address: 35202, dataType: 'uint16', scale: 0.1,           name: 'Netzbezug heute',          group: 'meter', unit: 'kWh', role: 'value.power.consumption' },
    e_load_total:          { address: 35203, words: 2, dataType: 'uint32', scale: 0.1, name: 'Gesamtverbrauch',          group: 'meter', unit: 'kWh', role: 'value.power.consumption' },
    e_load_day:            { address: 35205, dataType: 'uint16', scale: 0.1,           name: 'Verbrauch heute',          group: 'meter', unit: 'kWh', role: 'value.power.consumption' },
    e_bat_charge_total:    { address: 35206, words: 2, dataType: 'uint32', scale: 0.1, name: 'Gesamt Batterieladung',    group: 'meter', unit: 'kWh', role: 'value.power.consumption' },
    e_bat_charge_day:      { address: 35208, dataType: 'uint16', scale: 0.1,           name: 'Batterieladung heute',     group: 'meter', unit: 'kWh', role: 'value.power.consumption' },
    e_bat_discharge_total: { address: 35209, words: 2, dataType: 'uint32', scale: 0.1, name: 'Gesamt Batterieentladung', group: 'meter', unit: 'kWh', role: 'value.power.consumption' },
    e_bat_discharge_day:   { address: 35211, dataType: 'uint16', scale: 0.1,           name: 'Batterieentladung heute',  group: 'meter', unit: 'kWh', role: 'value.power.consumption' },
    diagnose_result:       { address: 35220, words: 2, dataType: 'uint32',             name: 'Diagnose Code',            group: 'inverter', role: 'value', type: 'number' },

    // ── METER ab 36000 ────────────────────────────────────────────────────────
    meter_comm_status:      { address: 36004, dataType: 'uint16', name: 'Zähler Kommunikation',     group: 'meter', role: 'indicator', states: { 0: 'Fehler', 1: 'OK' }, type: 'string' },
    active_power1:          { address: 36005, dataType: 'int16',  name: 'Zähler Wirkleistung L1',   group: 'meter', unit: 'W',   role: 'value.power' },
    active_power2:          { address: 36006, dataType: 'int16',  name: 'Zähler Wirkleistung L2',   group: 'meter', unit: 'W',   role: 'value.power' },
    active_power3:          { address: 36007, dataType: 'int16',  name: 'Zähler Wirkleistung L3',   group: 'meter', unit: 'W',   role: 'value.power' },
    active_power_total:     { address: 36008, dataType: 'int16',  name: 'Zähler Wirkleistung Ges.', group: 'meter', unit: 'W',   role: 'value.power' },
    meter_power_factor:     { address: 36013, dataType: 'int16',  scale: 0.001, name: 'Leistungsfaktor', group: 'meter', unit: '', role: 'value' },
    meter_freq:             { address: 36014, dataType: 'uint16', scale: 0.01, name: 'Zähler Frequenz',  group: 'meter', unit: 'Hz', role: 'value.frequency' },
    meter_e_total_exp:      { address: 36015, words: 2, dataType: 'uint32', scale: 0.001, name: 'Zähler Einspeisung Ges.', group: 'meter', unit: 'kWh', role: 'value.power.consumption' },
    meter_e_total_imp:      { address: 36017, words: 2, dataType: 'uint32', scale: 0.001, name: 'Zähler Netzbezug Ges.',   group: 'meter', unit: 'kWh', role: 'value.power.consumption' },
    meter_active_power_total: { address: 36025, words: 2, dataType: 'int32', name: 'Zähler Wirkleistung Total (präzise)', group: 'meter', unit: 'W', role: 'value.power' },
    meter_voltage1:         { address: 36052, dataType: 'uint16', scale: 0.1, name: 'Zähler Spannung L1', group: 'meter', unit: 'V', role: 'value.voltage' },
    meter_voltage2:         { address: 36053, dataType: 'uint16', scale: 0.1, name: 'Zähler Spannung L2', group: 'meter', unit: 'V', role: 'value.voltage' },
    meter_voltage3:         { address: 36054, dataType: 'uint16', scale: 0.1, name: 'Zähler Spannung L3', group: 'meter', unit: 'V', role: 'value.voltage' },
    meter_current1:         { address: 36055, dataType: 'uint16', scale: 0.1, name: 'Zähler Strom L1',    group: 'meter', unit: 'A', role: 'value.current' },
    meter_current2:         { address: 36056, dataType: 'uint16', scale: 0.1, name: 'Zähler Strom L2',    group: 'meter', unit: 'A', role: 'value.current' },
    meter_current3:         { address: 36057, dataType: 'uint16', scale: 0.1, name: 'Zähler Strom L3',    group: 'meter', unit: 'A', role: 'value.current' },

    // ── BMS ab 37000 ─────────────────────────────────────────────────────────
    battery_bms:              { address: 37000, dataType: 'uint16', name: 'BMS Typ',                      group: 'bms', role: 'value', type: 'number' },
    battery_index:            { address: 37001, dataType: 'uint16', name: 'Batterie Index',               group: 'bms', role: 'value', type: 'number' },
    battery_status:           { address: 37002, dataType: 'uint16', name: 'Batterie Status',              group: 'bms', role: 'value', type: 'number' },
    battery_temperature:      { address: 37003, dataType: 'int16',  scale: 0.1, name: 'Batterietemperatur', group: 'bms', unit: '°C', role: 'value.temperature' },
    battery_charge_limit:     { address: 37004, dataType: 'uint16', name: 'Ladelimit',                    group: 'bms', unit: 'A',   role: 'value' },
    battery_discharge_limit:  { address: 37005, dataType: 'uint16', name: 'Entladelimit',                 group: 'bms', unit: 'A',   role: 'value' },
    battery_error_l:          { address: 37006, dataType: 'uint16', name: 'Batterie Fehler (Low)',         group: 'bms', role: 'value', type: 'number' },
    battery_soc:              { address: 37007, dataType: 'uint16', name: 'SOC (Ladezustand)',             group: 'bms', unit: '%',   role: 'value.battery' },
    battery_soh:              { address: 37008, dataType: 'uint16', name: 'SOH (Gesundheit)',              group: 'bms', unit: '%',   role: 'value' },
    battery_modules:          { address: 37009, dataType: 'uint16', name: 'Anzahl Module',                group: 'bms', role: 'value', type: 'number' },
    battery_warning_l:        { address: 37010, dataType: 'uint16', name: 'Batterie Warnung (Low)',        group: 'bms', role: 'value', type: 'number' },
    battery_protocol:         { address: 37011, dataType: 'uint16', name: 'Batterie Protokoll',           group: 'bms', role: 'value', type: 'number' },
    battery_sw_version:       { address: 37014, dataType: 'uint16', name: 'BMS SW Version',               group: 'bms', role: 'text',  type: 'number' },
    battery_hw_version:       { address: 37015, dataType: 'uint16', name: 'BMS HW Version',               group: 'bms', role: 'text',  type: 'number' },
    battery_max_cell_temp:    { address: 37020, dataType: 'int16',  scale: 0.1, name: 'Max Zellentemperatur', group: 'bms', unit: '°C', role: 'value.temperature' },
    battery_min_cell_temp:    { address: 37021, dataType: 'int16',  scale: 0.1, name: 'Min Zellentemperatur', group: 'bms', unit: '°C', role: 'value.temperature' },
    battery_max_cell_voltage: { address: 37022, dataType: 'uint16', scale: 0.001, name: 'Max Zellenspannung', group: 'bms', unit: 'V', role: 'value.voltage' },
    battery_min_cell_voltage: { address: 37023, dataType: 'uint16', scale: 0.001, name: 'Min Zellenspannung', group: 'bms', unit: 'V', role: 'value.voltage' },
};

for (const [key, reg] of Object.entries(REGISTERS)) {
    reg.key = key;
}

module.exports = { REGISTERS, REGISTER_GROUPS };
