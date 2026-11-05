export function createRntClient(engine) {
  const $=id=>document.getElementById(id);
  let socket, active=false, running=false, finished=false, slot=0, nextInput=0, config={}, roomId='', lastFrameAt=0;
  const frames=new Map(), hashes=new Map();
  const tg=window.Telegram?.WebApp;
  let roster=[];
  const say=text=>{ $('lobbyStatus').textContent=text; $('roomStatus').textContent=text; };
  const send=msg=>{ if(socket?.readyState===WebSocket.OPEN)socket.send(JSON.stringify(msg)); };
  function finish(reason) {
    finished=true;running=false; // active stays true so a disconnected online fight never becomes a CPU match.
    say(reason+' · Return to lobby for another challenge.');
    $('roomStatus').hidden=false;
    $('leaveRoom').hidden=false;
  }
  function parseRoom(value) {
    let code=value.trim();
    try { const url=new URL(code);code=url.searchParams.get('room')||url.searchParams.get('startapp')||''; } catch {}
    code=code.replace(/^fight_/,'');
    if(!/^[a-f0-9]{24}$/.test(code))throw new Error('Enter a valid challenge code or invitation link.');
    return code;
  }
  async function connect(value) {
    if(socket)throw new Error('Already in a challenge. Return to lobby to leave it.');
    roomId=parseRoom(value);active=true;
    $('createRoom').disabled=true; $('joinRoom').disabled=true; $('start').disabled=true;
    $('roomStatus').hidden=false; $('leaveRoom').hidden=false;
    say('Connecting to challenge…');
    socket=new WebSocket(`${location.protocol==='https:'?'wss:':'ws:'}//${location.host}/ws/rnt`);
    socket.onopen=()=>send({type:'join',roomId,initData:tg?.initData||'',character:$('character').value,fingerprint:'rnt-v1:'+engine.fingerprint()});
    socket.onmessage=event=>{
      let m;try{m=JSON.parse(event.data);}catch{return finish('Invalid server response');}
      if(m.type==='joined'){
        slot=m.slot;say('Waiting for your opponent · You are player '+(slot+1));
        $('invite').hidden=false;
        $('inviteLink').value=config.devMode?`${location.origin}/?room=${roomId}`:`https://t.me/${config.botUsername}?startapp=fight_${roomId}`;
      }
      if(m.type==='paired'){
        slot=m.slot;engine.setCharacters(m.characters);
        $('selectedMatch').textContent=m.characters.map(id=>roster.find(f=>f.id===id)?.name||id).join(' VS ');
        send({type:'ready'});
      }
      if(m.type==='start'){
        frames.clear();hashes.clear();nextInput=0;running=true;lastFrameAt=performance.now();engine.begin();
        say('LIVE 1v1 · Player '+(slot+1));
        // Six frames of fixed delay, then advance only with both confirmed inputs.
        for(let i=0;i<6;i++)send({type:'input',frame:nextInput++,mask:0});
      }
      if(m.type==='frame')frames.set(m.frame,m.inputs);
      if(m.type==='error'||m.type==='ended'){finish(m.message||m.reason);socket.close();}
    };
    socket.onerror=()=>finish('Connection failed');
    socket.onclose=()=>{if(active&&!finished)finish('Opponent or server disconnected');};
  }
  function action(fn){return async()=>{try{await fn();}catch(e){say(e.message);}};}
  return {
    get active(){return active;},get running(){return running;},get slot(){return slot;},
    get recentHashes(){return Object.fromEntries(hashes);},
    step(){
      if(!running)return;
      const frame=engine.frame(), input=frames.get(frame);
      if(!input){if(performance.now()-lastFrameAt>2000)say('Waiting for connection · Match paused');return;}
      frames.delete(frame);lastFrameAt=performance.now();
      engine.simulate(input[0],input[1]);
      const at=engine.frame();
      if(at%60===0){const hash=engine.hash();hashes.set(at,hash);if(hashes.size>60)hashes.delete(hashes.keys().next().value);send({type:'hash',frame:at,hash});}
      if(engine.phase()==='matchEnd'){finish('Match complete');return;}
      send({type:'input',frame:nextInput++,mask:engine.input()});
    },
    async init(){
      tg?.ready();tg?.expand();
      if(tg?.isVersionAtLeast?.('7.7'))tg.disableVerticalSwipes();
      const updateSafe=()=>{
        const safe=tg?.contentSafeAreaInset||tg?.safeAreaInset||{};
        document.documentElement.style.setProperty('--tg-safe-top',(safe.top||0)+'px');
        document.documentElement.style.setProperty('--tg-safe-bottom',(safe.bottom||0)+'px');
      };
      updateSafe();tg?.onEvent('contentSafeAreaChanged',updateSafe);
      const registry=await (await fetch('/data/roster.json')).json();
      roster=registry.fighters;
      const buttons=document.querySelector('.roster-buttons');buttons.replaceChildren();
      for(const fighter of roster){
        const o=document.createElement('option');o.value=fighter.id;o.textContent=fighter.name;$('character').append(o);
        const b=document.createElement('button');b.dataset.fighter=fighter.id;b.textContent=fighter.name;
        b.onclick=()=>{$('character').value=fighter.id;$('character').dispatchEvent(new Event('change'));};buttons.append(b);
      }
      $('character').onchange=()=>{document.querySelectorAll('[data-fighter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.fighter===$('character').value)));};
      $('character').dispatchEvent(new Event('change'));
      try{const res=await fetch('/api/config');if(!res.ok)throw new Error();config=await res.json();}catch{say('Server unavailable. Practice is still available.');$('createRoom').disabled=true;return;}
      $('createRoom').onclick=action(async()=>{
        if(!config.devMode){say('Type /fight in your Telegram group to create a challenge.');return;}
        const res=await fetch('/api/rooms',{method:'POST'});const result=await res.json();if(!res.ok)throw new Error(result.error||'Unable to create room');await connect(result.roomId);
      });
      $('joinRoom').onclick=action(()=>connect($('roomCode').value));
      $('copyInvite').onclick=action(async()=>{await navigator.clipboard.writeText($('inviteLink').value);say('Invite copied. Open it in another browser or send it to your opponent.');});
      $('leaveRoom').onclick=()=>{socket?.close();location.assign(location.pathname);};
      const start=tg?.initDataUnsafe?.start_param||new URLSearchParams(location.search).get('tgWebAppStartParam')||new URLSearchParams(location.search).get('room');
      say(config.devMode?'Local preview · Create a challenge, then open its link in another browser.':'Create a challenge with /fight in your Telegram group.');
      if(start){$('roomCode').value=start;say('Challenge ready · Choose your fighter, then tap JOIN.');}
    }
  };
}
