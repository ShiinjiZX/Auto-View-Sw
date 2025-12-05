require('../setting.js') 
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, downloadContentFromMessage } = require("@whiskeysockets/baileys")
const pino = require('pino')
const { Boom } = require('@hapi/boom')
const readline = require("readline");
const { exec } = require("child_process");
const util = require("util");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

const SEND_TO_TELEGRAM = global.sendTele // true = kirim ke Telegram | false = kirim ke WA Bot

// Konfigurasi Telegram (hanya dipakai jika SEND_TO_TELEGRAM = true)
const TELEGRAM_BOT_TOKEN = global.teletoken;
const TELEGRAM_CHAT_ID = global.teleid
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Set untuk track status yang sudah di-react (anti spam)
const reactedStatus = new Set();

const question = (text) => { 
    const rl = readline.createInterface({ 
        input: process.stdin, 
        output: process.stdout 
    }); 
    return new Promise((resolve) => { 
        rl.question(text, resolve) 
    }) 
};

// Escape special characters untuk Telegram MarkdownV2
function escapeMarkdown(text) {
    return text.replace(/[_*\[\]()~`>#+=|{}.!-]/g, '\\$&');
}

// Fungsi custom untuk download media
async function downloadMedia(message) {
    try {
        let type, msg;
        
        // Tentukan tipe media
        if (message.imageMessage) {
            type = 'image';
            msg = message.imageMessage;
        } else if (message.videoMessage) {
            type = 'video';
            msg = message.videoMessage;
        } else if (message.audioMessage) {
            type = 'audio';
            msg = message.audioMessage;
        } else if (message.documentMessage) {
            type = 'document';
            msg = message.documentMessage;
        } else if (message.stickerMessage) {
            type = 'sticker';
            msg = message.stickerMessage;
        } else {
            return null;
        }

        // Download content menggunakan stream
        const stream = await downloadContentFromMessage(msg, type === 'sticker' ? 'image' : type);
        
        // Konversi stream ke buffer
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        
        return buffer;
    } catch (error) {
        console.error('❌ Error downloading media:', error.message);
        return null;
    }
}

// Fungsi untuk kirim ke Telegram
async function sendToTelegram(type, data, userNumber, caption = '') {
    try {
        let message = `📱 *Status dari:* \\+${escapeMarkdown(userNumber)}\n\n`;
        
        if (type === 'text') {
            message += `💬 *Pesan:*\n${escapeMarkdown(data)}`;
            const response = await axios.post(`${TELEGRAM_API}/sendMessage`, {
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'MarkdownV2'
            });
            console.log(`✅ Text berhasil dikirim ke Telegram`);
            return response.data;
        } else if (type === 'image') {
            if (caption) message += `📝 *Caption:* ${escapeMarkdown(caption)}`;
            
            const form = new FormData();
            form.append('chat_id', TELEGRAM_CHAT_ID);
            form.append('photo', data, { 
                filename: 'status.jpg',
                contentType: 'image/jpeg'
            });
            form.append('caption', message);
            form.append('parse_mode', 'MarkdownV2');
            
            const response = await axios.post(`${TELEGRAM_API}/sendPhoto`, form, {
                headers: form.getHeaders(),
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                timeout: 60000
            });
            console.log(`✅ Image berhasil dikirim ke Telegram (${(data.length / 1024).toFixed(2)} KB)`);
            return response.data;
        } else if (type === 'video') {
            if (caption) message += `📝 *Caption:* ${escapeMarkdown(caption)}`;
            
            const form = new FormData();
            form.append('chat_id', TELEGRAM_CHAT_ID);
            form.append('video', data, { 
                filename: 'status.mp4',
                contentType: 'video/mp4'
            });
            form.append('caption', message);
            form.append('parse_mode', 'MarkdownV2');
            
            const response = await axios.post(`${TELEGRAM_API}/sendVideo`, form, {
                headers: form.getHeaders(),
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                timeout: 120000
            });
            console.log(`✅ Video berhasil dikirim ke Telegram (${(data.length / 1024 / 1024).toFixed(2)} MB)`);
            return response.data;
        } else if (type === 'audio') {
            const form = new FormData();
            form.append('chat_id', TELEGRAM_CHAT_ID);
            form.append('voice', data, { 
                filename: 'status.ogg',
                contentType: 'audio/ogg'
            });
            form.append('caption', message);
            form.append('parse_mode', 'MarkdownV2');
            
            const response = await axios.post(`${TELEGRAM_API}/sendVoice`, form, {
                headers: form.getHeaders(),
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            console.log(`✅ Audio berhasil dikirim ke Telegram (${(data.length / 1024).toFixed(2)} KB)`);
            return response.data;
        } else if (type === 'sticker') {
            const form = new FormData();
            form.append('chat_id', TELEGRAM_CHAT_ID);
            form.append('sticker', data, { 
                filename: 'sticker.webp',
                contentType: 'image/webp'
            });
            
            const response = await axios.post(`${TELEGRAM_API}/sendSticker`, form, {
                headers: form.getHeaders(),
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            
            // Kirim info sticker sebagai caption terpisah
            await axios.post(`${TELEGRAM_API}/sendMessage`, {
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'MarkdownV2'
            });
            
            console.log(`✅ Sticker berhasil dikirim ke Telegram`);
            return response.data;
        } else if (type === 'document') {
            if (caption) message += `📝 *Caption:* ${escapeMarkdown(caption)}`;
            
            const form = new FormData();
            form.append('chat_id', TELEGRAM_CHAT_ID);
            form.append('document', data, { 
                filename: 'status_document',
                contentType: 'application/octet-stream'
            });
            form.append('caption', message);
            form.append('parse_mode', 'MarkdownV2');
            
            const response = await axios.post(`${TELEGRAM_API}/sendDocument`, form, {
                headers: form.getHeaders(),
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            console.log(`✅ Document berhasil dikirim ke Telegram (${(data.length / 1024).toFixed(2)} KB)`);
            return response.data;
        }
    } catch (error) {
        console.error('❌ Error sending to Telegram:');
        if (error.response?.data) {
            console.error('Response:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
        
        // Jika error karena file terlalu besar atau format tidak support, coba kirim sebagai document
        if ((error.response?.data?.description?.includes('too large') || 
             error.response?.data?.description?.includes('wrong file')) && 
            type !== 'document') {
            console.log('⚠️  Mencoba kirim sebagai document...');
            return sendToTelegram('document', data, userNumber, caption);
        }
        return null;
    }
}

// Fungsi untuk kirim ke WhatsApp (Bot sendiri)
async function sendToWhatsApp(conn, type, data, userNumber, caption = '') {
    try {
        const botJid = conn.user.id; // Nomor bot sendiri
        let message = `📱 *Status dari:* +${userNumber}\n`;
        message += `📝 *Tipe:* ${type.toUpperCase()}\n`;
        message += `⏰ *Waktu:* ${new Date().toLocaleString('id-ID')}\n\n`;
        
        if (type === 'text') {
            message += `💬 *Pesan:*\n${data}`;
            await conn.sendMessage(botJid, { text: message });
            console.log(`✅ Text berhasil dikirim ke WA Bot`);
        } else if (type === 'image') {
            if (caption) message += `📝 *Caption:* ${caption}\n\n`;
            await conn.sendMessage(botJid, { 
                image: data, 
                caption: message 
            });
            console.log(`✅ Image berhasil dikirim ke WA Bot (${(data.length / 1024).toFixed(2)} KB)`);
        } else if (type === 'video') {
            if (caption) message += `📝 *Caption:* ${caption}\n\n`;
            await conn.sendMessage(botJid, { 
                video: data, 
                caption: message 
            });
            console.log(`✅ Video berhasil dikirim ke WA Bot (${(data.length / 1024 / 1024).toFixed(2)} MB)`);
        } else if (type === 'audio') {
            await conn.sendMessage(botJid, { text: message });
            await conn.sendMessage(botJid, { 
                audio: data, 
                mimetype: 'audio/mp4',
                ptt: true // Voice note
            });
            console.log(`✅ Audio berhasil dikirim ke WA Bot (${(data.length / 1024).toFixed(2)} KB)`);
        } else if (type === 'sticker') {
            await conn.sendMessage(botJid, { text: message });
            await conn.sendMessage(botJid, { 
                sticker: data 
            });
            console.log(`✅ Sticker berhasil dikirim ke WA Bot`);
        } else if (type === 'document') {
            if (caption) message += `📝 *Caption:* ${caption}\n\n`;
            await conn.sendMessage(botJid, { 
                document: data, 
                mimetype: 'application/octet-stream',
                fileName: 'status_document',
                caption: message 
            });
            console.log(`✅ Document berhasil dikirim ke WA Bot (${(data.length / 1024).toFixed(2)} KB)`);
        }
    } catch (error) {
        console.error('❌ Error sending to WhatsApp:', error.message);
    }
}

async function startBotz() {
    const { state, saveCreds } = await useMultiFileAuthState("session")
    const conn = makeWASocket({
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        auth: state,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        keepAliveIntervalMs: 10000,
        emitOwnEvents: true,
        fireInitQueries: true,
        generateHighQualityLinkPreview: true,
        syncFullHistory: true,
        markOnlineOnConnect: true,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
    });

    // Pairing code if not registered
    if (!conn.authState.creds.registered) {
        const phoneNumber = await question('𝙼𝚊𝚜𝚞𝚔𝚊𝚗 𝙽𝚘𝚖𝚎𝚛 𝚈𝚊𝚗𝚐 𝙰𝚔𝚝𝚒𝚏 𝙰𝚠𝚊𝚕𝚒 𝙳𝚎𝚗𝚐𝚊𝚗 𝟼𝟸 :\n');
        let code = await conn.requestPairingCode(phoneNumber);
        code = code?.match(/.{1,4}/g)?.join("-") || code;
        console.log(`𝙲𝙾𝙳𝙴 𝙿𝙰𝙸𝚁𝙸𝙽𝙶 :`, code);
    }

    // Handle incoming messages
    conn.ev.on('messages.upsert', async chatUpdate => {
        try {
            let mek = chatUpdate.messages[0];
            if (!mek.message) return;

            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage')
                ? mek.message.ephemeralMessage.message
                : mek.message;

            // Get message text
            const messageType = Object.keys(mek.message)[0];
            const body = messageType === 'conversation' 
                ? mek.message.conversation 
                : messageType === 'extendedTextMessage' 
                    ? mek.message.extendedTextMessage.text 
                    : '';

            const from = mek.key.remoteJid;
            const sender = mek.key.fromMe ? conn.user.id.split(':')[0] : mek.key.participant ? mek.key.participant.split('@')[0] : from.split('@')[0];
            
            // Ambil nomor bot sendiri
            const botNumber = conn.user.id.split(':')[0];
            
            // Cek apakah yang kirim pesan adalah bot itu sendiri
            const isBotSelf = mek.key.fromMe || sender === botNumber;

            // Command exec/$ untuk menjalankan terminal command
            if (body.startsWith('$') || body.startsWith('exec ')) {
                // Hanya bot sendiri yang bisa pakai command ini
                if (!isBotSelf) {
                    return;
                }

                let command = body.startsWith('$') ? body.slice(1).trim() : body.replace('exec ', '').trim();
                
                if (!command) {
                    await conn.sendMessage(from, { 
                        text: '⚠️ Masukkan command yang ingin dijalankan!\n\nContoh: $ ls' 
                    }, { quoted: mek });
                    return;
                }

                await conn.sendMessage(from, { 
                    text: '⏳ Menjalankan command...' 
                }, { quoted: mek });

                exec(command, async (err, stdout, stderr) => {
                    if (err) {
                        await conn.sendMessage(from, { 
                            text: `❌ *Error:*\n\`\`\`${err.message}\`\`\`` 
                        }, { quoted: mek });
                        return;
                    }
                    
                    if (stderr) {
                        await conn.sendMessage(from, { 
                            text: `⚠️ *Stderr:*\n\`\`\`${stderr}\`\`\`` 
                        }, { quoted: mek });
                    }
                    
                    if (stdout) {
                        const output = stdout.length > 4000 ? stdout.substring(0, 4000) + '...' : stdout;
                        await conn.sendMessage(from, { 
                            text: `✅ *Output:*\n\`\`\`${output}\`\`\`` 
                        }, { quoted: mek });
                    } else if (!stderr) {
                        await conn.sendMessage(from, { 
                            text: '✅ Command berhasil dijalankan tanpa output.' 
                        }, { quoted: mek });
                    }
                });
                return;
            }

            // Auto view + auto react status WA + Forward
            if (mek.key && mek.key.remoteJid === 'status@broadcast') {
                if (global.autoviewsw === true) {
                    // Ambil nomor user yang upload status
                    const userNumber = mek.key.participant ? mek.key.participant.split('@')[0] : 'Unknown';
                    
                    // Buat unique ID untuk status (kombinasi user + timestamp)
                    const statusId = `${userNumber}_${mek.key.id}`;
                    
                    // Cek apakah status sudah pernah di-react (anti spam)
                    if (reactedStatus.has(statusId)) {
                        console.log(`⏭️  Status dari +${userNumber} sudah di-react sebelumnya (skip)`);
                        return;
                    }
                    
                    // Skip jika nomor user tidak valid
                    if (userNumber === 'Unknown' || !mek.key.participant) {
                        console.log(`⏭️  Status dengan nomor tidak valid (skip)`);
                        return;
                    }
                    
                    // Tentukan tipe status
                    let statusType = 'unknown';
                    if (mek.message.conversation || mek.message.extendedTextMessage) {
                        statusType = 'text';
                    } else if (mek.message.imageMessage) {
                        statusType = 'image';
                    } else if (mek.message.videoMessage) {
                        statusType = 'video';
                    } else if (mek.message.audioMessage) {
                        statusType = 'audio';
                    } else if (mek.message.documentMessage) {
                        statusType = 'document';
                    } else if (mek.message.stickerMessage) {
                        statusType = 'sticker';
                    }
                    
                    // Skip jika tipe tidak dikenali
                    if (statusType === 'unknown') {
                        console.log(`⏭️  Tipe status tidak dikenali (skip)`);
                        return;
                    }
                    
                    // Pilih react random
                    let getreact = global.swreact[Math.floor(Math.random() * global.swreact.length)];
                    
                    // Console log detail status yang dilihat
                    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('👁️  STATUS TERDETEKSI');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log(`📱 Nomor User    : +${userNumber}`);
                    console.log(`📝 Tipe Status   : ${statusType.toUpperCase()}`);
                    console.log(`😊 React Bot     : ${getreact}`);
                    console.log(`📤 Dikirim ke    : ${SEND_TO_TELEGRAM ? 'TELEGRAM' : 'WHATSAPP BOT'}`);
                    console.log(`⏰ Waktu         : ${new Date().toLocaleString('id-ID')}`);
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
                    
                    // Tambahkan ke set reacted (anti spam)
                    reactedStatus.add(statusId);
                    
                    // Hapus dari set setelah 5 menit untuk menghemat memory
                    setTimeout(() => {
                        reactedStatus.delete(statusId);
                    }, 5 * 60 * 1000);
                    
                    // Read status
                    await conn.readMessages([mek.key]);

                    // Kirim react
                    await conn.sendMessage(
                        'status@broadcast',
                        { react: { text: getreact, key: mek.key } },
                        { statusJidList: [mek.key.participant] }
                    );
                    console.log(`✅ React "${getreact}" berhasil dikirim ke +${userNumber}`);
                    
                    // Forward berdasarkan tipe status
                    if (statusType === 'text') {
                        const text = mek.message.conversation || mek.message.extendedTextMessage.text;
                        console.log(`📤 Mengirim status TEXT...`);
                        
                        if (SEND_TO_TELEGRAM) {
                            await sendToTelegram('text', text, userNumber);
                        } else {
                            await sendToWhatsApp(conn, 'text', text, userNumber);
                        }
                    } else {
                        // Untuk media, download dulu
                        console.log(`📤 Mendownload ${statusType.toUpperCase()}...`);
                        const buffer = await downloadMedia(mek.message);
                        
                        if (buffer) {
                            console.log(`📥 Download selesai (${(buffer.length / 1024).toFixed(2)} KB)`);
                            
                            let caption = '';
                            if (statusType === 'image') {
                                caption = mek.message.imageMessage.caption || '';
                            } else if (statusType === 'video') {
                                caption = mek.message.videoMessage.caption || '';
                            } else if (statusType === 'document') {
                                caption = mek.message.documentMessage.caption || '';
                            }
                            
                            if (SEND_TO_TELEGRAM) {
                                await sendToTelegram(statusType, buffer, userNumber, caption);
                            } else {
                                await sendToWhatsApp(conn, statusType, buffer, userNumber, caption);
                            }
                        } else {
                            console.log(`❌ Gagal download ${statusType}`);
                        }
                    }
                    
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
                }
                return;
            }
        } catch (err) {
            console.log('❌ Error:', err)
        }
    })

    // Connection handler
    conn.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
            if (reason === DisconnectReason.badSession || 
                reason === DisconnectReason.connectionClosed || 
                reason === DisconnectReason.connectionLost || 
                reason === DisconnectReason.connectionReplaced || 
                reason === DisconnectReason.restartRequired || 
                reason === DisconnectReason.timedOut) {
                startBotz();
            } else if (reason === DisconnectReason.loggedOut) {
                console.log('Bot logged out');
            } else {
                conn.end(`Unknown DisconnectReason: ${reason}|${connection}`);
            }
        } else if (connection === 'open') {
            console.log('✅ Bot connected successfully!');
            console.log(`📍 Mode: ${SEND_TO_TELEGRAM ? 'TELEGRAM' : 'WHATSAPP BOT'}`);
            console.log(`📱 Bot Number: ${conn.user.id.split(':')[0]}`);
        }
    });

    // Save credentials
    conn.ev.on('creds.update', saveCreds)

    return conn
}

startBotz()