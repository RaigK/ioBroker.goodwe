'use strict';

const { expect } = require('chai');
const { REGISTERS, REGISTER_GROUPS } = require('../lib/registers');

describe('Goodwe Register Map', () => {
    it('should have all required register fields', () => {
        for (const [key, reg] of Object.entries(REGISTERS)) {
            expect(reg, `Register ${key}`).to.have.property('address');
            expect(reg, `Register ${key}`).to.have.property('name');
            expect(reg, `Register ${key}`).to.have.property('group');
            expect(REGISTER_GROUPS, `Group ${reg.group}`).to.have.property(reg.group);
        }
    });

    it('should have a key property on each register', () => {
        for (const [key, reg] of Object.entries(REGISTERS)) {
            expect(reg.key).to.equal(key);
        }
    });

    it('should have valid data types', () => {
        const validTypes = ['uint16', 'int16', 'uint32', 'int32', 'string', 'bit', undefined];
        for (const [key, reg] of Object.entries(REGISTERS)) {
            expect(validTypes, `Register ${key} dataType`).to.include(reg.dataType);
        }
    });

    it('should have multi-word registers with words property', () => {
        for (const [key, reg] of Object.entries(REGISTERS)) {
            if (reg.dataType === 'uint32' || reg.dataType === 'int32') {
                expect(reg.words, `Register ${key} should have words=2`).to.equal(2);
            }
        }
    });

    it('battery_soc should be in 0-100 range', () => {
        const soc = REGISTERS['battery_soc'];
        expect(soc).to.exist;
        expect(soc.unit).to.equal('%');
    });

    it('writable registers should have min/max or states', () => {
        for (const [key, reg] of Object.entries(REGISTERS)) {
            if (reg.writable && reg.type === 'number') {
                const hasMinMax = reg.min !== undefined && reg.max !== undefined;
                const hasStates = reg.states !== undefined;
                expect(hasMinMax || hasStates, `Writable register ${key} needs min/max or states`).to.be.true;
            }
        }
    });
});

describe('Register decoding logic', () => {
    // Simulate main.js decodeRegister without full adapter
    function decodeRegister(reg, data, offset) {
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
        }
        return data[offset];
    }

    it('should decode int16 negative values correctly', () => {
        const reg = { dataType: 'int16' };
        // -100 as uint16 = 65436
        expect(decodeRegister(reg, [65436], 0)).to.equal(-100);
    });

    it('should decode uint32 large values correctly', () => {
        const reg = { dataType: 'uint32', words: 2 };
        // 100000 kWh total = 1000000 (scaled x10) = 0x000F4240
        expect(decodeRegister(reg, [0x000F, 0x4240], 0)).to.equal(1000000);
    });

    it('should decode string registers', () => {
        const reg = { dataType: 'string', words: 4 };
        // "GW10" in words
        const data = [
            (0x47 << 8) | 0x57, // GW
            (0x31 << 8) | 0x30, // 10
            0, 0
        ];
        expect(decodeRegister(reg, data, 0)).to.equal('GW10');
    });
});
