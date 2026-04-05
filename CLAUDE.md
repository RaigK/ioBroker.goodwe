# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm test        # Run mocha tests (10s timeout) in tests/
npm run lint    # Run ESLint on the project
```

To run a single test file:
```bash
npx mocha tests/register.test.js --timeout 10000
```

## Architecture

This is an **ioBroker adapter** for Goodwe solar inverters (ET/EH/BT series) that communicates via **Modbus TCP**. It runs as a daemon process, polling the inverter at a configurable interval and exposing all values as ioBroker state objects.

### Key files

- `main.js` — Core adapter class (extends `utils.Adapter`). Handles Modbus connection lifecycle, polling loop, register decoding, state management, and reconnect logic.
- `lib/registers.js` — The complete Modbus register map: ~170 registers across 3 blocks (35100–35224, 36000–36060, 37000–37024). Each entry defines address, data type, unit, scale factor, and optional state mappings for writable registers.

### Adapter lifecycle

1. `onReady()` → create ioBroker objects from register map → connect to inverter
2. Connection established → start polling loop
3. Each poll → read 3 register blocks (300ms delay between each) → decode all registers → update states
4. User writes to a writable state → convert value → write to Modbus register
5. Connection lost → exponential backoff reconnect (max 10 attempts)
6. `onUnload()` → clear timers, close Modbus connection

### Register decoding

Supported data types in `lib/registers.js`: `int16`, `uint16`, `int32`, `uint32`, `string`, `bit`. Scale factors (e.g. `0.1` for voltage in 0.1V units) are applied after decoding. State mappings (e.g. `{0: 'Normal', 1: 'Standby'}`) are used for mode/status registers and writable settings.

### ioBroker state object structure

States are grouped under `goodwe.<instance>.<group>.<name>`:
- `inverter` — system temps, firmware, serial, status/mode codes
- `pv` — per-string voltage/current/power (4 strings)
- `grid` — per-phase voltage/current/frequency, active/reactive/apparent power
- `battery` — voltage, current, power, SOC%, SOH%, temperature
- `backup` / `load` — EPS and household consumption
- `meter` — energy counters (import/export, charge/discharge)
- `bms` — battery management system data

### Configuration (user-facing)

Defined in `admin/jsonConfig.json` and `io-package.json`:
- `host` — inverter IP (default `192.168.1.1`)
- `port` — Modbus TCP port (default `502`)
- `unitId` — Modbus unit ID (default `247` for Goodwe ET)
- `pollInterval` — seconds between polls (default `30`)
- `timeout` — Modbus request timeout in seconds (default `10`)
