#!/usr/bin/env node
/**
 * Script quét Giftcode từ Discord Server và cập nhật tự động vào content/games/sieu-anh-hung/giftcodes.json
 * Cách chạy:
 *   node scripts/sync_discord_giftcodes.js
 * Hoặc thiết lập cronjob định kỳ 30 phút một lần.
 */

const fs = require('fs');
const path = require('path');

// Đọc cấu hình từ file .env.local nếu có
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
    }
  });
}

const DISCORD_TOKEN = process.env.DISCORD_USER_TOKEN;
const CHANNEL_ID = process.env.DISCORD_GIFTCODE_CHANNEL_ID;
const GAME_SLUG = process.env.GAME_SLUG || 'sieu-anh-hung';

if (!DISCORD_TOKEN || !CHANNEL_ID) {
  console.error('\n❌ LỖI: Chưa cấu hình DISCORD_USER_TOKEN hoặc DISCORD_GIFTCODE_CHANNEL_ID.');
  console.log('👉 Vui lòng thêm vào file .env.local:');
  console.log('   DISCORD_USER_TOKEN=your_token_here');
  console.log('   DISCORD_GIFTCODE_CHANNEL_ID=your_channel_id_here\n');
  process.exit(1);
}

async function syncGiftcodes() {
  console.log(`\n🔄 Đang kết nối tới kênh Discord [${CHANNEL_ID}]...`);

  try {
    const res = await fetch(`https://discord.com/api/v9/channels/${CHANNEL_ID}/messages?limit=25`, {
      headers: {
        Authorization: DISCORD_TOKEN,
        'Content-Type': 'application/json',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`❌ Discord API báo lỗi (${res.status}):`, err);
      process.exit(1);
    }

    const messages = await res.json();
    console.log(`📬 Đã tải về ${messages.length} tin nhắn gần nhất.`);

    const foundCodes = [];

    for (const msg of messages) {
      const text = msg.content || '';
      const lines = text.split('\n');

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        // Định dạng: Code : <CODE> (15/10)
        const codeColonMatch = line.match(/(?:code|mã)\s*[:=]\s*([A-Za-z0-9_-]+)(?:\s*\(([^)]+)\))?/i);
        if (codeColonMatch) {
          const code = codeColonMatch[1].trim();
          const expiration = codeColonMatch[2] ? codeColonMatch[2].trim() : 'Có hạn';
          const giftMatch = line.match(/(\d+[A-Za-z]+\s*gift)/i);
          const rewards = giftMatch ? giftMatch[1].trim() : 'Quà tặng sự kiện Discord';

          foundCodes.push({
            code,
            rewards,
            expiration,
            status: 'active',
            serverNote: 'Tự động quét từ Discord',
          });
          continue;
        }

        // Định dạng: Meliodas0310 (02/10)
        const dateSuffixMatch = line.match(/^([A-Za-z0-9_-]{4,25})\s*\(([^)]+)\)$/);
        if (dateSuffixMatch) {
          foundCodes.push({
            code: dateSuffixMatch[1].trim(),
            rewards: 'Quà tặng sự kiện Discord',
            expiration: dateSuffixMatch[2].trim(),
            status: 'active',
            serverNote: 'Tự động quét từ Discord',
          });
          continue;
        }

        // Định dạng backtick `CODE`
        const backticks = line.match(/`([A-Za-z0-9_-]{5,25})`/g);
        if (backticks) {
          for (const b of backticks) {
            foundCodes.push({
              code: b.replace(/`/g, '').trim(),
              rewards: 'Quà tặng sự kiện Discord',
              expiration: 'Có hạn',
              status: 'active',
              serverNote: 'Tự động quét từ Discord',
            });
          }
        }
      }
    }

    const targetJson = path.join(__dirname, '..', 'content', 'games', GAME_SLUG, 'giftcodes.json');
    let existingList = [];
    if (fs.existsSync(targetJson)) {
      existingList = JSON.parse(fs.readFileSync(targetJson, 'utf8'));
    }

    const existingSet = new Set(existingList.map((g) => g.code.toUpperCase()));
    const newItems = [];

    for (const item of foundCodes) {
      if (!existingSet.has(item.code.toUpperCase())) {
        newItems.push(item);
        existingSet.add(item.code.toUpperCase());
      }
    }

    if (newItems.length > 0) {
      const updated = [...newItems, ...existingList];
      fs.writeFileSync(targetJson, JSON.stringify(updated, null, 2), 'utf8');
      console.log(`\n🎉 THÀNH CÔNG! Đã thêm ${newItems.length} code mới vào web portal:`);
      newItems.forEach((c) => console.log(`   🎁 Mã: ${c.code} | Quà: ${c.rewards}`));
    } else {
      console.log('\n✅ Không có code mới. Tất cả các mã trên kênh đều đã được lưu trước đó.');
    }
  } catch (error) {
    console.error('❌ Lỗi thực thi:', error);
  }
}

syncGiftcodes();
