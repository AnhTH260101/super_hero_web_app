import { spawn } from 'child_process';
import net from 'net';

console.log('\x1b[36m%s\x1b[0m', '🚀 Đang chuẩn bị phiên bản Review siêu tốc cho Web Portal...');

// 1. Kiểm tra port 3000
const isPortInUse = (port) => {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', () => resolve(true))
      .once('listening', () => tester.once('close', () => resolve(false)).close())
      .listen(port);
  });
};

const portInUse = await isPortInUse(3000);

let nextProcess = null;
if (!portInUse) {
  console.log('\x1b[32m%s\x1b[0m', '⚡ Khởi động máy chủ Web (Production Mode)...');
  nextProcess = spawn('npx', ['next', 'start', '-p', '3000'], {
    stdio: 'inherit',
    env: process.env,
  });
} else {
  console.log('\x1b[33m%s\x1b[0m', 'ℹ️ Cổng 3000 đã có tiến trình chạy sẵn, sử dụng server hiện tại.');
}

// 2. Chờ 1.5 giây để server sẵn sàng rồi bật Cloudflare Tunnel
setTimeout(() => {
  console.log('\x1b[35m%s\x1b[0m', '🌐 Đang kết nối Cloudflare Tunnel để tạo link chia sẻ...');
  
  const tunnelProcess = spawn('npx', ['cloudflared', 'tunnel', '--url', 'http://localhost:3000'], {
    stdio: 'inherit',
    env: process.env,
  });

  const cleanup = () => {
    console.log('\n\x1b[31m%s\x1b[0m', '🛑 Đang đóng tiến trình và đóng đường link chia sẻ...');
    try {
      tunnelProcess.kill('SIGTERM');
      if (nextProcess) nextProcess.kill('SIGTERM');
    } catch {}
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}, 1500);
