# Space Attack — Prompt History

## Phase 1: Initial project

We are building a small browser arcade game called "Space Attack".

Important constraints:
- Vanilla HTML, CSS and JavaScript only.
- Use HTML5 Canvas for gameplay.
- No external frameworks.
- Keep the architecture simple enough for a 2-hour implementation.
- Preserve working functionality when making changes.
- Do not overengineer.
- We will implement the game phase by phase.
- Do not implement features from future phases unless required for the current phase.

Create the initial project with:
- index.html
- style.css
- game.js

The page should contain a centered game canvas around 900x600.
Use a dark arcade/space visual theme.

For now implement only:
- canvas initialization
- requestAnimationFrame game loop
- delta-time calculation
- basic clear/render loop

Do not implement player controls, enemies, bullets, scoring or game states yet.

## Phase 2: Shooting

Add shooting to Space Attack.

Requirements:
- Spacebar fires a projectile upward.
- Support holding Space to continue firing.
- Add a sensible firing cooldown around 200-300 ms.
- Bullets should move using delta time.
- Remove bullets after they leave the canvas.
- Bullets should have a small glow/trail effect.
- Prevent uncontrolled bullet creation.
- Keep bullet logic separate from player rendering where practical.

Do not implement enemies yet.

Preserve movement and existing gameplay.

Implementation note: The saved Phase 1 project had no player or movement.
A stationary ship supplies the firing origin; movement remains unimplemented.

## Phase 3: Game states

Add a simple game state system to Space Attack.

Required states: START, PLAYING, GAME_OVER.

START screen should display:

SPACE ATTACK

Destroy the invading enemy ships.
Survive as many waves as possible.

Controls:
WASD / Arrow Keys - Move
SPACE - Fire

PRESS ENTER TO START

Requirements:
- Game begins in START state.
- Player gameplay should not update while on START.
- Pressing Enter starts the game.
- Keep state handling simple and easy to reset later.

Do not implement enemies or game-over conditions yet.

Preserve existing player movement and firing when PLAYING.

Implementation note: Existing firing is preserved in PLAYING. The saved project
still has no movement implementation; the requested controls text is displayed.

## Phase 4: Enemies

Add enemies to Space Attack.

Requirements:
- Create a basic Enemy entity.
- Spawn enemies in a simple formation at the top of the canvas.
- Start with approximately 5-8 enemies.
- Enemies should move horizontally as a formation.
- When reaching a horizontal boundary, reverse direction and move slightly downward.
- Enemy movement must use delta time.
- Enemies must be visually distinguishable from the player.
- Use Canvas shapes with a polished arcade-space appearance.

Keep enemy behavior deliberately simple.

Do not implement collisions or enemy shooting yet.

Preserve all existing functionality.

## Phase 5: Bullet collisions and score

Implement collision detection between player bullets and enemies.

Use simple AABB collision detection.

When a player bullet hits an enemy:
- destroy the enemy
- destroy the bullet
- add 100 points to the score

Add a visible SCORE display at the top-left of the canvas.

Requirements:
- Collision detection must work reliably.
- Do not allow one bullet to destroy multiple enemies.
- Safely remove destroyed entities without corrupting array iteration.
- Score starts at 0.

Preserve existing gameplay.

## Phase 6: Enemy attacks and player health

Add enemy attacks and player health.

Requirements:
- Player starts with 3 health/lives.
- Display health clearly in the HUD.
- Enemies occasionally fire bullets downward.
- Enemy bullets should be removed when they leave the canvas.
- Enemy bullets can collide with the player.
- Player loses 1 health on hit.
- Add approximately 1 second of invulnerability after taking damage.
- During invulnerability, visually flash the player.
- Prevent multiple overlapping bullets from instantly removing all health.
- When health reaches 0, switch to GAME_OVER state.

Also support collision between an enemy ship and the player if straightforward.

Preserve existing score and player bullet collisions.

## Fix: Player movement

User report: Not able to move player using the arrow and WASD keys.

Added the missing delta-time movement for WASD and arrow keys during PLAYING,
normalized diagonal speed, canvas boundaries, and input clearing when focus is lost.
Preserved firing, collisions, health, score, and game states.

## Phase 7: Game-over screen and restart

Complete the GAME_OVER state.

When player health reaches zero, display:

GAME OVER

Final Score: <score>
Wave Reached: <wave>

PRESS R TO RESTART

When R is pressed:
- reset score to 0
- reset health
- reset wave to 1
- reset player position
- clear player bullets
- clear enemy bullets
- clear enemies
- reset timers
- reset invulnerability
- spawn the first wave
- transition back into PLAYING

Make restart robust so repeated game sessions work correctly.

Preserve the initial START screen for fresh page loads.

Implementation note: Wave tracking starts at 1. Wave progression remains for a
later phase. Enter and R use the same complete session reset function.

## Phase 8: Wave progression

Add a wave progression system.

Requirements:
- Game begins at Wave 1.
- Display current wave in the HUD.
- When all enemies in the current wave are destroyed:
  - briefly show "WAVE COMPLETE"
  - then spawn the next wave
- Increase wave number.
- Add a short delay before the next wave begins.
- Player remains alive between waves.
- Do not reset score or health when progressing to the next wave.

Keep the transition around 1 second.

Preserve all existing functionality.

Implementation note: The transition clears both sets of projectiles and pauses
firing for a safe one-second break. Movement remains available. Each new wave
uses the existing seven-enemy formation; score, health, and position carry over.

## Phase 9: Progressive difficulty

Add progressive difficulty to each wave.

Difficulty should increase gradually using a few simple parameters:
1. Increase enemy count.
2. Increase enemy movement speed.
3. Increase enemy firing frequency.

Example behavior:
- Wave 1 should be beginner-friendly.
- Waves 2-4 should become noticeably harder.
- Later waves should continue scaling but remain playable.

Use reasonable upper limits so difficulty does not become broken.

Keep the difficulty calculation centralized, for example in WaveManager or helper functions.

Do not add new enemy types yet.

Implementation: getWaveDifficulty sets count from 7 to a maximum of 21,
speed from 80 to a maximum of 180 pixels/second, and the base firing interval
from 1.4 seconds down to a minimum of 0.5 seconds (with 15% timing variation).
Formations use up to seven columns and three rows. Firing is formation-wide,
so additional enemies do not multiply the attack rate.

## Phase 10: Arcade polish

Perform a focused arcade polish pass on Space Attack.

Do not redesign the architecture.

Add lightweight effects that improve game feel:
- scrolling starfield background
- enemy destruction particles
- player hit particles
- subtle screen shake on player damage
- small screen shake or hit feedback when enemies are destroyed
- bullet glow
- spaceship engine glow
- wave announcement
- score feedback
- subtle title animation on start screen

Keep effects lightweight and readable.

Do not add features such as bosses, power-ups, multiplayer or external assets.

Prioritize polish without introducing regressions.

Implementation: 80 scrolling stars, capped short-lived particles and score popups,
brief world-only shake, glowing engine and existing glowing bullets, wave banners,
score HUD pulse, and gentle title bob/glow. Effects do not change hitboxes or
gameplay timers; transient effects are cleared on restart.

## Phase 11: Audio

User request: Can we also add background music, bullet firing and hit sounds,
enemy wave approaching etc. to make it more interesting.

Added a lightweight Web Audio synthesizer in audio.js: quiet looping arcade
music, player firing, enemy destruction, player damage, wave arrival/completion,
and game-over cues. Audio is unlocked by keyboard interaction, pauses when the
page loses focus, and supports M to mute. Voices are capped and disconnected
after playback. Restart clears old voices and restarts the music sequence.
No external assets, libraries, or gameplay changes.

## Phase 12: UI presentation and readability

Review the Space Attack UI as a small polished arcade game.
Improve only presentation and readability.

Requirements:
- Score clearly visible
- Health clearly visible
- Wave clearly visible
- Instructions readable on the start screen
- Start/game-over screens visually centered
- Strong text hierarchy
- Maintain dark space/arcade theme
- Canvas should remain centered on common desktop browser sizes
- Avoid excessive text during gameplay

Do not change gameplay mechanics.

Implementation: High-contrast HUD strip with small labels and large values,
centered translucent menu panels, readable controls, prominent keyboard prompts,
and a larger final score. Menus omit the gameplay HUD. Page sizing fits both
viewport width and height while retaining the 900x600 gameplay coordinates.

## Maintenance: Focused bug audit

Review the current Space Attack code for bugs and unnecessary complexity.

Focus on:
- array mutation during collision loops
- duplicate event listeners
- restart/reset bugs
- bullets or enemies not being cleaned up
- delta-time mistakes
- fire timer reset problems
- game state transitions
- enemy firing after game over
- memory growth
- browser console errors

Make only necessary fixes. Do not add new gameplay features.

Fixes: Remove fully offscreen enemies without awarding points so empty waves can
transition; clear stopped audio voices immediately on restart; guard playback
after partial audio initialization failure; skip hidden-tab updates and reset
frame timing on blur. Retain the existing architecture and collision rules.

## Movement adjustment: Horizontal only

Player should only be able to move horizontally and not towards the enemies.

Restricted player movement to A/D and Left/Right at the existing speed and
horizontal canvas bounds. The ship stays at its starting height. W/S and
Up/Down no longer move the ship. Updated the start-screen controls text.

## Phase 13: Fuel system

Add a fuel system to the existing Space Attack game.

Requirements:
- Start with 100 fuel; maximum fuel is 100.
- Continuously drain 1 fuel per second using delta time only during PLAYING.
- Show a gameplay HUD gauge with a shrinking bar and numeric percentage.
- Below roughly 25%, show urgent styling and a LOW FUEL text indicator.
- At zero fuel, clamp to zero, immediately enter GAME_OVER, and stop gameplay.
- Track and display the loss reason: SHIP DESTROYED for zero health or
  OUT OF FUEL for zero fuel.
- Restart resets fuel and all loss/fuel state completely.
- Do not drain fuel on START, GAME_OVER, or before play begins.
- Centralize MAX_FUEL and FUEL_DRAIN_RATE; do not scatter hardcoded values.
- Preserve movement, firing, enemies, health, score, waves, difficulty, and restart.
- Do not add fuel pickups.
- Review game-over and reset logic for regressions.

Implementation: Shared endGame records the first loss reason and clears inputs.
Fuel uses elapsed frame seconds, independently of the existing motion cap, and
continues during the one-second wave break because the state remains PLAYING.
Hidden-tab timing still pauses. Fuel/reason reset in the existing session reset.

## Phase 14: Fuel pickups

Add fuel pickups without changing unrelated gameplay.

Requirements:
- FuelPickup has position, width/height, fall speed, and active state.
- Render a noticeable glowing energy canister using Canvas shapes, no assets.
- Enemy destruction by a player bullet has a random 15% chance to drop fuel.
- Pickups fall using delta time at 100 pixels/second and leave the array offscreen.
- AABB collection restores 25 fuel, capped at MAX_FUEL (100).
- Collection produces temporary particles, glow, and floating fuel feedback.
- Fuel HUD updates immediately, never above 100%.
- Pickups remain available during the wave; restart clears pickups and effects.
- GAME_OVER stops pickup updates and collection.
- Use safe array removal; centralize all balance settings.
- Preserve movement, combat, score, health, waves, difficulty, fuel drain,
  game-over conditions, and restart controls.
- Verify drops/no drops, movement, cleanup, collection/clamping, reset,
  game-over gating, console errors, and existing combat.

Implementation: Reverse iteration and an active flag handle collection/cleanup.
Pickups persist through wave transitions, are capped at 24, and reset on restart.
Feedback shows actual fuel restored (or FUEL FULL), reusing existing short-lived
popups and particles. Collection remains disabled after game over.

## Phase 15: Zig-zag enemy movement

Add a zig-zag enemy movement mechanic to the existing Space Attack game.

Context:
The game already has:
- enemy waves
- player movement and shooting
- collisions
- score
- health
- fuel system
- fuel pickups
- wave progression
- game over and restart

Goal:
Enemies in each wave should no longer only move horizontally.
They should gradually advance toward the player while moving in a zig-zag pattern.

Requirements:

1. Enemy movement behavior
Each enemy should:
- move downward toward the player over time
- move left and right in a smooth zig-zag pattern
- continue progressing downward while zig-zagging
- use delta time so movement is frame-rate independent

The movement should feel intentional and arcade-like, not random jitter.

2. Zig-zag motion
Use a sinusoidal or oscillating horizontal movement pattern.

Preferred approach:

horizontalOffset = Math.sin(time * zigzagFrequency + phaseOffset) * zigzagAmplitude

Enemy Y position should continue increasing independently.

Example concept:

enemy.y += enemyDownSpeed * deltaTime

enemy.x =
    enemy.baseX +
    Math.sin(enemy.elapsedTime * enemy.zigzagFrequency + enemy.phaseOffset)
    * enemy.zigzagAmplitude

Do not directly add the sine result every frame in a way that causes drift.

3. Per-enemy variation
Enemies should not all follow exactly the same path.

Give each enemy slightly different values such as:
- phaseOffset
- zigzagAmplitude
- zigzagFrequency

Example ranges:

zigzagAmplitude = 30 to 70 pixels
zigzagFrequency = 1.5 to 3.0
phaseOffset = random value from 0 to Math.PI * 2

Keep the variation subtle enough that waves still look organized.

4. Downward progression
Enemies must steadily approach the player.

Use a configurable base value such as:

ENEMY_DOWN_SPEED = 35

Increase it gradually with wave difficulty.

For example:

enemyDownSpeed =
BASE_ENEMY_DOWN_SPEED +
wave * ENEMY_DOWN_SPEED_PER_WAVE

Keep the values centralized.

5. Formation behavior
Enemies should still initially spawn in a readable wave formation.

After spawning:
- each enemy follows its own zig-zag path
- enemies gradually move downward
- the formation may naturally spread slightly because of phase differences

Do not make enemies overlap excessively.

6. Screen boundaries
Enemies must remain reasonably inside the horizontal canvas bounds.

Take enemy width into account.

If the zig-zag calculation would push an enemy outside the screen:
- clamp its X position
or
- dynamically limit the movement amplitude

Do not allow enemies to disappear off the left or right edges.

7. Player collision
Preserve existing enemy/player collision behavior.

If an enemy reaches or collides with the player:
- apply the current player damage rules
- respect existing invulnerability logic

Do not introduce duplicate damage handling.

8. Bottom-of-screen handling
If an enemy passes the bottom of the playable area without colliding with the player:

Choose a simple consistent behavior:
- damage the player once and remove the enemy

This prevents enemies from remaining off-screen indefinitely.

Use the existing health/damage system.

Do not instantly remove multiple health points from the same enemy.

9. Wave difficulty
Use the zig-zag movement as part of difficulty progression.

Early waves:
- slower downward speed
- smaller zig-zag amplitude
- slower zig-zag frequency

Later waves:
- somewhat faster downward movement
- slightly wider/faster zig-zag movement

Keep the scaling controlled.

Example target:

Wave 1:
downSpeed ≈ 25-35
amplitude ≈ 30-40
frequency ≈ 1.5

Wave 5:
downSpeed ≈ 45-55
amplitude ≈ 45-60
frequency ≈ 2.0-2.5

Avoid making later waves impossible.

10. Visual readability
The player should be able to predict enemy trajectories.

Do not:
- teleport enemies
- abruptly reverse movement
- use totally random X movement every frame

Movement should remain smooth and readable.

11. Preserve existing functionality
Do not modify unrelated systems:
- player controls
- shooting
- bullet behavior
- scoring
- fuel drain
- fuel pickups
- HUD
- game states
- restart
- enemy shooting
- wave completion logic

Only replace/improve the enemy movement logic.

12. Code organization
Keep movement parameters centralized, for example:

BASE_ENEMY_DOWN_SPEED
ENEMY_DOWN_SPEED_PER_WAVE
BASE_ZIGZAG_AMPLITUDE
ZIGZAG_AMPLITUDE_PER_WAVE
BASE_ZIGZAG_FREQUENCY

Each enemy should store:
- baseX
- elapsedTime
- phaseOffset
- zigzagAmplitude
- zigzagFrequency
- downSpeed

Keep the implementation small and readable.

13. Test cases
After implementation verify:

- enemies spawn correctly
- enemies move downward
- enemies zig-zag smoothly
- enemies have slight movement variation
- enemies stay inside screen bounds
- enemy bullets still work
- bullet/enemy collisions still work
- fuel pickups still spawn from destroyed enemies
- enemies can damage the player
- enemies are removed correctly if they pass the bottom
- waves still complete properly
- restart clears enemy movement state
- difficulty increases across waves
- no console errors occur

Implementation: Centralized bounded wave parameters, per-enemy sinusoidal paths with compensated initial phase, steady descent, horizontal clamping, and escape damage through the existing damage/invulnerability system. Removed the obsolete formation direction and horizontal speed. Restart creates fresh movement state. Existing combat, fuel, pickup, wave, and reset regression checks pass.

## Fix: Solo zig-zag attackers

User request: The wave moves too fast. Apply zig-zag movement only to one enemy
leaving the wave at a time, at intervals, approaching the player faster. Do not
move all enemies simultaneously.

Formation ships now remain stationary. After a 1.5-second pause, one front-most
ship near the player's lane starts a zig-zag dive. The next ship waits until the
active diver is destroyed or escapes, then waits another 1.5 seconds. Solo descent
scales from 80 to a capped 140 pixels/second. Each wave/restart resets the dive
timer and enemy movement state. Existing firing, damage, fuel, and scoring remain.

## Adjustment: Moving formation

The formation should also move instead of remaining stationary.

Added a slow 35-pixel/second horizontal formation sweep, reversing at canvas
boundaries. Solo zig-zag attackers move independently; still only one diver is
active at a time. Dive paths begin from the ship's current formation position.
Formation direction resets for each wave and restart.

## Adjustment: Formation descent by wave

The wave should also move towards the player slowly as per wave level.

Added centralized formation descent difficulty: 4 pixels/second in Wave 1,
increasing by 1 pixel/second per wave, capped at 12. Formation ships descend
while sweeping horizontally; the single active zig-zag attacker retains its
faster independent descent. Existing collision and escape damage rules apply.
