'use strict';

const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { getBotName } = require('../../lib/botname');

module.exports = {
    name: 'toimg',

    aliases: ['stickerimage', 'stickerimg', 'stickertoimg'],

    description: 'Convert a sticker back to an image',

    category: 'utility',

    async execute(sock, msg, args, prefix, ctx) {
        const chatId = msg.key.remoteJid;
        const botName = getBotName();

        try {
            await sock.sendMessage(chatId, {
                react: {
                    text: '🖼️',
                    key: msg.key
                }
            });
        } catch {}

        try {
            // Get quoted message
            const quoted =
                msg.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
                msg.message?.imageMessage?.contextInfo?.quotedMessage ||
                msg.message?.stickerMessage?.contextInfo?.quotedMessage;

            if (!quoted?.stickerMessage) {
                return await sock.sendMessage(
                    chatId,
                    {
                        text:
                            `┏━━❐ *🖼️ STICKER TO IMAGE* ❐━━\n` +
                            `┃\n` +
                            `┃✦ Reply to a *sticker* with\n` +
                            `┃  *${prefix || '.'}toimg*\n` +
                            `┃\n` +
                            `┗━━❐ *${botName}* ❐━━`
                    },
                    { quoted: msg }
                );
            }

            // Rebuild quoted sticker message
            const quotedMsg = {
                key: {
                    remoteJid: chatId,
                    id: msg.message.extendedTextMessage?.contextInfo?.stanzaId,
                    participant:
                        msg.message.extendedTextMessage?.contextInfo?.participant
                },
                message: quoted
            };

            // Download sticker
            const buffer = await downloadMediaMessage(
                quotedMsg,
                'buffer',
                {},
                {
                    logger: {
                        level: 'silent',
                        child: () => ({
                            level: 'silent'
                        })
                    },
                    reuploadRequest: sock.updateMediaMessage
                }
            );

            if (!buffer || !buffer.length) {
                throw new Error('Unable to download sticker');
            }

            // Send as image
            await sock.sendMessage(
                chatId,
                {
                    image: buffer,
                    caption: `> ⚡ Converted by ${botName} 🔥`
                },
                { quoted: msg }
            );

        } catch (error) {
            console.error('[TOIMG ERROR]', error);

            await sock.sendMessage(
                chatId,
                {
                    text:
                        `❌ *Failed to convert sticker.*\n\n` +
                        `Reason: ${error.message || 'Unknown error'}`
                },
                { quoted: msg }
            );
        }
    }
};
