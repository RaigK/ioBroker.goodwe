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

Node `>=18` is required (pinned in `package.json` `engines`). Test/lint failures on older Node are not bugs in the adapter.

## Architecture

This is an **ioBroker adapter** for Goodwe solar inverters (ET/EH/BT series) that communicates via **Modbus TCP**. It runs as a daemon process, polling the inverter at a configurable interval and exposing all values as ioBroker state objects.

### Key files

- `main.js` — Core adapter class (extends `utils.Adapter`). Handles transport lifecycle, polling loop, register decoding, state management, and reconnect logic.
- `lib/registers.js` — The complete Modbus register map: ~170 registers across 5 blocks (35100–35224, 36000–36059, 37000–37024, 47000, 47511–47512). Each entry defines address, data type, unit, scale factor, and optional state mappings for writable registers.
- `lib/transport-udp.js` — UDP-8899 transport for the old Goodwe Wi-Fi-Kit dongles. Raw Modbus RTU frames over UDP (no AA55 envelope). Exposes the same surface as `modbus-serial`'s `ModbusRTU` (`connectUDP`, `setID`, `setTimeout`, `readHoldingRegisters`, `writeRegister`, `writeRegisters`, `close`) so `main.js` can swap clients via config without branching the read/write code.

### Transport selection

`config.protocol` picks the transport at connect time:
- `tcp` (default) → `modbus-serial`'s `ModbusRTU` over TCP port 502. For LAN-Kit / Ezlink3000.
- `udp` → `GoodweUdpClient` over UDP port 8899. For the old Wi-Fi-Kit (web UI with `Solar-WiFi…` SSID, no Modbus TCP).

The Wi-Fi-Kit is a transparent serial-over-UDP bridge. Wire format on UDP is standard Modbus RTU with one quirk: the gateway prepends a **2-byte prefix** to inbound frames that the request doesn't have. `parseResponse` strips it; CRC16 is computed over `data[2:-2]`. Test vectors and the prefix-stripping logic live in `tests/transport-udp.test.js`.

### Adapter lifecycle

1. `onReady()` → create ioBroker objects from register map → `subscribeStates('settings.*')` → connect to inverter
2. Connection established → start polling loop
3. Each poll → read 3 sensor blocks (35100–35224, 36000–36059, 37000–37024) with 300ms delay between each → decode all registers → update states
4. User writes to a writable state → convert value → write to Modbus register
5. Connection lost → exponential backoff reconnect (max 10 attempts)
6. `onUnload()` → clear timers, close Modbus connection

**Writable-state subscription is required and explicit.** Without `subscribeStates('settings.*')` in `onReady()`, `onStateChange` never fires for user writes (real bug fixed in 0.1.2). Any new writable group outside `settings` needs its own `subscribeStates` call.

### Register decoding

Supported data types in `lib/registers.js`: `int16`, `uint16`, `int32`, `uint32`, `string`, `bit`. Scale factors (e.g. `0.1` for voltage in 0.1V units) are applied after decoding. State mappings (e.g. `{0: 'Normal', 1: 'Standby'}`) are used for mode/status registers and writable settings.

**Important register conventions:**
- `reg.key` is not set in register definitions — it is auto-injected at the bottom of `registers.js` via `for (const [key, reg] of Object.entries(REGISTERS)) { reg.key = key; }`. Tests verify this.
- Five register ranges are in use: 35100–35224 (main sensors), 36000–36059 (meter), 37000–37024 (BMS), 47000 (operation mode), 47511–47512 (EMS settings). The poll loop reads only the first three (sensor blocks); 47000 and 47511–47512 are writable-only and read on demand. Registers outside these ranges will never be touched.
- Battery `ibattery1`/`pbattery1`: positive = charging, negative = discharging.
- Synthetic (non-register) states created directly in `createObjects()`: `pv.pv_sum` (sum of ppv1–ppv4), `info.connection`, `info.lastUpdate`, `info.firmwareVersion`. Don't look for these in `REGISTERS`.

**`work_mode_set` (47000) Off Grid side-effects.** Writing `settings.work_mode_set = Off Grid` auto-writes two additional registers: 45252 `backup_supply = 1` and 45248 `cold_start = 4`. Switching back to any other mode resets `backup_supply = 0`. This mirrors the Home Assistant Goodwe integration. Any refactor of the write path must preserve these cross-register writes.

**`work_mode_set` vs `ems_mode` — independent layered controls, not aliases.**
- `work_mode_set` (47000) = high-level inverter mode (General / Off Grid / Backup / Eco / Peak Shaving / Self Use).
- `ems_mode` (47511) = low-level EMS battery behavior *within* the current work mode (Auto, Charge PV, Discharge PV, Import AC, Export AC, etc.).
They are separate registers controlling different layers; setting one does not imply the other.

### ioBroker state object structure

States are grouped under `goodwe.<instance>.<group>.<name>`:
- `inverter` — system temps, firmware, serial, status/mode codes
- `pv` — per-string voltage/current/power (4 strings)
- `grid` — per-phase voltage/current/frequency, active/reactive/apparent power
- `battery` — voltage, current, power, SOC%, SOH%, temperature
- `backup` / `load` — EPS and household consumption
- `meter` — energy counters (import/export, charge/discharge)
- `bms` — battery management system data
- `settings` — writable EMS/operation mode registers (e.g. `operation_mode`)

### Configuration (user-facing)

Defined in `admin/jsonConfig.json` and `io-package.json`:
- `protocol` — `tcp` (default) or `udp`. See Transport selection above.
- `host` — inverter IP (default `192.168.1.1`)
- `port` — TCP 502 / UDP 8899 (transport-dependent default)
- `unitId` — Modbus unit ID (default `247` for Goodwe ET)
- `pollInterval` — seconds between polls (default `30`)
- `timeout` — Modbus request timeout in seconds (default `10`)
