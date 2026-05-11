# ioBroker.goodwe

[![NPM version](https://img.shields.io/npm/v/iobroker.goodwe.svg)](https://www.npmjs.com/package/iobroker.goodwe)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Adapter für **Goodwe** Wechselrichter (ET/EH/BT-Serien) über **Modbus TCP**. Portiert vom [goodwe Python-Adapter für Home Assistant](https://github.com/marcelblijleven/goodwe).

---

## Unterstützte Geräte

| Modell | Serie | Status |
|--------|-------|--------|
| GW10K-ET | ET | ✅ Getestet |
| GW5K-ET / GW8K-ET / GW6K-ET | ET | ✅ Kompatibel |
| GW10K-EH | EH | ⚠️ Kompatibel (evtl. abweichende Register) |
| GW5000D-NS | NS | ❌ Nicht unterstützt (anderes Protokoll) |

---

## Voraussetzungen

1. **Modbus TCP aktivieren** am Wechselrichter:  
   SEMS Portal → Gerät → Modbus-Einstellungen → TCP aktivieren  
   oder: Display → `Erweiterte Einstellungen > Kommunikation > Modbus TCP`

2. **Statische IP** für den Wechselrichter empfohlen (DHCP-Reservierung im Router)

3. Modbus-Port **502**, Unit ID **247** (Goodwe ET Standard)

---

## Installation

```bash
cd /opt/iobroker
npm install iobroker.goodwe
```

Oder über die ioBroker Admin-Oberfläche: Adapter → + → „goodwe".

---

## Konfiguration

| Parameter | Standard | Beschreibung |
|-----------|----------|--------------|
| Protokoll | tcp | `tcp` = Modbus TCP (LAN-Kit / Ezlink3000). `udp` = UDP 8899 für alte Wi-Fi-Kit Dongles (SSID `Solar-WiFi…`) |
| IP-Adresse | 192.168.1.1 | IP des Wechselrichters |
| Port | 502 / 8899 | Modbus TCP = 502, UDP Wi-Fi-Kit = 8899 |
| Unit ID | 247 | Modbus Slave ID (ET-Serie: 247) |
| Poll-Intervall | 30 | Abfrageintervall in Sekunden |
| Timeout | 10 | Verbindungs-Timeout in Sekunden |

**Welches Protokoll?** Wenn `Test-NetConnection <IP> -Port 502` `TcpTestSucceeded: True` zurückliefert, nutze `tcp`. Liefert nur das alte Wi-Fi-Kit (Web-UI auf Port 80, SSID `Solar-WiFi…`) keinen Port 502, nutze `udp`. Das Wi-Fi-Kit arbeitet als transparente Serial-über-UDP-Brücke auf Port 8899 — die Adapter-Logik (Register-Map, Schreibvorgänge) bleibt identisch.

---

## Datenpunkte

Alle Datenpunkte unter `goodwe.<instanz>.<gruppe>.<name>`.

### info
| Datenpunkt | Beschreibung |
|------------|--------------|
| `info.connection` | Verbindungsstatus (boolean) |
| `info.lastUpdate` | Zeitstempel letztes erfolgreiches Poll |

### ☀️ pv — Solaranlage
| Datenpunkt | Beschreibung | Einheit |
|------------|--------------|---------|
| `pv.vpv1` … `pv.vpv4` | Spannung String 1–4 | V |
| `pv.ipv1` … `pv.ipv4` | Strom String 1–4 | A |
| `pv.ppv1` … `pv.ppv4` | Leistung String 1–4 | W |
| `pv.pv_sum` | Gesamte PV-Leistung (berechnet) | W |

### ⚡ grid — Netz
| Datenpunkt | Beschreibung | Einheit |
|------------|--------------|---------|
| `grid.vgrid` / `vgrid2` / `vgrid3` | Netzspannung L1–L3 | V |
| `grid.igrid` / `igrid2` / `igrid3` | Netzstrom L1–L3 | A |
| `grid.fgrid` / `fgrid2` / `fgrid3` | Netzfrequenz L1–L3 | Hz |
| `grid.pgrid` / `pgrid2` / `pgrid3` | Netzleistung L1–L3 | W |
| `grid.active_power` | Wirkleistung (+ Export / − Import) | W |
| `grid.reactive_power` | Blindleistung | var |
| `grid.apparent_power` | Scheinleistung | VA |
| `grid.total_inverter_power` | Gesamtleistung Wechselrichter | W |
| `grid.grid_mode` | Grid-Modus Code | - |

### 🔋 battery — Batterie
| Datenpunkt | Beschreibung | Einheit |
|------------|--------------|---------|
| `battery.vbattery1` | Batteriespannung | V |
| `battery.ibattery1` | Batteriestrom (+ Laden / − Entladen) | A |
| `battery.pbattery1` | Batterieleistung | W |
| `battery.battery_mode` | Batterie-Modus (Normal/Standby/Charge/Discharge/…) | - |

### 🔬 bms — Batterie-Management
| Datenpunkt | Beschreibung | Einheit |
|------------|--------------|---------|
| `bms.battery_soc` | Ladezustand (SOC) | % |
| `bms.battery_soh` | Gesundheitszustand (SOH) | % |
| `bms.battery_temperature` | Batterietemperatur | °C |
| `bms.battery_max_cell_temp` / `battery_min_cell_temp` | Zellen-Temp. max/min | °C |
| `bms.battery_max_cell_voltage` / `battery_min_cell_voltage` | Zellen-Spannung max/min | V |
| `bms.battery_charge_limit` / `battery_discharge_limit` | Lade-/Entlade-Limit | A |
| `bms.battery_status` / `battery_error_l` / `battery_warning_l` | Status / Fehler / Warnung | - |

### 🏠 load — Verbrauch
| Datenpunkt | Beschreibung | Einheit |
|------------|--------------|---------|
| `load.load_p1` / `load_p2` / `load_p3` | Hausverbrauch L1–L3 | W |
| `load.load_ptotal` | Hausverbrauch gesamt | W |
| `load.ups_load` | UPS-Last | % |

### 🔌 backup — EPS/Backup
| Datenpunkt | Beschreibung | Einheit |
|------------|--------------|---------|
| `backup.backup_v1` / `v2` / `v3` | EPS-Spannung L1–L3 | V |
| `backup.backup_p1` / `p2` / `p3` | EPS-Leistung L1–L3 | W |
| `backup.backup_ptotal` | EPS-Gesamtleistung | W |

### 📊 meter — Energiezähler
| Datenpunkt | Beschreibung | Einheit |
|------------|--------------|---------|
| `meter.e_total` / `e_day` | PV-Ertrag gesamt / heute | kWh |
| `meter.e_total_exp` / `e_day_exp` | Einspeisung gesamt / heute | kWh |
| `meter.e_total_imp` / `e_day_imp` | Netzbezug gesamt / heute | kWh |
| `meter.e_load_total` / `e_load_day` | Verbrauch gesamt / heute | kWh |
| `meter.e_bat_charge_total` / `e_bat_charge_day` | Batterieladung gesamt / heute | kWh |
| `meter.e_bat_discharge_total` / `e_bat_discharge_day` | Batterieentladung gesamt / heute | kWh |
| `meter.active_power_total` | Zähler Wirkleistung (präzise) | W |
| `meter.meter_freq` | Zählerfrequenz | Hz |

### 🌡️ inverter — Wechselrichter-Info
| Datenpunkt | Beschreibung | Einheit |
|------------|--------------|---------|
| `inverter.temperature` | Kühlkörpertemperatur | °C |
| `inverter.temperature_air` / `temperature_module` | Luft- / Modultemperatur | °C |
| `inverter.work_mode` | Betriebsmodus (Waiting/Normal/Error/Checking) | - |
| `inverter.operation_mode` | Betriebsmodus-Code | - |
| `inverter.warning_code` / `error_codes` | Warn-/Fehlercodes | - |
| `inverter.h_total` | Betriebsstunden gesamt | h |

### ⚙️ settings — Einstellungen (beschreibbar)

| Datenpunkt | Beschreibung | Werte |
|------------|--------------|-------|
| `settings.work_mode_set` | **Betriebsmodus des Wechselrichters** | General Mode, Off Grid, Backup Mode, Eco Mode, Peak Shaving, Self Use |
| `settings.ems_mode` | EMS-Batterie-Steuermodus (Feinsteuerung) | Auto (Self-use), Charge PV, Discharge PV, Import AC, Export AC, Conserve, Off Grid, Battery Standby, Buy Power, Sell Power, Charge Battery, Discharge Battery |

**Hinweis `work_mode_set`:** Beim Wechsel in den Modus **Off Grid** werden automatisch zusätzliche Register gesetzt (Register 45252 `backup_supply` = 1, Register 45248 `cold_start` = 4), analog zur Home Assistant Goodwe-Integration. Beim Wechsel zurück in jeden anderen Modus wird `backup_supply` = 0 zurückgesetzt.

**Unterschied `work_mode_set` vs. `ems_mode`:**  
`work_mode_set` (47000) steuert den übergeordneten Wechselrichter-Betriebsmodus (On-Grid / Off-Grid / Backup / Eco).  
`ems_mode` (47511) steuert das niederstufe EMS-Batterieverhalten innerhalb des aktuellen Modus.

---

## Fehlerbehebung

### Verbindung schlägt fehl
1. Modbus TCP am Wechselrichter aktiviert?
2. Erreichbarkeit prüfen: `telnet <ip> 502`
3. Unit ID korrekt? (ET-Serie Standard: 247)
4. ioBroker-Log auf Fehlermeldungen prüfen

### Adapter startet nicht
```bash
cd /opt/iobroker
npm install --prefix node_modules/iobroker.goodwe
```

---

## Changelog

### 0.2.0
- Neu: UDP 8899 Transport für alte Goodwe Wi-Fi-Kit Dongles, die kein Modbus TCP anbieten (SSID `Solar-WiFi…`). Auswahl über neues Konfigurationsfeld `Protokoll`. Bestehende TCP-Setups unverändert.
- Register-Map und Schreibverhalten (inkl. Off-Grid Cross-Register-Schreibvorgängen) sind transport-agnostisch — beide Transports nutzen identische Modbus-RTU/TCP-Frames.

### 0.1.3
- Doku: Nicht offensichtliche Adapter-Konventionen in `CLAUDE.md` erfasst (Off-Grid Cross-Register-Schreibvorgänge, `work_mode_set` vs `ems_mode`-Schichtung, erforderliches `settings.*` Abonnement, synthetische Nicht-Register-States, Node `>=18` Engine-Pin)

### 0.1.2
- Fix: Schreiben auf States (`work_mode_set`, `ems_mode`) funktionierte nicht — `subscribeStates('settings.*')` fehlte in `onReady()`
- Neu: `settings.work_mode_set` (Register 47000) — Betriebsmodus General/Off Grid/Backup/Eco/Peak Shaving/Self Use, analog zur HA-Integration; Off Grid setzt automatisch `backup_supply` und `cold_start`

### 0.1.1
- Fix: `total_inverter_power` als `int16` dekodiert (war fälschlicherweise `int32`, lieferte Phantomwerte)
- Fix: `ems_mode` auf korrektes Register 47511; Modus-Werte auf `EMSMode`-Enum korrigiert (Off Grid = 7)
- `operation_mode` (35188) ist schreibgeschützt und zeigt den Rohcode

### 0.1.0
- Erste Version
- Unterstützung ET-Serie (GW10K-ET)
- Modbus TCP mit Auto-Reconnect (exponentieller Backoff, max. 10 Versuche)
- PV, Netz, Batterie, Verbrauch, BMS, Zähler-Datenpunkte (~170 Register in 3 Blöcken)

---

## Lizenz

MIT License – © 2024 ioBroker Community
