# ioBroker.goodwe

[![NPM version](https://img.shields.io/npm/v/iobroker.goodwe.svg)](https://www.npmjs.com/package/iobroker.goodwe)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Adapter für **Goodwe** Wechselrichter (GW10K-ET und kompatible ET/EH/BT-Serien) über **Modbus TCP**. Vergleichbar mit der [goodwe Integration für Home Assistant](https://www.home-assistant.io/integrations/goodwe/).

---

## Unterstützte Geräte

| Modell | Serie | Status |
|--------|-------|--------|
| GW10K-ET | ET | ✅ Getestet |
| GW5K-ET | ET | ✅ Kompatibel |
| GW8K-ET | ET | ✅ Kompatibel |
| GW6K-ET | ET | ✅ Kompatibel |
| GW10K-EH | EH | ⚠️ Kompatibel (evtl. abweichende Register) |
| GW5000D-NS | NS | ❌ Nicht unterstützt (anderes Protokoll) |

---

## Voraussetzungen

1. **Modbus TCP aktivieren** am Wechselrichter:  
   → SEMS Portal → Gerät → Modbus-Einstellungen → TCP aktivieren  
   → Alternativ über das Display: `Erweiterte Einstellungen > Kommunikation > Modbus TCP`

2. **IP-Adresse** des Wechselrichters im Heimnetzwerk (statische IP empfohlen)

3. **Modbus Port**: 502 (Standard)

4. **Unit ID / Slave ID**: 247 (Goodwe ET Standard)

---

## Installation

```bash
# Im ioBroker-Verzeichnis:
cd /opt/iobroker
npm install iobroker.goodwe

# Oder über ioBroker Admin-Oberfläche:
# Adapter → + → "goodwe" suchen → installieren
```

---

## Konfiguration

| Parameter | Standard | Beschreibung |
|-----------|----------|--------------|
| **IP-Adresse** | 192.168.1.1 | IP des Wechselrichters |
| **Port** | 502 | Modbus TCP Port |
| **Unit ID** | 247 | Modbus Slave ID (Goodwe ET: 247) |
| **Poll-Intervall** | 30 | Abfrageintervall in Sekunden |
| **Timeout** | 10 | Verbindungs-Timeout in Sekunden |

---

## Datenpunkte

### 📊 Inverter Info
| Datenpunkt | Beschreibung | Einheit |
|------------|--------------|---------|
| `inverter.serial_number` | Seriennummer | - |
| `inverter.model_name` | Modellbezeichnung | - |
| `inverter.rated_power` | Nennleistung | kW |

### ☀️ PV (Solaranlage)
| Datenpunkt | Beschreibung | Einheit |
|------------|--------------|---------|
| `pv.pv1_voltage` | PV-String 1 Spannung | V |
| `pv.pv1_current` | PV-String 1 Strom | A |
| `pv.pv1_power` | PV-String 1 Leistung | W |
| `pv.pv2_voltage` | PV-String 2 Spannung | V |
| `pv.pv2_current` | PV-String 2 Strom | A |
| `pv.pv2_power` | PV-String 2 Leistung | W |
| `pv.pv_power_total` | Gesamte PV-Leistung | W |
| `pv.pv_energy_today` | PV-Ertrag heute | kWh |
| `pv.pv_energy_total` | PV-Gesamtertrag | kWh |

### ⚡ Netz (Grid)
| Datenpunkt | Beschreibung | Einheit |
|------------|--------------|---------|
| `grid.grid_voltage_r` | Netzspannung L1 | V |
| `grid.grid_current_r` | Netzstrom L1 | A |
| `grid.grid_frequency` | Netzfrequenz | Hz |
| `grid.grid_power` | Netzleistung (+ Export / - Import) | W |
| `grid.meter_power` | Zählerleistung (CT-Klemme) | W |
| `grid.grid_energy_export_today` | Einspeisung heute | kWh |
| `grid.grid_energy_export_total` | Gesamteinspeisung | kWh |
| `grid.grid_energy_import_today` | Bezug heute | kWh |
| `grid.grid_energy_import_total` | Gesamtbezug | kWh |

### 🔋 Batterie
| Datenpunkt | Beschreibung | Einheit |
|------------|--------------|---------|
| `battery.battery_voltage` | Batteriespannung | V |
| `battery.battery_current` | Batteriestrom (+ Laden / - Entladen) | A |
| `battery.battery_power` | Batterieleistung | W |
| `battery.battery_soc` | Ladezustand (SOC) | % |
| `battery.battery_soh` | Gesundheitszustand (SOH) | % |
| `battery.battery_temperature` | Batterietemperatur | °C |
| `battery.battery_charge_today` | Geladen heute | kWh |
| `battery.battery_discharge_today` | Entladen heute | kWh |
| `battery.battery_cycles` | Ladezyklen | - |

### 🏠 Verbrauch (Load)
| Datenpunkt | Beschreibung | Einheit |
|------------|--------------|---------|
| `load.load_power` | Hausverbrauch | W |
| `load.backup_power` | EPS/Backup-Leistung | W |
| `load.backup_voltage` | EPS-Spannung | V |

### ⚙️ Einstellungen (beschreibbar)
| Datenpunkt | Beschreibung | Einheit |
|------------|--------------|---------|
| `settings.battery_reserve_soc` | Batterie-Reserve SOC | % |
| `settings.battery_charge_soc_limit` | Lade-Limit SOC | % |
| `settings.ac_charge_enabled` | AC-Laden aktiviert | boolean |
| `settings.export_limit` | Einspeisebegrenzung | W |
| `settings.power_mode` | Betriebsmodus | - |
| `settings.charge_time1_start` | Ladezeit 1 Start (HHMM) | - |
| `settings.charge_time1_stop` | Ladezeit 1 Ende (HHMM) | - |

---

## Netzwerk-Anforderungen

- Der ioBroker-Server muss den Wechselrichter über TCP Port 502 erreichen können
- Firewall-Regeln ggf. anpassen
- Eine **statische IP** für den Wechselrichter wird empfohlen (DHCP-Reservierung im Router)

---

## Fehlerbehebung

### Verbindung schlägt fehl
1. Prüfen ob Modbus TCP am Wechselrichter aktiviert ist
2. IP-Adresse und Port prüfen: `telnet 192.168.1.x 502`
3. Unit ID prüfen (Standard ET: 247)
4. Firewall-Regeln prüfen

### Falsche Werte
- Unit ID falsch → alle Werte 0 oder Fehler
- Falsches Modell → einzelne Register können abweichen
- Den ioBroker-Log auf Warnungen prüfen

### Adapter startet nicht
```bash
cd /opt/iobroker
npm install --prefix node_modules/iobroker.goodwe
```

---

## Changelog

### 0.1.0
- Erste Version
- Unterstützung ET-Serie (GW10K-ET)
- Modbus TCP Verbindung mit Auto-Reconnect
- PV, Netz, Batterie, Verbrauch Datenpunkte
- Beschreibbare Einstellungsregister

---

## Lizenz

MIT License – © 2024 ioBroker Community
