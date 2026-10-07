# Space Attack

Space Attack is a fast-paced browser arcade shooter built with **HTML5 Canvas, CSS, and vanilla JavaScript**.

Pilot your spaceship, survive increasingly difficult enemy waves, manage your fuel, collect fuel pickups, avoid enemy fire, and try to achieve the highest score possible.

## Features

- Keyboard-based spaceship movement
- Shooting mechanics
- Enemy waves
- Zig-zag enemy movement toward the player
- Collision detection
- Score system
- Health / lives system
- Fuel management system
- Fuel pickups dropped by enemies
- Progressive difficulty
- Start screen
- Game over screen
- Restart functionality
- Arcade-style visual effects and particles

## Controls

| Action | Controls |
|---|---|
| Move Up | `W` or `Arrow Up` |
| Move Down | `S` or `Arrow Down` |
| Move Left | `A` or `Arrow Left` |
| Move Right | `D` or `Arrow Right` |
| Fire | `Space` |
| Start Game | `Enter` |
| Restart | `R` |

## Gameplay

The goal is to survive as many enemy waves as possible while earning points by destroying enemy ships.

Enemies gradually move toward the player in zig-zag patterns and become more challenging as the wave number increases.

The player must manage two important resources:

### Health

The player has limited health.

Taking damage from enemies or enemy projectiles reduces health. When health reaches zero, the game ends.

### Fuel

The spaceship consumes fuel continuously during gameplay.

If fuel reaches zero, the game ends.

Destroyed enemies have a chance to drop fuel pickups. Collecting them restores part of the player's fuel supply.

## Difficulty Progression

Each new wave becomes progressively harder through changes such as:

- More enemies
- Faster enemy movement
- Increased enemy firing frequency
- Faster downward progression
- More challenging zig-zag movement

The difficulty scales gradually to keep the gameplay challenging while remaining playable.

## Fuel Pickups

Enemies have a chance to drop fuel cells when destroyed.

Collecting a fuel pickup:

- Restores fuel
- Updates the fuel gauge immediately
- Cannot increase fuel beyond the maximum capacity

Players must decide when to take risks to collect fuel while avoiding incoming enemies and projectiles.

## Tech Stack

- HTML5
- CSS3
- JavaScript
- HTML5 Canvas API

No external game engine or JavaScript framework is required.

## Project Structure

```text
space-attack/
│
├── index.html
├── style.css
├── game.js
├── README.md
├── PROMPTS.md
└── REFLECTION.md
```

## Running Locally

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/space-attack.git
```

Navigate into the project:

```bash
cd space-attack
```

You can open `index.html` directly in your browser.

Alternatively, run a simple local web server.

Using Python:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Hosting

Since Space Attack is a static browser game, it can be hosted easily using:

- GitHub Pages
- Netlify
- Vercel

No backend or database is required.

## Development Approach

The game was developed incrementally in small phases:

1. Project setup and game loop
2. Player movement
3. Shooting
4. Game states
5. Enemy spawning
6. Collision detection
7. Score and health systems
8. Game over and restart
9. Wave progression
10. Difficulty scaling
11. Fuel management
12. Fuel pickups
13. Zig-zag enemy movement
14. Visual polish and play-testing

This phased approach helped keep changes isolated and made it easier to test each gameplay system independently.

## Game Loop

The main gameplay loop follows a simple structure:

```text
Input
  ↓
Update Player
  ↓
Update Bullets
  ↓
Update Enemies
  ↓
Update Pickups
  ↓
Check Collisions
  ↓
Update Wave / Game State
  ↓
Render
```

The game uses `requestAnimationFrame()` and delta-time-based movement to provide consistent gameplay across different frame rates.

## Game States

Space Attack uses three primary game states:

```text
START
  ↓
PLAYING
  ↓
GAME_OVER
```

The game begins on the start screen.

Press `Enter` to begin.

If either health or fuel reaches zero, the player enters the game-over state.

Press `R` to restart.

## Future Improvements

Possible future additions include:

- Multiple enemy types
- Boss battles
- Weapon upgrades
- Power-ups
- Shield system
- Different spaceship types
- Sound effects and background music
- Combo scoring
- High-score persistence
- Mobile/touch controls
- Additional enemy movement patterns

## AI-Assisted Development

Code development was performed using Codex as required by the project constraints.

The prompts used during development are documented in:

```text
PROMPTS.md
```

The development process, time spent, challenges, and learnings are documented separately in:

```text
REFLECTION.md
```

## License

This project was created as a small browser-game development exercise.

Feel free to use the project for learning and experimentation.
