import http from 'node:http';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export function replyFor(message) {
  if (!message?.chat?.id || message.from?.is_bot || typeof message.text !== 'string') return null;
  const command = /^\/(rntfight|fight|start)(?:@([a-z0-9_]+))?(?:\s|$)/i.exec(message.text);
  if (!command || (command[2] && command[2].toLowerCase() !== 'rntfightbot')) return null;
  return {
    chat_id: message.chat.id,
    ...(message.is_topic_message && message.message_thread_id ? { message_thread_id: message.message_thread_id } : {}),
    text: '🥊 RNT FIGHT\nChoose your fighter. Beat five CPU opponents.\nTap below to play!',
    reply_markup: { inline_keyboard: [[{ text: '🥊 Play RNT Fight', url: 'https://t.me/RNTFightBot?startapp' }]] }
  };
}

export async function start() {
  const token = process.env.BOT_TOKEN;
  const origin = process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_URL;
  if (!token || !origin?.startsWith('https://')) throw new Error('BOT_TOKEN and public HTTPS service URL are required');
  const secret = createHmac('sha256', token).update('rntfight-webhook-v1').digest('hex');
  async function api(method, payload) {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(15000)
    });
    const result = await response.json();
    if (!result.ok) throw new Error(`Telegram ${method} failed (${result.error_code || response.status})`);
    return result.result;
  }
  const completed = new Map();
  const pending = new Map();
  let ready = false;
  const server = http.createServer(async (req, res) => {
    if (req.method === 'GET' && req.url === '/health') { res.writeHead(ready ? 200 : 503); return res.end(ready ? 'ready' : 'starting'); }
    if (req.method !== 'POST' || req.url !== '/telegram') { res.writeHead(404); return res.end(); }
    const provided = Buffer.from(String(req.headers['x-telegram-bot-api-secret-token'] || ''));
    const expected = Buffer.from(secret);
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) { res.writeHead(403); return res.end(); }
    try {
      let body = '';
      for await (const chunk of req) { body += chunk; if (body.length > 262144) { res.writeHead(413); return res.end(); } }
      let update;
      try { update = JSON.parse(body); } catch { res.writeHead(400); return res.end(); }
      if (!Number.isInteger(update.update_id)) { res.writeHead(400); return res.end(); }
      const now = Date.now();
      for (const [id, time] of completed) if (now - time > 86400000) completed.delete(id);
      if (!completed.has(update.update_id)) {
        if (!pending.has(update.update_id)) {
          pending.set(update.update_id, (async () => {
            const reply = replyFor(update.message);
            if (reply) await api('sendMessage', reply);
            completed.set(update.update_id, now);
            if (completed.size > 10000) completed.delete(completed.keys().next().value);
          })());
        }
        try { await pending.get(update.update_id); } finally { pending.delete(update.update_id); }
      }
      res.writeHead(200); res.end('ok');
    } catch { console.error('Command delivery failed; Telegram may retry'); res.writeHead(503); res.end('retry'); }
  });
  await new Promise(resolve => server.listen(Number(process.env.PORT || 10000), '0.0.0.0', resolve));
  await api('setMyCommands', { commands: [{ command: 'rntfight', description: 'Play RNT Fight — five CPU rounds' }, { command: 'fight', description: 'Play RNT Fight' }] });
  await api('setWebhook', { url: `${origin.replace(/\/$/, '')}/telegram`, secret_token: secret, allowed_updates: ['message'], max_connections: 1 });
  ready = true;
  console.log('RNT Fight command service ready');
  return server;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) start().catch(() => { console.error('Bot setup failed. Check service configuration.'); process.exit(1); });
