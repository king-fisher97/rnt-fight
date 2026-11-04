import { test } from 'node:test';
import assert from 'node:assert/strict';
import { replyFor, callbackFor } from './bot-server.mjs';
const message = text => ({chat:{id:-123},from:{is_bot:false},text});
test('commands work with mixed case and group addressing', () => {
  for (const text of ['/rntfight','/RntFight','/fight','/rntfight@RNTFightBot','/start']) {
    const reply = replyFor(message(text));
    assert.equal(reply.chat_id,-123);
    assert.equal(reply.game_short_name, 'RNTfighter');
    assert.equal(reply.reply_markup, undefined);
  }
});
test('ignores unrelated commands, ordinary messages and bot traffic', () => {
  for (const text of ['/rntfighter','hello /rntfight','/fight@OtherBot','hello']) assert.equal(replyFor(message(text)),null);
  assert.equal(replyFor({...message('/fight'),from:{is_bot:true}}),null);
});
test('replies stay in the group topic', () => {
  assert.equal(replyFor({...message('/rntfight'),is_topic_message:true,message_thread_id:42}).message_thread_id,42);
});

test('only the registered game callback opens the hosted game', () => {
  assert.deepEqual(callbackFor({id:'q1',game_short_name:'RNTfighter'}), {callback_query_id:'q1',url:'https://king-fisher97.github.io/rnt-fight/',cache_time:0});
  assert.equal(callbackFor({id:'q2',game_short_name:'other'}),null);
  assert.equal(callbackFor({id:'q3',data:'fake'}),null);
});
