const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
function environment(AudioContext) {
  const listeners = {};
  let frames = 0, depth = 0;
  const context = new Proxy({
    save() { depth++; }, restore() { assert(--depth >= 0); }
  }, { get: (o, k) => o[k] || (() => ({ addColorStop() {} })), set: (o,k,v) => (o[k]=v,true) });
  const add = (target, name, fn) => (listeners[target + name] ||= []).push(fn);
  const sandbox = { console, window: { AudioContext, addEventListener: (n,f) => add('w',n,f) },
    document: { hidden: false, addEventListener: (n,f) => add('d',n,f),
      getElementById: () => ({width:900,height:600,getContext:()=>context}) },
    requestAnimationFrame() { frames++; } };
  vm.createContext(sandbox);
  for (const file of ['audio.js','game.js']) vm.runInContext(fs.readFileSync('outputs/'+file,'utf8'), sandbox);
  return { sandbox, run: code => vm.runInContext(code, sandbox), listeners,
    event: (target,n,e={}) => listeners[target+n].forEach(fn=>fn(e)),
    key: code => listeners.wkeydown[0]({code,repeat:false,preventDefault(){}}),
    frames:()=>frames, depth:()=>depth };
}
const env = environment();
const {run} = env;
run(`
  function check(ok, message) { if (!ok) throw Error(message); }
  check(gameState === GameState.START, 'Fresh page');
  gameLoop(0); gameLoop(50);
  check(enemies.length === 0 && bullets.length === 0, 'START gating');
  startGame(); enemies.length=0;
  enemies.push(new Enemy(100,100),new Enemy(100,100));
  bullets.push({x:100,y:100}); checkBulletEnemyCollisions();
  check(score===100 && bullets.length===0 && enemies.length===1, 'One bullet one enemy');
  bullets.push({x:100,y:100},{x:100,y:100});checkBulletEnemyCollisions();
  check(score===200 && bullets.length===1 && enemies.length===0, 'One enemy scored once');
  startGame();
  for (const enemy of enemies) bullets.push({x:enemy.x,y:enemy.y});
  checkBulletEnemyCollisions();
  check(enemies.length===0 && bullets.length===0 && score===700, 'No mutation skips');
  enemyBullets.push({x:player.x,y:player.y},{x:player.x,y:player.y});checkPlayerCollisions();
  check(player.health===2 && enemyBullets.length===0, 'Overlapping damage');
  updateWaveProgression(0);updateWaveProgression(0.99);
  check(wave===1 && enemies.length===0, 'Wave delay');updateWaveProgression(0.01);
  check(wave===2 && enemies.length===9 && score===700 && player.health===2, 'Wave carryover');
  bullets.push({x:1,y:-50},{x:2,y:-60});updateBullets(0);
  enemyBullets.push({x:1,y:650},{x:2,y:660});updateEnemyBullets(0);
  check(!bullets.length && !enemyBullets.length, 'Offscreen bullet cleanup');
  for(const enemy of enemies) enemy.y=700;
  updateEnemies(0);updateWaveProgression(0);
  check(enemies.length===0 && waveTransitionRemaining===1 && score===700, 'Offscreen enemy cleanup');
  startGame();firing=true;updateShooting(0);updateShooting(0.1);
  check(bullets.length===1, 'Fire cooldown');updateShooting(0.15);
  check(bullets.length===2, 'Held fire');updateShooting(100);
  check(bullets.length===3, 'No catch-up firing burst');
  startGame();player.health=1;damagePlayer();
  const frozenTimer=enemyFireRemaining;
  previousTime=0;for(let i=1;i<=100;i++)gameLoop(i*50);
  check(gameState===GameState.GAME_OVER && enemyBullets.length===0 && enemyFireRemaining===frozenTimer, 'Game over firing');
`);
const initialListeners = Object.values(env.listeners).reduce((n,a)=>n+a.length,0);
const initialFrames = env.frames();
for(let i=0;i<100;i++) {
  run(`score=500;wave=20;cooldownRemaining=0.2;enemyFireRemaining=0.1;
    particles.push({life:0.1,maxLife:0.1,x:1,y:1,vx:1,vy:1,size:2});
    scorePopups.push({life:0.1,x:1,y:1});
    bullets.push({x:1,y:1});enemyBullets.push({x:1,y:1});
    gameState=GameState.GAME_OVER;`);
  env.key('KeyR');
  run(`check(gameState===GameState.PLAYING && score===0 && wave===1 && player.health===3 &&
    player.x===450 && player.y===552 && !bullets.length && !enemyBullets.length && enemies.length===7 &&
    !particles.length && !scorePopups.length && !pressedKeys.size && !firing && previousTime===null &&
    cooldownRemaining===0 && enemyFireRemaining===1.4 && invulnerabilityRemaining===0 &&
    waveTransitionRemaining===null && enemies.every(e=>e.elapsedTime===0), 'Complete restart');`);
}
assert.equal(env.frames(),initialFrames,'Restart must not launch new loops');
assert.equal(Object.values(env.listeners).reduce((n,a)=>n+a.length,0),initialListeners);
for(const list of Object.values(env.listeners)) assert.equal(list.length,1,'Duplicate listener');
env.sandbox.document.hidden=true;
run(`firing=true;previousTime=0;gameLoop(10000);check(previousTime===null && !bullets.length,'Hidden frame');`);
env.sandbox.document.hidden=false;
run(`gameLoop(20000);check(bullets.length===1 && bullets[0].y===player.y-20,'Return delta time');`);
env.event('w','blur');run(`check(previousTime===null && !firing && !pressedKeys.size,'Blur cleanup');`);
run(`startGame();pressedKeys.add('KeyD');firing=true;gameLoop(0);gameLoop(50);
  check(Math.abs(player.x-465)<0.001 && bullets.length===1,'Movement and firing');
  for(let i=0;i<50;i++)burstParticles(1,1,'#fff',24);
  check(particles.length===180,'Particle cap');updateEffects(2);
  check(!particles.length && !scorePopups.length,'Effects expire');render();`);
assert.equal(env.depth(),0,'Canvas state leak');
// Simulate real asynchronous onended callbacks: reset must free slots immediately.
const param=()=>({setValueAtTime(){},exponentialRampToValueAtTime(){},linearRampToValueAtTime(){},setTargetAtTime(){}});
class AudioContext {
  constructor(){this.state='running';this.currentTime=0;this.destination={};}
  createGain(){return {gain:param(),connect(){},disconnect(){}};}
  createOscillator(){return {frequency:param(),connect(){},disconnect(){},start(){},stop(){}};}
  resume(){return Promise.resolve();}suspend(){return Promise.resolve();}
}
const audioEnv=environment(AudioContext);
audioEnv.run(`arcadeAudio.unlock();for(let i=0;i<100;i++)arcadeAudio.play('fire');
  checkAudio(arcadeAudio.voices.size===24,'Voice cap');
  function checkAudio(ok,msg){if(!ok)throw Error(msg);}
  const oldVoices=Array.from(arcadeAudio.voices);arcadeAudio.reset();
  checkAudio(arcadeAudio.voices.size===0,'Immediate voice reset');arcadeAudio.play('wave');
  for(const voice of oldVoices)voice.onended();
  checkAudio(arcadeAudio.voices.size===4,'Old cleanup cannot remove new voices');
  for(const voice of Array.from(arcadeAudio.voices))voice.onended();
  checkAudio(!arcadeAudio.voices.size,'Audio memory cleanup');`);
class FailedAudioContext extends AudioContext { createGain(){throw Error('Audio device failure');} }
const failed=environment(FailedAudioContext);
failed.key('Enter');failed.run(`render();arcadeAudio.play('fire');gameLoop(0);`);
console.log('Passed collision mutation, 100 restarts, listener/loop counts, timers, state gating, cleanup, memory caps, delta time, and audio failure checks.');
