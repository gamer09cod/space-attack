const fs=require('fs'), vm=require('vm'), assert=require('assert');
const handlers={}, draws=[];
const ctx=new Proxy({fillText:(text,x,y)=>draws.push({text,x,y}),
  fillRect:(x,y,width,height)=>draws.push({x,y,width,height})},
  {get:(o,k)=>o[k]||(()=>({addColorStop(){}})),set:(o,k,v)=>(o[k]=v,true)});
const sandbox={window:{addEventListener:(n,f)=>handlers[n]=f},
  document:{hidden:false,addEventListener:(n,f)=>handlers[n]=f,
    getElementById:()=>({width:900,height:600,getContext:()=>ctx})},requestAnimationFrame(){}};
vm.createContext(sandbox);
for(const file of ['audio.js','game.js'])vm.runInContext(fs.readFileSync('outputs/'+file,'utf8'),sandbox);
const run=code=>vm.runInContext(code,sandbox);
run(`function check(ok,msg){if(!ok)throw Error(msg);}
  updateFuel(50);check(player.fuel===MAX_FUEL && gameState===GameState.START,'START fuel');`);
for(const fps of [10,30,60,144]) {
  run(`startGame();invulnerabilityRemaining=1000;gameLoop(0);for(let i=1;i<=${fps*10};i++)gameLoop(i*1000/${fps});
    check(Math.abs(player.fuel-(MAX_FUEL-10*FUEL_DRAIN_RATE))<1e-8,'Frame independent fuel ${fps}');`);
}
run(`startGame();player.fuel=MAX_FUEL*0.68;renderScore();`);
assert(draws.some(d=>d.text==='68%'));
assert(draws.some(d=>d.x===460&&d.y===33&&Math.abs(d.width-112*0.68)<1e-8));
draws.length=0;
run(`player.fuel=MAX_FUEL*0.24;renderScore();`);
assert(draws.some(d=>d.text==='FUEL · LOW FUEL'));
run(`startGame();score=900;player.health=2;enemies.length=0;updateWaveProgression(0);
  previousTime=0;gameLoop(50);check(Math.abs(player.fuel-(MAX_FUEL-0.05*FUEL_DRAIN_RATE))<1e-8,'Wave break fuel');
  updateWaveProgression(1);check(score===900&&player.health===2&&wave===2&&player.fuel<MAX_FUEL,'Wave preserves fuel');
  startGame();score=1200;wave=4;player.fuel=0.01;pressedKeys.add('KeyD');firing=true;
  previousTime=0;const x=player.x;const enemyX=enemies[0].x;const fireTimer=enemyFireRemaining;
  gameLoop(50);check(player.fuel===0&&gameState===GameState.GAME_OVER&&gameOverReason==='OUT OF FUEL','Fuel death');
  check(player.x===x&&enemies[0].x===enemyX&&!bullets.length&&!enemyBullets.length&&enemyFireRemaining===fireTimer,'Immediate stop');
  check(!firing&&!pressedKeys.size&&score===1200&&wave===4,'Death preserves results');
  const health=player.health;damagePlayer();endGame('SHIP DESTROYED');updateFuel(500);gameLoop(1000);
  check(gameOverReason==='OUT OF FUEL'&&player.health===health&&player.fuel===0,'First reason wins and freezes');render();`);
assert(draws.some(d=>d.text==='OUT OF FUEL'));
for(let i=0;i<50;i++) {
  handlers.keydown({code:'KeyR',repeat:false,preventDefault(){}});
  run(`check(player.fuel===MAX_FUEL&&gameOverReason===''&&player.health===3&&wave===1&&score===0&&
    !bullets.length&&!enemyBullets.length&&enemies.length===7&&previousTime===null,'Fuel restart');
    if(${i}%2===0){player.health=1;invulnerabilityRemaining=0;damagePlayer();
      check(gameOverReason==='SHIP DESTROYED','Health reason');}
    else{updateFuel(MAX_FUEL/FUEL_DRAIN_RATE+1);check(gameOverReason==='OUT OF FUEL','Fuel reason');}`);
}
run(`startGame();player.health=1;damagePlayer();render();`);
assert(draws.some(d=>d.text==='SHIP DESTROYED'));
run(`startGame();previousTime=0;`);sandbox.document.hidden=true;run(`gameLoop(50000);`);
sandbox.document.hidden=false;run(`gameLoop(60000);check(player.fuel===MAX_FUEL,'Hidden tab fuel');`);
console.log('Passed fuel at 10/30/60/144 FPS, HUD bar/warning, wave carryover, immediate stop, reasons, 50 restarts, and hidden-tab checks.');
