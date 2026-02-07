require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const cron = require('node-cron');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const SEEDING_CHANNEL_ID = process.env.SEEDING_CHANNEL_ID;
const NOTIFICATION_CHANNEL_ID = process.env.NOTIFICATION_CHANNEL_ID;
const PING_ROLE_ID = process.env.PING_ROLE_ID;

let seedingMessageId = null;
const scheduledDeletions = new Map();
const activeSeedingMessages = new Map(); // Speichert aktive Seeding-Benachrichtigungen

// Funktion zum Erstellen des Seeding Embeds
function createSeedingEmbed() {
    const embed = new EmbedBuilder()
        .setColor('#8B4513')
        .setTitle('🌱 Seeding')
        .setDescription('Sende eine Seeding Nachricht in den Seeding Kanal für den Jeweiligen Server')
        .setThumbnail('https://i.imgur.com/YOUR_IMAGE_URL.png') // Optional: Thumbnail URL anpassen
        .setImage('https://i.imgur.com/YOUR_BIG_IMAGE_URL.png') // Optional: Großes Bild URL anpassen
        .setFooter({ text: 'GBG - German Battleground' });

    return embed;
}

// Funktion zum Erstellen der Buttons
function createButtons() {
    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('server_1')
                .setLabel('🌱 Server 1')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('server_2')
                .setLabel('🌱 Server 2')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('server_3')
                .setLabel('🌱 Server 3')
                .setStyle(ButtonStyle.Success)
        );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('delete_server_1')
                .setLabel('🗑️ Server 1')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('delete_server_2')
                .setLabel('🗑️ Server 2')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('delete_server_3')
                .setLabel('🗑️ Server 3')
                .setStyle(ButtonStyle.Danger)
        );

    return [row1, row2];
}

// Funktion zum Erstellen der Seeding-Benachrichtigung
function createSeedingNotificationEmbed(serverNumber) {
    const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle(`🚨 SEEDING STARTET JETZT AUF GBG #${serverNumber}! 🚨`)
        .setDescription(
            `Wir starten das Seeding auf **GBG #${serverNumber}** – der Server braucht euch dringend, damit er schnell voll wird und die Schlacht richtig losgeht! 🔥\n\n` +
            `Kommt alle rein und helft mit – zusammen machen wir den Server startklar! ❤️\n\n` +
            `Wer jetzt mitseedet, ist ein echter Community-Held! 😍\n\n` +
            `Vielen Dank schon im Voraus – lasst uns die Front füllen! 💪\n\n` +
            `**Euer GBG-Team**`
        )
        .setThumbnail('https://i.imgur.com/YOUR_IMAGE_URL.png') // Optional: Thumbnail URL anpassen
        .setImage('https://i.imgur.com/YOUR_BIG_IMAGE_URL.png') // Optional: Großes Bild URL anpassen
        .setFooter({ text: 'GBG – Gemeinsam unschlagbar! 💥' })
        .setTimestamp();

    return embed;
}

// Funktion zum Posten/Aktualisieren der Seeding-Nachricht
async function postSeedingMessage() {
    try {
        const channel = await client.channels.fetch(SEEDING_CHANNEL_ID);
        if (!channel) {
            console.error('Seeding Channel nicht gefunden!');
            return;
        }

        const embed = createSeedingEmbed();
        const buttons = createButtons();

        // Versuche alte Nachricht zu löschen
        if (seedingMessageId) {
            try {
                const oldMessage = await channel.messages.fetch(seedingMessageId);
                await oldMessage.delete();
                console.log('Alte Seeding-Nachricht gelöscht');
            } catch (error) {
                console.log('Alte Nachricht nicht gefunden oder bereits gelöscht');
            }
        }

        // Poste neue Nachricht
        const message = await channel.send({
            embeds: [embed],
            components: [buttons]
        });

        seedingMessageId = message.id;
        console.log(`Seeding-Nachricht gepostet! ID: ${seedingMessageId}`);

    } catch (error) {
        console.error('Fehler beim Posten der Seeding-Nachricht:', error);
    }
}

// Funktion zum Löschen einer Nachricht nach Timeout
function scheduleMessageDeletion(messageId, channelId, serverNumber) {
    // Lösche nach 60 Minuten (3600000 ms)
    const timeout = setTimeout(async () => {
        try {
            const channel = await client.channels.fetch(channelId);
            const message = await channel.messages.fetch(messageId);
            await message.delete();
            console.log(`Seeding-Benachrichtigung ${messageId} automatisch gelöscht`);
            scheduledDeletions.delete(messageId);
            activeSeedingMessages.delete(serverNumber);
        } catch (error) {
            console.error('Fehler beim Löschen der Nachricht:', error);
        }
    }, 60 * 60 * 1000); // 60 Minuten

    scheduledDeletions.set(messageId, timeout);
}

// Bot Ready Event
client.once('ready', async () => {
    console.log(`✅ Bot ist online als ${client.user.tag}`);
    
    // Poste initiale Seeding-Nachricht
    await postSeedingMessage();

    // Täglicher Restart um 4:30 Uhr
    cron.schedule('30 4 * * *', async () => {
        console.log('⏰ Täglicher Restart um 4:30 Uhr');
        await postSeedingMessage();
    }, {
        timezone: "Europe/Berlin"
    });

    console.log('📅 Cronjob für täglichen Restart um 4:30 Uhr eingerichtet');
});

// Button Interaction Handler
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    // Löschen-Button Handler für einzelne Server
    if (interaction.customId.startsWith('delete_server_')) {
        const serverNumber = interaction.customId.replace('delete_server_', '');
        
        try {
            await interaction.deferReply({ ephemeral: true });

            // Prüfe ob für diesen Server eine aktive Nachricht existiert
            if (!activeSeedingMessages.has(serverNumber)) {
                await interaction.editReply({ 
                    content: `⚠️ Keine aktive Seeding-Benachrichtigung für Server ${serverNumber} gefunden.`, 
                    ephemeral: true 
                });
                return;
            }

            const messageData = activeSeedingMessages.get(serverNumber);
            const notificationChannel = await client.channels.fetch(NOTIFICATION_CHANNEL_ID);

            try {
                const message = await notificationChannel.messages.fetch(messageData.messageId);
                await message.delete();
                
                // Lösche geplante Auto-Löschung
                if (scheduledDeletions.has(messageData.messageId)) {
                    clearTimeout(scheduledDeletions.get(messageData.messageId));
                    scheduledDeletions.delete(messageData.messageId);
                }
                
                activeSeedingMessages.delete(serverNumber);
                console.log(`Seeding-Benachrichtigung für Server ${serverNumber} manuell gelöscht`);

                await interaction.editReply({ 
                    content: `✅ Seeding-Benachrichtigung für Server ${serverNumber} erfolgreich gelöscht!`, 
                    ephemeral: true 
                });
            } catch (error) {
                console.log(`Nachricht für Server ${serverNumber} nicht gefunden oder bereits gelöscht`);
                activeSeedingMessages.delete(serverNumber);
                await interaction.editReply({ 
                    content: `⚠️ Nachricht für Server ${serverNumber} wurde bereits gelöscht.`, 
                    ephemeral: true 
                });
            }

        } catch (error) {
            console.error('Fehler beim Löschen der Seeding-Nachricht:', error);
            await interaction.editReply({ 
                content: '❌ Fehler beim Löschen der Nachricht!', 
                ephemeral: true 
            });
        }
        return;
    }

    // Server-Button Handler
    const serverMap = {
        'server_1': '1',
        'server_2': '2',
        'server_3': '3'
    };

    const serverNumber = serverMap[interaction.customId];
    if (!serverNumber) return;

    try {
        // Bestätige die Interaktion
        await interaction.deferReply({ ephemeral: true });

        // Hole den Benachrichtigungs-Channel
        const notificationChannel = await client.channels.fetch(NOTIFICATION_CHANNEL_ID);
        if (!notificationChannel) {
            await interaction.editReply({ content: '❌ Benachrichtigungs-Channel nicht gefunden!', ephemeral: true });
            return;
        }

        // Lösche ALLE vorherigen aktiven Seeding-Nachrichten (nur eine gleichzeitig erlaubt)
        for (const [serverNum, messageData] of activeSeedingMessages.entries()) {
            try {
                const oldMessage = await notificationChannel.messages.fetch(messageData.messageId);
                await oldMessage.delete();
                
                // Lösche geplante Auto-Löschung
                if (scheduledDeletions.has(messageData.messageId)) {
                    clearTimeout(scheduledDeletions.get(messageData.messageId));
                    scheduledDeletions.delete(messageData.messageId);
                }
                
                console.log(`Vorherige Seeding-Benachrichtigung für Server ${serverNum} gelöscht`);
            } catch (error) {
                console.log(`Alte Nachricht für Server ${serverNum} nicht gefunden`);
            }
        }
        
        // Lösche alle Einträge aus der Map
        activeSeedingMessages.clear();

        // Erstelle und sende die Benachrichtigung
        const embed = createSeedingNotificationEmbed(serverNumber);
        const message = await notificationChannel.send({
            content: `<@&${PING_ROLE_ID}>`,
            embeds: [embed]
        });

        console.log(`🌱 Seeding-Benachrichtigung für Server ${serverNumber} gesendet!`);

        // Speichere Nachricht für manuelles Löschen
        activeSeedingMessages.set(serverNumber, {
            messageId: message.id,
            channelId: NOTIFICATION_CHANNEL_ID,
            timestamp: Date.now()
        });

        // Plane automatische Löschung nach 60 Minuten
        scheduleMessageDeletion(message.id, NOTIFICATION_CHANNEL_ID, serverNumber);

        await interaction.editReply({ 
            content: `✅ Seeding-Benachrichtigung für Server ${serverNumber} wurde gesendet! Die Nachricht wird in 60 Minuten automatisch gelöscht oder kann manuell gelöscht werden.`, 
            ephemeral: true 
        });

    } catch (error) {
        console.error('Fehler beim Verarbeiten der Button-Interaktion:', error);
        await interaction.editReply({ 
            content: '❌ Ein Fehler ist aufgetreten!', 
            ephemeral: true 
        });
    }
});

// Error Handler
client.on('error', error => {
    console.error('Discord Client Error:', error);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled Promise Rejection:', error);
});

// Bot Login
client.login(process.env.DISCORD_TOKEN);
