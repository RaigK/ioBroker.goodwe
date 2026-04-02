'use strict';

const utils = require('@iobroker/adapter-core');
const ModbusRTU = require('modbus-serial');
const { REGISTERS, REGISTER_GROUPS } = require('./lib/registers');

class GoodweAdapter extends utils.Adapter {
    constructor(options) {
        super({ ...options, name: 'goodwe' });

        this.modbusClient = null;
        this.pollingTimer = null;
        this.reconnectTimer = null;
        this.isConnected = false;
        this.isPolling = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;

        this.on('ready', this.onReady.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }

    async onReady() {
        this.log.info('Goodwe adapter starting...');
        this.setState('info.connection', false, true);

        await this.createObjects();
        await this.connect();
    }

    async createObjects() {
        // Connection info
        await this.setObjectNotExistsAsync('info.connection', {
            type: 'state',
            common: { name: 'Connection status', type: 'boolean', role: 'indicator.connected', read: true, write: false },
            native: {},
        });
        await this.setObjectNotExistsAsync('info.lastUpdate', {
            type: 'state',
            common: { name: 'Last successful update', type: 'string', role: 'date', read: true, write: false },
            native: {},
        });
        await this.setObjectNotExistsAsync('info.firmwareVersion', {
            type: 'state',
            common: { name: 'Firmware Version', type: 'string', role: 'text', read: true, write: false },
            native: {},
        });

        // Create all register objects
        for (const [key, reg] of Object.entries(REGISTERS)) {
            const channelId = reg.group;
            await this.setObjectNotExistsAsync(channelId, {
                type: 'channel',
                common: { name: REGISTER_GROUPS[reg.group] || reg.group },
                native: {},
            });

            const objectId = `${channelId}.${key}`;
            await this.setObjectNotExistsAsync(objectId, {
                type: 'state',
                common: {
                    name: reg.name,
                    type: reg.type || 'number',
                    role: reg.role || 'value',
                    unit: reg.unit || '',
                    read: true,
                    write: reg.writable || false,
                    min: reg.min,
                    max: reg.max,
                    states: reg.states,
                },
                native: { register: reg.address, scale: reg.scale },
            });
        }

        this.log.info('Objects created successfully');
    }

    async connect() {
        if (this.modbusClient) {
            try { this.modbusClient.close(); } catch (e) { /* ignore */ }
        }

        this.modbusClient = new ModbusRTU();
        const host = this.config.host || '192.168.1.1';
        const port = this.config.port || 502;
        const unitId = this.config.unitId || 247;
        const timeout = (this.config.timeout || 10) * 1000;

        this.log.info(`Connecting to Goodwe inverter at ${host}:${port} (Unit ID: ${unitId})`);

        try {
            await this.modbusClient.connectTCP(host, { port });
            this.modbusClient.setID(unitId);
            this.modbusClient.setTimeout(timeout);

            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.setState('info.connection', true, true);
            this.log.info('Connected to Goodwe inverter successfully');

            this.startPolling();
        } catch (err) {
            this.log.error(`Connection failed: ${err.message}`);
            this.isConnected = false;
            this.setState('info.connection', false, true);
            this.scheduleReconnect();
        }
    }

    startPolling() {
        if (this.pollingTimer) clearInterval(this.pollingTimer);
        const interval = (this.config.pollInterval || 30) * 1000;
        this.log.info(`Starting polling every ${this.config.pollInterval || 30} seconds`);
        this.poll();
        this.pollingTimer = setInterval(() => this.poll(), interval);
    }

    async poll() {
        if (this.isPolling || !this.isConnected) return;
        this.isPolling = true;

        try {
            await this.readAllRegisters();
            this.setState('info.lastUpdate', new Date().toISOString(), true);
        } catch (err) {
            this.log.error(`Polling error: ${err.message}`);
            this.isConnected = false;
            this.setState('info.connection', false, true);
            if (this.pollingTimer) { clearInterval(this.pollingTimer); this.pollingTimer = null; }
            this.scheduleReconnect();
        } finally {
            this.isPolling = false;
        }
    }

    async readAllRegisters() {
        // Lese die drei festen Blöcke exakt wie der HA-Adapter (et.py)
        // Block 1: 35100–35224 (125 Register) – Haupt-Sensoren
        // Block 2: 36000–36060 (60 Register)  – Meter
        // Block 3: 37000–37024 (25 Register)  – BMS
        const blocks = [
            { start: 35100, count: 125, label: 'Haupt-Sensoren' },
            { start: 36000, count: 60,  label: 'Meter' },
            { start: 37000, count: 25,  label: 'BMS' },
        ];

        for (const block of blocks) {
            const regsInBlock = Object.values(REGISTERS)
                .filter(r => r.address >= block.start && r.address < block.start + block.count);
            if (regsInBlock.length === 0) continue;

            try {
                this.log.debug(`Lese ${block.label} ab ${block.start} (${block.count} Register)`);
                const result = await this.modbusClient.readHoldingRegisters(block.start, block.count);
                await this.processRegisters(regsInBlock, result.data, block.start);
            } catch (err) {
                this.log.warn(`Fehler beim Lesen ${block.label} (${block.start}): ${err.message}`);
            }
            await this.sleep(300);
        }
    }

    async processRegisters(registers, data, startAddress) {
        for (const reg of registers) {
            try {
                const offset = reg.address - startAddress;
                if (offset < 0 || offset >= data.length) continue;

                let value = this.decodeRegister(reg, data, offset);
                if (value === null || value === undefined) continue;

                // Apply scale
                if (reg.scale && reg.scale !== 1 && typeof value === 'number') {
                    value = Math.round(value * reg.scale * 1000) / 1000;
                }

                // Map states
                if (reg.states && typeof value === 'number') {
                    const mappedValue = reg.states[value];
                    if (mappedValue !== undefined) {
                        value = mappedValue;
                    }
                }

                const objectId = `${reg.group}.${reg.key}`;
                await this.setStateAsync(objectId, { val: value, ack: true });
            } catch (err) {
                this.log.debug(`Error processing register ${reg.key}: ${err.message}`);
            }
        }
    }

    decodeRegister(reg, data, offset) {
        const words = reg.words || 1;

        if (reg.dataType === 'int32') {
            const high = data[offset];
            const low = data[offset + 1] || 0;
            let value = (high << 16) | low;
            if (value & 0x80000000) value -= 0x100000000;
            return value;
        } else if (reg.dataType === 'uint32') {
            const high = data[offset];
            const low = data[offset + 1] || 0;
            return ((high << 16) | low) >>> 0;
        } else if (reg.dataType === 'int16') {
            const raw = data[offset];
            return raw > 0x7FFF ? raw - 0x10000 : raw;
        } else if (reg.dataType === 'uint16') {
            return data[offset];
        } else if (reg.dataType === 'string') {
            const chars = [];
            for (let i = 0; i < words; i++) {
                const word = data[offset + i] || 0;
                const hi = (word >> 8) & 0xFF;
                const lo = word & 0xFF;
                if (hi) chars.push(String.fromCharCode(hi));
                if (lo) chars.push(String.fromCharCode(lo));
            }
            return chars.join('').replace(/\0/g, '').trim();
        } else if (reg.dataType === 'bit') {
            const raw = data[offset];
            return !!(raw & (1 << (reg.bit || 0)));
        } else {
            // Default: uint16
            return data[offset];
        }
    }

    scheduleReconnect() {
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.log.error('Max reconnect attempts reached. Stopping reconnection.');
            return;
        }

        const delay = Math.min(30000, 5000 * (this.reconnectAttempts + 1));
        this.reconnectAttempts++;
        this.log.info(`Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
        }, delay);
    }

    async onStateChange(id, state) {
        if (!state || state.ack) return;

        const shortId = id.replace(`${this.namespace}.`, '');
        const obj = await this.getObjectAsync(shortId);
        if (!obj || !obj.native || !obj.native.register) return;

        const regAddress = obj.native.register;
        const scale = obj.native.scale || 1;
        let value = state.val;

        if (typeof value === 'number' && scale && scale !== 1) {
            value = Math.round(value / scale);
        }

        try {
            await this.modbusClient.writeRegister(regAddress, value);
            this.log.info(`Written ${value} to register ${regAddress} (${shortId})`);
            await this.setStateAsync(shortId, { val: state.val, ack: true });
        } catch (err) {
            this.log.error(`Write failed for ${shortId}: ${err.message}`);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async onUnload(callback) {
        try {
            if (this.pollingTimer) clearInterval(this.pollingTimer);
            if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
            if (this.modbusClient) {
                try { this.modbusClient.close(); } catch (e) { /* ignore */ }
            }
            this.setState('info.connection', false, true);
        } catch (e) {
            this.log.error(`Error on unload: ${e.message}`);
        }
        callback();
    }
}

if (require.main !== module) {
    module.exports = (options) => new GoodweAdapter(options);
} else {
    new GoodweAdapter();
}
