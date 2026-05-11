'use strict';

const dgram = require('dgram');

const FC_READ_HOLDING = 0x03;
const FC_WRITE_SINGLE = 0x06;
const FC_WRITE_MULTIPLE = 0x10;

const MODBUS_EXCEPTIONS = {
    1: 'ILLEGAL FUNCTION',
    2: 'ILLEGAL DATA ADDRESS',
    3: 'ILLEGAL DATA VALUE',
    4: 'SLAVE DEVICE FAILURE',
    5: 'ACKNOWLEDGE',
    6: 'SLAVE DEVICE BUSY',
    7: 'NEGATIVE ACKNOWLEDGEMENT',
    8: 'MEMORY PARITY ERROR',
    10: 'GATEWAY PATH UNAVAILABLE',
    11: 'GATEWAY TARGET DEVICE FAILED TO RESPOND',
};

const CRC_TABLE = (() => {
    const table = new Uint16Array(256);
    for (let i = 0; i < 256; i++) {
        let crc = 0;
        let buf = i << 1;
        for (let j = 8; j > 0; j--) {
            buf >>= 1;
            if ((buf ^ crc) & 0x0001) {
                crc = (crc >>> 1) ^ 0xA001;
            } else {
                crc >>>= 1;
            }
        }
        table[i] = crc;
    }
    return table;
})();

function crc16Modbus(bytes, start = 0, end = bytes.length) {
    let crc = 0xFFFF;
    for (let i = start; i < end; i++) {
        crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]) & 0xFF];
    }
    return crc & 0xFFFF;
}

function buildReadHoldingRequest(unitId, address, count) {
    const buf = Buffer.alloc(8);
    buf[0] = unitId & 0xFF;
    buf[1] = FC_READ_HOLDING;
    buf.writeUInt16BE(address, 2);
    buf.writeUInt16BE(count, 4);
    const crc = crc16Modbus(buf, 0, 6);
    buf[6] = crc & 0xFF;
    buf[7] = (crc >>> 8) & 0xFF;
    return buf;
}

function buildWriteSingleRequest(unitId, address, value) {
    const buf = Buffer.alloc(8);
    buf[0] = unitId & 0xFF;
    buf[1] = FC_WRITE_SINGLE;
    buf.writeUInt16BE(address, 2);
    buf.writeUInt16BE(value & 0xFFFF, 4);
    const crc = crc16Modbus(buf, 0, 6);
    buf[6] = crc & 0xFF;
    buf[7] = (crc >>> 8) & 0xFF;
    return buf;
}

function buildWriteMultipleRequest(unitId, address, values) {
    const byteCount = values.length * 2;
    const buf = Buffer.alloc(9 + byteCount);
    buf[0] = unitId & 0xFF;
    buf[1] = FC_WRITE_MULTIPLE;
    buf.writeUInt16BE(address, 2);
    buf.writeUInt16BE(values.length, 4);
    buf[6] = byteCount;
    for (let i = 0; i < values.length; i++) {
        buf.writeUInt16BE(values[i] & 0xFFFF, 7 + i * 2);
    }
    const crcEnd = 7 + byteCount;
    const crc = crc16Modbus(buf, 0, crcEnd);
    buf[crcEnd] = crc & 0xFF;
    buf[crcEnd + 1] = (crc >>> 8) & 0xFF;
    return buf;
}

/**
 * Parse a response frame from the Wi-Fi-Kit UDP gateway.
 *
 * Layout (Goodwe Wi-Fi-Kit asymmetry: gateway prepends 2 bytes to inverter response):
 *   [0..1]   gateway prefix (ignored)
 *   [2]      echoed unit address
 *   [3]      function code (high bit set on exception)
 *   [4..]    payload
 *   [-2..-1] CRC16 LE, covering bytes [2..-2]
 */
function parseResponse(data, expected) {
    if (!Buffer.isBuffer(data)) data = Buffer.from(data);
    if (data.length < 7) {
        throw new Error(`Response too short: ${data.length} bytes`);
    }

    const unit = data[2];
    const fc = data[3];

    if (unit !== expected.unitId) {
        throw new Error(`Unit ID mismatch: got ${unit}, expected ${expected.unitId}`);
    }

    if (fc & 0x80) {
        // Exception response: [hdr][hdr][unit][fc|0x80][exception_code][crc_lo][crc_hi]
        if (data.length < 7) throw new Error('Exception response too short');
        const code = data[4];
        const crcEnd = 5;
        verifyCrc(data, crcEnd);
        const name = MODBUS_EXCEPTIONS[code] || `UNKNOWN(${code})`;
        const err = new Error(`Modbus exception: ${name}`);
        err.modbusErrorCode = code;
        throw err;
    }

    if (fc !== expected.fc) {
        throw new Error(`Function code mismatch: got 0x${fc.toString(16)}, expected 0x${expected.fc.toString(16)}`);
    }

    if (fc === FC_READ_HOLDING) {
        const byteCount = data[4];
        const expectedBytes = expected.count * 2;
        if (byteCount !== expectedBytes) {
            throw new Error(`Byte count mismatch: got ${byteCount}, expected ${expectedBytes}`);
        }
        const total = 2 /*prefix*/ + 1 /*unit*/ + 1 /*fc*/ + 1 /*bc*/ + byteCount + 2 /*crc*/;
        if (data.length < total) {
            throw new Error(`Read response truncated: ${data.length}/${total} bytes`);
        }
        verifyCrc(data, total - 2);
        const words = [];
        for (let i = 0; i < expected.count; i++) {
            words.push(data.readUInt16BE(5 + i * 2));
        }
        return { data: words };
    }

    if (fc === FC_WRITE_SINGLE || fc === FC_WRITE_MULTIPLE) {
        if (data.length < 10) throw new Error(`Write response truncated: ${data.length} bytes`);
        const echoedAddr = data.readUInt16BE(4);
        const echoedVal = data.readUInt16BE(6);
        if (echoedAddr !== expected.address) {
            throw new Error(`Write response address mismatch: ${echoedAddr} vs ${expected.address}`);
        }
        verifyCrc(data, 8);
        return { address: echoedAddr, value: echoedVal };
    }

    throw new Error(`Unsupported function code in response: 0x${fc.toString(16)}`);
}

function verifyCrc(data, crcOffset) {
    const computed = crc16Modbus(data, 2, crcOffset);
    const received = data[crcOffset] | (data[crcOffset + 1] << 8);
    if (computed !== received) {
        throw new Error(`CRC mismatch: computed 0x${computed.toString(16)}, received 0x${received.toString(16)}`);
    }
}

class GoodweUdpClient {
    constructor() {
        this.socket = null;
        this.host = null;
        this.port = 8899;
        this.unitId = 247;
        this.timeoutMs = 10000;
        this.retries = 2;
        this._inflight = Promise.resolve();
        this._pendingResolve = null;
        this._pendingReject = null;
        this._pendingTimer = null;
    }

    async connectUDP(host, options = {}) {
        this.host = host;
        this.port = options.port || 8899;
        this.socket = dgram.createSocket('udp4');
        this.socket.on('message', (msg) => this._onMessage(msg));
        this.socket.on('error', (err) => this._onError(err));
        await new Promise((resolve, reject) => {
            this.socket.bind(0, (err) => err ? reject(err) : resolve());
        });
    }

    setID(unitId) { this.unitId = unitId & 0xFF; }
    setTimeout(ms) { this.timeoutMs = ms; }

    async readHoldingRegisters(address, count) {
        const frame = buildReadHoldingRequest(this.unitId, address, count);
        const reply = await this._exchange(frame);
        return parseResponse(reply, { unitId: this.unitId, fc: FC_READ_HOLDING, count });
    }

    async writeRegister(address, value) {
        const frame = buildWriteSingleRequest(this.unitId, address, value);
        const reply = await this._exchange(frame);
        return parseResponse(reply, { unitId: this.unitId, fc: FC_WRITE_SINGLE, address });
    }

    async writeRegisters(address, values) {
        const frame = buildWriteMultipleRequest(this.unitId, address, values);
        const reply = await this._exchange(frame);
        return parseResponse(reply, { unitId: this.unitId, fc: FC_WRITE_MULTIPLE, address });
    }

    _exchange(frame) {
        const run = async () => {
            let lastErr = null;
            for (let attempt = 0; attempt <= this.retries; attempt++) {
                try {
                    return await this._sendOnce(frame);
                } catch (err) {
                    lastErr = err;
                    if (err.modbusErrorCode !== undefined) throw err;
                }
            }
            throw lastErr || new Error('UDP exchange failed');
        };
        const prev = this._inflight;
        const current = prev.catch(() => {}).then(run);
        this._inflight = current.catch(() => {});
        return current;
    }

    _sendOnce(frame) {
        return new Promise((resolve, reject) => {
            if (!this.socket) return reject(new Error('Socket not open'));
            this._pendingResolve = resolve;
            this._pendingReject = reject;
            this._pendingTimer = setTimeout(() => {
                this._pendingResolve = null;
                this._pendingReject = null;
                this._pendingTimer = null;
                reject(new Error(`UDP request timeout after ${this.timeoutMs}ms`));
            }, this.timeoutMs);
            this.socket.send(frame, this.port, this.host, (err) => {
                if (err) {
                    this._clearPending();
                    reject(err);
                }
            });
        });
    }

    _clearPending() {
        if (this._pendingTimer) {
            clearTimeout(this._pendingTimer);
            this._pendingTimer = null;
        }
        this._pendingResolve = null;
        this._pendingReject = null;
    }

    _onMessage(msg) {
        if (this._pendingResolve) {
            const resolve = this._pendingResolve;
            this._clearPending();
            resolve(msg);
        }
    }

    _onError(err) {
        if (this._pendingReject) {
            const reject = this._pendingReject;
            this._clearPending();
            reject(err);
        }
    }

    close(cb) {
        if (this.socket) {
            try { this.socket.close(cb); } catch (e) { /* ignore */ }
            this.socket = null;
        } else if (cb) {
            cb();
        }
    }
}

module.exports = {
    GoodweUdpClient,
    crc16Modbus,
    buildReadHoldingRequest,
    buildWriteSingleRequest,
    buildWriteMultipleRequest,
    parseResponse,
};
