const fs=require('fs'),vm=require('vm'),assert=require('assert');
const h={};let depth=0;
const ctx=new Proxy({save:()=>depth++,restore:()=>depth--},{get:(o,k)=>o[k]||(()=>({addColorStop(){}})),set:(o,k,v)=>(o[k]=v,true)});
const s={window:{addEventListener:(n,f)=>h[n]=f},document:{hidden:false,addEventListener(){},
  getElementById:()=>({width:900,height:600,getContext:()=>ctx})},requestAnimationFrame(){}};
vm.createContext(s);for(const file of ['audio.js','game.js'])vm.runInContext(fs.readFileSync('outputs/'+file,'utf8'),s);
const run=c=>vm.runInContext(c,s);
run(`function check(ok,msg){if(!ok)throw Error(msg);}
  const oldRandom=Math.random;let randomIndex=0;Math.random=()=>[0.1,0.4,0.8,0.6,0.2,0.9][randomIndex++%6];
  startGame();check(enemies.length===7,'Spawn');
  for(let i=0;i<7;i++)check(enemies[i].x===210+i*80&&enemies[i].y===80,'Aligned formation');
  check(new Set(enemies.map(e=>e.phaseOffset)).size>1&&new Set(enemies.map(e=>e.zigzagAmplitude)).size>1&&
    new Set(enemies.map(e=>e.zigzagFrequency)).size>1,'Variation');
  const original=enemies[0];original.diving=true;const initialY=original.y;original.update(0.1);
  check(Math.abs(original.y-initialY-original.downSpeed*0.1)<1e-8,'Descent');
  check(Math.abs(original.x-(original.baseX+Math.sin(original.elapsedTime*original.zigzagFrequency+original.phaseOffset)*original.zigzagAmplitude))<1e-8,'Analytic movement');
  const shared={baseX:450,phaseOffset:0.3,zigzagAmplitude:35,zigzagFrequency:1.5,downSpeed:80,diving:true};
  const a=new Enemy(450,80),b=new Enemy(450,80);Object.assign(a,shared);Object.assign(b,shared);
  for(let i=0;i<600;i++)a.update(1/60);for(let i=0;i<300;i++)b.update(1/30);
  check(Math.abs(a.x-b.x)<1e-8&&Math.abs(a.y-b.y)<1e-8,'Frame independence');
  const probe=new Enemy(450,80);Object.assign(probe,shared);probe.update(0);let minX=Infinity,maxX=-Infinity;
  for(let i=0;i<1200;i++){const before=probe.x;probe.update(1/120);
    check(Math.abs(probe.x-before)<0.5,'Smoothness');minX=Math.min(minX,probe.x);maxX=Math.max(maxX,probe.x);}
  check(minX<420&&maxX>480,'Left-right oscillation without drift');
  for(const w of [1,5,20,1000]){wave=w;spawnEnemies();
    for(const enemy of enemies){enemy.diving=true;for(let i=0;i<2000;i++){enemy.update(1/60);
      check(enemy.x-enemy.width/2>=enemyMargin&&enemy.x+enemy.width/2<=canvas.width-enemyMargin,'Bounds');}}}
  const first=getWaveDifficulty(1),fifth=getWaveDifficulty(5),late=getWaveDifficulty(1000);
  check(first.downSpeed===80&&fifth.downSpeed===112&&late.downSpeed===MAX_ENEMY_DOWN_SPEED,'Down speed scaling');
  check(fifth.zigzagAmplitude>first.zigzagAmplitude&&fifth.zigzagFrequency>first.zigzagFrequency,'Zigzag scaling');
  startGame();const formation=enemies.map(e=>({x:e.x,y:e.y}));updateEnemies(ENEMY_DIVE_INTERVAL-0.01);
  check(enemies.every((e,i)=>!e.diving&&Math.abs(e.x-formation[i].x-FORMATION_SPEED*(ENEMY_DIVE_INTERVAL-0.01))<1e-8&&Math.abs(e.y-formation[i].y-waveDifficulty.formationDownSpeed*(ENEMY_DIVE_INTERVAL-0.01))<1e-8),'Moving formation');
  updateEnemies(0.01);check(enemies.filter(e=>e.diving).length===1,'One diver');
  const diver=enemies.find(e=>e.diving);const waiting=enemies.filter(e=>!e.diving);
  for(let i=0;i<60;i++)updateEnemies(1/60);
  check(enemies.filter(e=>e.diving).length===1&&waiting.every(e=>e.elapsedTime===0),'No concurrent dives');
  check(diver.y>80&&Math.abs(diver.x-formation[3].x)<100,'Solo approach');
  bullets.push({x:diver.x,y:diver.y});checkBulletEnemyCollisions();
  updateEnemies(ENEMY_DIVE_INTERVAL-0.01);check(!enemies.some(e=>e.diving),'Interval after destruction');
  updateEnemies(0.01);check(enemies.filter(e=>e.diving).length===1,'Next diver');
  startGame();enemyFireRemaining=0;updateEnemyAttacks(0);check(enemyBullets.length===1,'Enemy shooting');
  Math.random=()=>0;const target=enemies[0];bullets.push({x:target.x,y:target.y});checkBulletEnemyCollisions();
  check(score===100&&enemies.length===6&&fuelPickups.length===1,'Combat and fuel drop');
  enemies.length=0;enemies.push(new Enemy(player.x,player.y));checkPlayerCollisions();
  check(player.health===2,'Contact damage');
  enemies[0].y=700;updateEnemies(0);check(enemies.length===0&&player.health===2,'Escape respects invulnerability');
  invulnerabilityRemaining=0;enemies.push(new Enemy(100,700),new Enemy(200,700));updateEnemies(0);
  check(enemies.length===0&&player.health===1,'Escapes apply one protected damage');
  updateWaveProgression(0);updateWaveProgression(1);check(wave===2&&enemies.length===9,'Wave completion');
  invulnerabilityRemaining=0;enemies.length=0;enemies.push(new Enemy(100,700));
  updateEnemies(0);check(gameState===GameState.GAME_OVER&&gameOverReason==='SHIP DESTROYED','Fatal escape');
  const count=enemyBullets.length;gameLoop(500);check(enemyBullets.length===count,'No firing after death');
  Math.random=oldRandom;render();`);
h.keydown({code:'KeyR',repeat:false,preventDefault(){}});
run(`check(wave===1&&enemies.length===7&&enemies.every(e=>e.elapsedTime===0&&e.y===80&&e.downSpeed===BASE_ENEMY_DOWN_SPEED),
  'Restart resets movement');check(enemies.every(e=>!e.diving)&&enemyDiveRemaining===ENEMY_DIVE_INTERVAL,'Restart dive state');render();`);
assert.equal(depth,0);
run(`startGame();invulnerabilityRemaining=1000;let turns=0;
  for(let i=0;i<3600;i++){
    const direction=formationDirection;updateEnemies(1/60);
    if(direction!==formationDirection)turns++;
    check(enemies.filter(e=>e.diving).length<=1,'Single diver during sweep');
    for(const enemy of enemies)check(enemy.x-enemy.width/2>=enemyMargin-1e-8&&
      enemy.x+enemy.width/2<=canvas.width-enemyMargin+1e-8,'Formation and dive bounds');
  }
  check(turns>=2,'Formation boundary reversal');startGame();
  check(formationDirection===1&&enemyDiveRemaining===ENEMY_DIVE_INTERVAL,'Formation reset');`);
console.log('Passed spawn/variation, sinusoidal descent, frame independence, smoothness/bounds, difficulty, enemy fire, combat/drop, damage/escape, waves, and restart checks.');
