# GBG Seeding Discord Bot

Discord Bot für das automatisierte Seeding-Management auf GBG (German Battleground) Servern.

## Features

- 🌱 Automatische Seeding-Nachricht mit interaktiven Buttons für 3 Server
- 📢 Automatische Benachrichtigungen mit Rollen-Ping beim Button-Klick
- ⏰ Automatische Löschung der Benachrichtigungen nach 60 Minuten
- 🔄 Täglicher automatischer Restart um 4:30 Uhr
- 🚀 PM2-Integration für zuverlässiges Deployment

## Installation

### 1. Repository klonen und Dependencies installieren

```bash
cd /pfad/zum/projekt
npm install
```

### 2. Discord Bot erstellen

1. Gehe zu [Discord Developer Portal](https://discord.com/developers/applications)
2. Erstelle eine neue Application
3. Gehe zu "Bot" und erstelle einen Bot
4. Kopiere den Bot Token
5. Aktiviere folgende Privileged Gateway Intents:
   - Server Members Intent
   - Message Content Intent

### 3. Bot zu deinem Server hinzufügen

Verwende diese URL (ersetze CLIENT_ID mit deiner Application ID):
```
https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&permissions=274878286912&scope=bot
```

Benötigte Berechtigungen:
- Nachrichten senden
- Eingebettete Links senden
- Nachrichtenverlauf lesen
- Nachrichten verwalten
- Erwähnungen verwenden

### 4. Konfiguration

Erstelle eine `.env` Datei und füge deine Werte ein:

```bash
DISCORD_TOKEN=dein_bot_token_hier
SEEDING_CHANNEL_ID=1445002106170900500
NOTIFICATION_CHANNEL_ID=1443928821706264729
PING_ROLE_ID=1443929262972342322
```

- **DISCORD_TOKEN**: Dein Bot Token vom Developer Portal
- **SEEDING_CHANNEL_ID**: Channel wo die permanente Nachricht mit Buttons angezeigt wird
- **NOTIFICATION_CHANNEL_ID**: Channel wo die Seeding-Benachrichtigungen gepostet werden
- **PING_ROLE_ID**: Rolle die gepingt wird bei Seeding-Benachrichtigungen

### 5. Start mit PM2 (Linux)

```bash
# PM2 installieren (falls noch nicht installiert)
npm install -g pm2

# Logs-Verzeichnis erstellen
mkdir logs

# Bot starten
pm2 start ecosystem.config.js

# Bot-Status prüfen
pm2 status

# Logs ansehen
pm2 logs gbg-seeding-bot

# Bot beim Systemstart automatisch starten
pm2 startup
pm2 save
```

### Nützliche PM2 Befehle

```bash
# Bot neu starten
pm2 restart gbg-seeding-bot

# Bot stoppen
pm2 stop gbg-seeding-bot

# Bot entfernen
pm2 delete gbg-seeding-bot

# Logs ansehen
pm2 logs gbg-seeding-bot

# Alle Logs löschen
pm2 flush
```

## Lokaler Test (Windows)

```bash
npm start
```

## Funktionsweise

1. **Beim Start**: Bot postet eine Embed-Nachricht mit 3 Buttons (Server 1, 2, 3) im konfigurierten Seeding-Channel

2. **Button-Klick**: 
   - Benachrichtigungs-Embed wird im Notifications-Channel gepostet
   - Konfigurierte Rolle wird gepingt
   - Nachricht wird nach 60 Minuten automatisch gelöscht

3. **Täglich um 4:30 Uhr**:
   - Bot löscht alte Seeding-Nachricht
   - Postet neue Seeding-Nachricht mit Buttons

## Anpassungen

### Bilder im Embed ändern

In der `index.js` gibt es Platzhalter für Bild-URLs:

```javascript
.setThumbnail('https://i.imgur.com/YOUR_IMAGE_URL.png')
.setImage('https://i.imgur.com/YOUR_BIG_IMAGE_URL.png')
```

Ersetze diese mit deinen eigenen Bild-URLs (z.B. von Imgur oder Discord CDN).

### Restart-Zeit ändern

In der `index.js` oder `ecosystem.config.js`:

```javascript
cron_restart: '30 4 * * *'  // Format: Minute Stunde * * *
```

### Auto-Lösch-Zeit ändern

In der `index.js`:

```javascript
}, 60 * 60 * 1000); // 60 Minuten in Millisekunden
```

## Troubleshooting

### Bot startet nicht
- Prüfe ob der Token in der `.env` korrekt ist
- Prüfe Bot-Berechtigungen auf dem Discord Server

### Button funktionieren nicht
- Stelle sicher dass der Bot die benötigten Permissions hat
- Prüfe die Logs mit `pm2 logs gbg-seeding-bot`

### Nachrichten werden nicht gelöscht
- Prüfe ob der Bot "Nachrichten verwalten" Permission hat
- Prüfe die Logs auf Fehler

## Support

Bei Fragen oder Problemen, prüfe die Logs:
```bash
pm2 logs gbg-seeding-bot --lines 100
```

## Lizenz

ISC
