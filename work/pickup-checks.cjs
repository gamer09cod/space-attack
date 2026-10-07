const fs=require('fs'),vm=require('vm'),assert=require('assert');
const handlers={},labels=[];
let depth=0;
const ctx=new Proxy({fillText:t=>labels.push(t),save:()=>depth++,restore:()=>depth--},
  {get:(o,k)=>o[k]||(()=>({addColorStop(){}})),set:(o,k,v)=>(o[k]=v,true)});
const sandbox={window:{addEventListener:(n,f)=>handlers[n]=f},document:{hidden:false,
  addEventListener(){},getElementById:()=>({width:900,height:600,getContext:()=>ctx})},requestAnimationFrame(){}};
vm.createContext(sandbox);
for(const file of ['audio.js','game.js'])vm.runInContext(fs.readFileSync('outputs/'+file,'utf8'),sandbox);
const run=code=>vm.runInContext(code,sandbox);
run(`function check(ok,msg){if(!ok)throw Error(msg);}
  const originalRandom=Math.random;
  startGame();Math.random=()=>0.1;
  const enemy=enemies[0];bullets.push({x:enemy.x,y:enemy.y});checkBulletEnemyCollisions();
  check(fuelPickups.length===1&&score===100&&enemies.length===6&&!bullets.length,'Drop and combat');
  check(fuelPickups[0] instanceof FuelPickup && fuelPickups[0].active &&
    fuelPickups[0].fallSpeed===FUEL_PICKUP_SPEED,'Entity');
  Math.random=()=>0.9;bullets.push({x:enemies[0].x,y:enemies[0].y});checkBulletEnemyCollisions();
  check(fuelPickups.length===1&&score===200&&enemies.length===5,'No guaranteed drop');
  Math.random=()=>FUEL_DROP_CHANCE;bullets.push({x:enemies[0].x,y:enemies[0].y});checkBulletEnemyCollisions();
  check(fuelPickups.length===1,'Threshold exclusive');Math.random=originalRandom;
  const pickupY=fuelPickups[0].y;updateFuelPickups(0.1);
  check(Math.abs(fuelPickups[0].y-pickupY-10)<1e-9,'Delta time fall');
  fuelPickups.push(new FuelPickup(1,700),new FuelPickup(2,710));updateFuelPickups(0);
  check(fuelPickups.length===1,'Reverse cleanup');
  fuelPickups.length=0;player.fuel=42;
  const collected=new FuelPickup(player.x,player.y);fuelPickups.push(collected);
  updateFuelPickups(0);check(player.fuel===67&&!collected.active&&!fuelPickups.length,'Collection');
  check(particles.length>0&&fuelGlowRemaining===0.5&&scorePopups.some(p=>p.text==='+25 FUEL'),'Feedback');render();
  player.fuel=92;fuelPickups.push(new FuelPickup(player.x,player.y));updateFuelPickups(0);
  check(player.fuel===MAX_FUEL&&scorePopups.some(p=>p.text==='+8 FUEL'),'Clamp and actual feedback');
  fuelPickups.push(new FuelPickup(player.x,player.y));updateFuelPickups(0);
  check(player.fuel===MAX_FUEL&&scorePopups.some(p=>p.text==='FUEL FULL'),'Full fuel');
  updateEffects(1);check(!particles.length&&!scorePopups.length&&!fuelGlowRemaining,'Feedback cleanup');
  player.fuel=10;for(let i=0;i<4;i++)fuelPickups.push(new FuelPickup(player.x,player.y));
  updateFuelPickups(0);check(player.fuel===MAX_FUEL&&!fuelPickups.length,'Multiple collection safely');
  startGame();fuelPickups.push(new FuelPickup(100,100));enemies.length=0;updateWaveProgression(0);
  updateFuelPickups(0.5);updateWaveProgression(1);
  check(wave===2&&fuelPickups.length===1&&fuelPickups[0].y===150,'Wave persistence');
  player.fuel=42;fuelPickups[0].x=player.x;fuelPickups[0].y=player.y;endGame('SHIP DESTROYED');
  const frozenY=fuelPickups[0].y;updateFuelPickups(1);gameLoop(1000);
  check(player.fuel===42&&fuelPickups.length===1&&fuelPickups[0].y===frozenY,'Game-over gating');`);
handlers.keydown({code:'KeyR',repeat:false,preventDefault(){}});
run(`check(!fuelPickups.length&&!fuelGlowRemaining&&player.fuel===MAX_FUEL,'Restart pickup reset');
  Math.random=()=>0;for(let i=0;i<MAX_FUEL_PICKUPS+10;i++){
    enemies.length=0;enemies.push(new Enemy(100,100));bullets.push({x:100,y:100});checkBulletEnemyCollisions();}
  check(fuelPickups.length===MAX_FUEL_PICKUPS,'Pickup cap');Math.random=originalRandom;
  startGame();player.fuel=42;fuelPickups.push(new FuelPickup(player.x,player.y-20));
  previousTime=0;gameLoop(50);check(!fuelPickups.length&&Math.abs(player.fuel-66.95)<1e-8,'Real-loop integration');
  render();`);
assert(labels.includes('67%'));assert(labels.includes('+25 FUEL'));assert.equal(depth,0);
console.log('Passed deterministic drop/no-drop, fall, offscreen cleanup, collection/clamp, feedback, waves, game-over, restart, cap, HUD, and combat checks.');
