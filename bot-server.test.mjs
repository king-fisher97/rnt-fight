import { test } from 'node:test';
import assert from 'node:assert/strict';
import { replyFor } from './bot-server.mjs';
const message = text => ({chat:{id:-123},from:{is_bot:false},text});
test('commands work with mixed case and group addressing', () => {
  for (const text of ['/rntfight','/RntFight','/fight','/rntfight@RNTFightBot','/start']) {
    const reply = replyFor(message(text));
    assert.equal(reply.chat_id,-123);
    assert.equal(reply.reply_markup.inline_keyboard[0][0].url,'https://t.me/RNTFightBot?startapp');
  }
});
test('ignores unrelated commands, ordinary messages and bot traffic', () => {
  for (const text of ['/rntfighter','hello /rntfight','/fight@OtherBot','hello']) assert.equal(replyFor(message(text)),null);
  assert.equal(replyFor({...message('/fight'),from:{is_bot:true}}),null);
});
test('replies stay in the group topic', () => {
  assert.equal(replyFor({...message('/rntfight'),is_topic_message:true,message_thread_id:42}).message_thread_id,42);
});
