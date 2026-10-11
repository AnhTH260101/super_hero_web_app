import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface DiscordMessage {
  id: string;
  content: string;
  timestamp: string;
  author: {
    username: string;
  };
}

interface ParsedGiftcode {
  code: string;
  rewards: string;
  expiration: string;
  status: 'active' | 'expired';
  serverNote: string;
}

// Regex nhận diện các dạng mã Giftcode thông dụng
const CODE_REGEX = /(?:code|giftcode|mã\s*quà|mã\s*code|nhập\s*code)?[:\s\-*`]*([A-Z0-9]{5,20})/gi;

function extractGiftcodesFromText(text: string): ParsedGiftcode[] {
  const lines = text.split('\n');
  const results: ParsedGiftcode[] = [];

  // Tìm code trong backtick `CODE` hoặc từ khóa
  const backtickMatches = text.match(/`([A-Za-z0-9_-]{5,25})`/g);
  const foundCodes = new Set<string>();

  if (backtickMatches) {
    for (const match of backtickMatches) {
      const code = match.replace(/`/g, '').trim().toUpperCase();
      if (code.length >= 5 && !code.includes('HTTP')) {
        foundCodes.add(code);
      }
    }
  }

  // Nếu không có backtick, tìm theo regex
  if (foundCodes.size === 0) {
    const rawMatches = text.matchAll(/[A-Z0-9]{6,20}/g);
    for (const m of rawMatches) {
      const candidate = m[0].toUpperCase();
      // Loại trừ các từ tiếng Anh hoặc từ không phải mã
      if (!['DISCORD', 'SERVER', 'UPDATE', 'GIFTCODE', 'ACTIVE', 'ADMIN'].includes(candidate)) {
        foundCodes.add(candidate);
      }
    }
  }

  for (const code of foundCodes) {
    // Trích xuất phần thưởng nếu có
    let rewards = 'Quà tặng sự kiện Discord';
    const rewardMatch = text.match(/(?:quà|phần thưởng|nhận|rewards?)[:\s\-*]+([^\n.,]+)/i);
    if (rewardMatch) {
      rewards = rewardMatch[1].trim();
    }

    // Trích xuất hạn sử dụng
    let expiration = 'Có hạn';
    const expMatch = text.match(/(?:hsd|hạn|hạn dùng|hết hạn|exp|deadline)[:\s\-*]+([^\n.,]+)/i);
    if (expMatch) {
      expiration = expMatch[1].trim();
    }

    results.push({
      code,
      rewards,
      expiration,
      status: 'active',
      serverNote: 'Tự động quét từ Discord',
    });
  }

  return results;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const gameSlug = body.gameSlug || 'sieu-anh-hung';
    const token = body.discordToken || process.env.DISCORD_USER_TOKEN;
    const channelId = body.channelId || process.env.DISCORD_GIFTCODE_CHANNEL_ID;

    if (!token || !channelId) {
      return NextResponse.json(
        {
          error:
            'Chưa cấu hình Discord Token hoặc Channel ID. Vui lòng cung cấp trong body hoặc file .env.local',
        },
        { status: 400 }
      );
    }

    // 1. Gọi Discord API để lấy tin nhắn mới nhất trong kênh
    const discordRes = await fetch(
      `https://discord.com/api/v9/channels/${channelId}/messages?limit=25`,
      {
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      }
    );

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      return NextResponse.json(
        {
          error: `Lỗi kết nối Discord API (${discordRes.status}): ${errText}`,
        },
        { status: discordRes.status }
      );
    }

    const messages: DiscordMessage[] = await discordRes.json();

    // 2. Phân tích tin nhắn để trích xuất giftcode
    const extractedCodes: ParsedGiftcode[] = [];
    for (const msg of messages) {
      if (!msg.content) continue;
      const codes = extractGiftcodesFromText(msg.content);
      extractedCodes.push(...codes);
    }

    // 3. Đọc giftcodes.json hiện tại
    const filePath = path.join(
      process.cwd(),
      'content',
      'games',
      gameSlug,
      'giftcodes.json'
    );
    let existingGiftcodes: ParsedGiftcode[] = [];
    if (fs.existsSync(filePath)) {
      try {
        existingGiftcodes = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (e) {
        existingGiftcodes = [];
      }
    }

    // 4. Đối chiếu và thêm các code mới (không trùng lặp mã code)
    const existingCodeSet = new Set(
      existingGiftcodes.map((g) => g.code.toUpperCase())
    );
    const newAddedCodes: ParsedGiftcode[] = [];

    for (const item of extractedCodes) {
      if (!existingCodeSet.has(item.code.toUpperCase())) {
        newAddedCodes.push(item);
        existingCodeSet.add(item.code.toUpperCase());
      }
    }

    if (newAddedCodes.length > 0) {
      // Đưa code mới lên đầu danh sách
      const updatedList = [...newAddedCodes, ...existingGiftcodes];
      fs.writeFileSync(filePath, JSON.stringify(updatedList, null, 2), 'utf8');
    }

    return NextResponse.json({
      success: true,
      scannedMessagesCount: messages.length,
      newAddedCount: newAddedCodes.length,
      newCodes: newAddedCodes,
      totalCodes: existingGiftcodes.length + newAddedCodes.length,
      message:
        newAddedCodes.length > 0
          ? `Đã tìm thấy và thêm ${newAddedCodes.length} giftcode mới từ Discord!`
          : 'Không có giftcode mới nào (các mã trên kênh đã được lưu trước đó).',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
