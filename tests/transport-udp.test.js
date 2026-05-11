'use strict';

const { expect } = require('chai');
const {
    crc16Modbus,
    buildReadHoldingRequest,
    buildWriteSingleRequest,
    buildWriteMultipleRequest,
    parseResponse,
} = require('../lib/transport-udp');

describe('Modbus CRC16', () => {
    it('matches the canonical Modbus RTU vector', () => {
        // Standard Modbus test vector: 01 03 00 00 00 0A -> CRC 0xCDC5 (LE: C5 CD)
        const frame = Buffer.from([0x01, 0x03, 0x00, 0x00, 0x00, 0x0A]);
        expect(crc16Modbus(frame)).to.equal(0xCDC5);
    });

    it('produces 0xFFFF over empty input (initial state)', () => {
        expect(crc16Modbus(Buffer.alloc(0))).to.equal(0xFFFF);
    });

    it('is sensitive to byte order', () => {
        const a = Buffer.from([0xF7, 0x03, 0x89, 0x1C, 0x00, 0x7D]);
        const b = Buffer.from([0x03, 0xF7, 0x89, 0x1C, 0x00, 0x7D]);
        expect(crc16Modbus(a)).to.not.equal(crc16Modbus(b));
    });
});

describe('Request builders', () => {
    it('readHoldingRegisters: 8-byte frame with valid CRC', () => {
        const req = buildReadHoldingRequest(0xF7, 35100, 125);
        expect(req.length).to.equal(8);
        expect(req[0]).to.equal(0xF7);          // unit
        expect(req[1]).to.equal(0x03);          // fc
        expect(req.readUInt16BE(2)).to.equal(35100);
        expect(req.readUInt16BE(4)).to.equal(125);
        // CRC matches what we'd compute over the first 6 bytes
        const crc = crc16Modbus(req, 0, 6);
        expect(req[6]).to.equal(crc & 0xFF);
        expect(req[7]).to.equal((crc >>> 8) & 0xFF);
    });

    it('writeSingleRegister: 8-byte frame with valid CRC', () => {
        const req = buildWriteSingleRequest(0xF7, 47000, 1);
        expect(req.length).to.equal(8);
        expect(req[0]).to.equal(0xF7);
        expect(req[1]).to.equal(0x06);
        expect(req.readUInt16BE(2)).to.equal(47000);
        expect(req.readUInt16BE(4)).to.equal(1);
        const crc = crc16Modbus(req, 0, 6);
        expect(req[6]).to.equal(crc & 0xFF);
        expect(req[7]).to.equal((crc >>> 8) & 0xFF);
    });

    it('writeMultipleRegisters: correct length, byte count, and CRC', () => {
        const req = buildWriteMultipleRequest(0xF7, 47511, [0x0001, 0x0002]);
        // 7 header bytes + 4 payload + 2 CRC = 13
        expect(req.length).to.equal(13);
        expect(req[0]).to.equal(0xF7);
        expect(req[1]).to.equal(0x10);
        expect(req.readUInt16BE(2)).to.equal(47511);
        expect(req.readUInt16BE(4)).to.equal(2); // register count
        expect(req[6]).to.equal(4);              // byte count
        expect(req.readUInt16BE(7)).to.equal(0x0001);
        expect(req.readUInt16BE(9)).to.equal(0x0002);
        const crc = crc16Modbus(req, 0, 11);
        expect(req[11]).to.equal(crc & 0xFF);
        expect(req[12]).to.equal((crc >>> 8) & 0xFF);
    });
});

// Helper: build a valid response frame with the 2-byte gateway prefix
// and a correctly computed CRC over the inverter portion.
function buildReadResponse(unitId, words, prefix = [0xAA, 0x55]) {
    const byteCount = words.length * 2;
    const inv = Buffer.alloc(3 + byteCount);
    inv[0] = unitId;
    inv[1] = 0x03;
    inv[2] = byteCount;
    for (let i = 0; i < words.length; i++) {
        inv.writeUInt16BE(words[i], 3 + i * 2);
    }
    const crc = crc16Modbus(inv);
    return Buffer.concat([
        Buffer.from(prefix),
        inv,
        Buffer.from([crc & 0xFF, (crc >>> 8) & 0xFF]),
    ]);
}

function buildWriteResponse(unitId, address, value, prefix = [0xAA, 0x55]) {
    const inv = Buffer.alloc(6);
    inv[0] = unitId;
    inv[1] = 0x06;
    inv.writeUInt16BE(address, 2);
    inv.writeUInt16BE(value, 4);
    const crc = crc16Modbus(inv);
    return Buffer.concat([
        Buffer.from(prefix),
        inv,
        Buffer.from([crc & 0xFF, (crc >>> 8) & 0xFF]),
    ]);
}

function buildExceptionResponse(unitId, fc, code, prefix = [0xAA, 0x55]) {
    const inv = Buffer.from([unitId, fc | 0x80, code]);
    const crc = crc16Modbus(inv);
    return Buffer.concat([
        Buffer.from(prefix),
        inv,
        Buffer.from([crc & 0xFF, (crc >>> 8) & 0xFF]),
    ]);
}

describe('parseResponse', () => {
    it('decodes a read response and returns uint16 words', () => {
        const frame = buildReadResponse(0xF7, [0x1234, 0x5678, 0xABCD]);
        const out = parseResponse(frame, { unitId: 0xF7, fc: 0x03, count: 3 });
        expect(out.data).to.deep.equal([0x1234, 0x5678, 0xABCD]);
    });

    it('strips the 2-byte gateway prefix regardless of its content', () => {
        const a = buildReadResponse(0xF7, [0x0042], [0x00, 0x00]);
        const b = buildReadResponse(0xF7, [0x0042], [0xFF, 0xFF]);
        expect(parseResponse(a, { unitId: 0xF7, fc: 0x03, count: 1 }).data).to.deep.equal([0x0042]);
        expect(parseResponse(b, { unitId: 0xF7, fc: 0x03, count: 1 }).data).to.deep.equal([0x0042]);
    });

    it('rejects a tampered CRC', () => {
        const frame = buildReadResponse(0xF7, [0x1234]);
        frame[frame.length - 1] ^= 0xFF;
        expect(() => parseResponse(frame, { unitId: 0xF7, fc: 0x03, count: 1 }))
            .to.throw(/CRC mismatch/);
    });

    it('rejects unit ID mismatch', () => {
        const frame = buildReadResponse(0xF7, [0x0001]);
        expect(() => parseResponse(frame, { unitId: 0x01, fc: 0x03, count: 1 }))
            .to.throw(/Unit ID mismatch/);
    });

    it('rejects byte count mismatch', () => {
        const frame = buildReadResponse(0xF7, [0x0001, 0x0002]);
        // ask for 3 words but response only has 2
        expect(() => parseResponse(frame, { unitId: 0xF7, fc: 0x03, count: 3 }))
            .to.throw(/Byte count mismatch/);
    });

    it('surfaces Modbus exception responses with code and name', () => {
        const frame = buildExceptionResponse(0xF7, 0x03, 0x02);
        try {
            parseResponse(frame, { unitId: 0xF7, fc: 0x03, count: 1 });
            throw new Error('should have thrown');
        } catch (err) {
            expect(err.modbusErrorCode).to.equal(0x02);
            expect(err.message).to.match(/ILLEGAL DATA ADDRESS/);
        }
    });

    it('decodes write-single-register response with echoed address+value', () => {
        const frame = buildWriteResponse(0xF7, 47000, 1);
        const out = parseResponse(frame, { unitId: 0xF7, fc: 0x06, address: 47000 });
        expect(out.address).to.equal(47000);
        expect(out.value).to.equal(1);
    });

    it('rejects a write response with mismatched echoed address', () => {
        const frame = buildWriteResponse(0xF7, 47000, 1);
        expect(() => parseResponse(frame, { unitId: 0xF7, fc: 0x06, address: 47001 }))
            .to.throw(/address mismatch/);
    });
});
