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
  const processedCodes = new Set<string>();

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Định dạng 1: DoanTriet10cm 30B gift Code : DoanTriet30B (15/10)
    const codeColonMatch = line.match(/(?:code|mã)\s*[:=]\s*([A-Za-z0-9_-]+)(?:\s*\(([^)]+)\))?/i);
    if (codeColonMatch) {
      const code = codeColonMatch[1].trim();
      const expiration = codeColonMatch[2] ? codeColonMatch[2].trim() : 'Có hạn';
      const giftMatch = line.match(/(\d+[A-Za-z]+\s*gift)/i);
      const rewards = giftMatch ? giftMatch[1].trim() : 'Quà tặng sự kiện Discord';

      if (!processedCodes.has(code.toUpperCase())) {
        processedCodes.add(code.toUpperCase());
        results.push({
          code,
          rewards,
          expiration,
          status: 'active',
          serverNote: 'Tự động quét từ Discord',
        });
      }
      continue;
    }

    // Định dạng 2: Meliodas0310 (02/10) hoặc MeliodasGo (03/10)
    const dateSuffixMatch = line.match(/^([A-Za-z0-9_-]{4,25})\s*\(([^)]+)\)$/);
    if (dateSuffixMatch) {
      const code = dateSuffixMatch[1].trim();
      const expiration = dateSuffixMatch[2].trim();

      if (!processedCodes.has(code.toUpperCase())) {
        processedCodes.add(code.toUpperCase());
        results.push({
          code,
          rewards: 'Quà tặng sự kiện Discord',
          expiration,
          status: 'active',
          serverNote: 'Tự động quét từ Discord',
        });
      }
      continue;
    }

    // Định dạng 3: Code trong backticks `CODE`
    const backticks = line.match(/`([A-Za-z0-9_-]{5,25})`/g);
    if (backticks) {
      for (const b of backticks) {
        const code = b.replace(/`/g, '').trim();
        if (!processedCodes.has(code.toUpperCase())) {
          processedCodes.add(code.toUpperCase());
          results.push({
            code,
            rewards: 'Quà tặng sự kiện Discord',
            expiration: 'Có hạn',
            status: 'active',
            serverNote: 'Tự động quét từ Discord',
          });
        }
      }
    }
  }

  return results;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameSlug = searchParams.get('gameSlug') || 'sieu-anh-hung';
    const configPath = path.join(process.cwd(), 'content', 'games', gameSlug, 'discord_config.json');

    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return NextResponse.json({
        success: true,
        discordToken: config.discordToken || '',
        channelId: config.channelId || '',
      });
    }

    return NextResponse.json({
      success: true,
      discordToken: process.env.DISCORD_USER_TOKEN || '',
      channelId: process.env.DISCORD_GIFTCODE_CHANNEL_ID || '',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const gameSlug = body.gameSlug || 'sieu-anh-hung';
    const configPath = path.join(process.cwd(), 'content', 'games', gameSlug, 'discord_config.json');

    // Nếu là action lưu cấu hình Discord
    if (body.action === 'save_config') {
      const configData = {
        discordToken: (body.discordToken || '').trim(),
        channelId: (body.channelId || '').trim(),
        updatedAt: new Date().toISOString(),
      };
      fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');
      return NextResponse.json({
        success: true,
        message: 'Đã lưu cấu hình Discord thành công trên máy chủ!',
      });
    }

    // Đọc cấu hình từ file discord_config.json trước nếu có
    let savedToken = '';
    let savedChannelId = '';
    if (fs.existsSync(configPath)) {
      try {
        const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        savedToken = cfg.discordToken || '';
        savedChannelId = cfg.channelId || '';
      } catch (e) {}
    }

    const token = body.discordToken?.trim() || savedToken || process.env.DISCORD_USER_TOKEN;
    const channelId = body.channelId?.trim() || savedChannelId || process.env.DISCORD_GIFTCODE_CHANNEL_ID;

    if (!token || !channelId) {
      return NextResponse.json(
        {
          error:
            'Chưa cấu hình Discord Token hoặc Channel ID. Vui lòng bấm "⚙️ Cấu Hình Kênh" để lưu Token & Channel ID!',
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
