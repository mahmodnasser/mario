# Super Mario Game

A full-featured Super Mario game built with JavaScript, HTML5 Canvas, and CSS.

## Features

### Core Gameplay
- **Mario Character**: Fully animated player with running and jumping animations
- **Physics System**: Realistic gravity, jumping mechanics, and momentum
- **Power-Up System**: Collect mushrooms to grow bigger and gain extra hit points
- **Lives System**: Start with 3 lives, earn more by collecting 100 coins
- **Score System**: Earn points by defeating enemies and collecting items

### Enemies
- **Goombas**: Walking enemies that patrol platforms
- **Koopas**: Turtle enemies that can be jumped on to turn into shells
- **Shell Kicking**: Kick Koopa shells to defeat multiple enemies
- **Enemy AI**: Enemies turn around at edges and obstacles

### Level Elements
- **Question Blocks**: Hit from below to reveal coins or power-ups
- **Brick Blocks**: Can be broken when Mario is powered up
- **Ground Tiles**: Solid platforms to walk on
- **Coins**: Collect for points and extra lives
- **Platforms**: Multiple levels of platforms to explore
- **Stairs**: Climb stairs to reach higher areas

### Game Mechanics
- **Collision Detection**: Accurate collision detection for all entities
- **Camera System**: Smooth scrolling camera that follows Mario
- **Invincibility Frames**: Brief invincibility after taking damage
- **Variable Jump Height**: Hold jump for higher jumps
- **Running**: Hold Shift to run faster
- **Enemy Stomping**: Jump on enemies to defeat them

### Visual Features
- **Pixel Art Graphics**: All graphics drawn with Canvas API in retro style
- **Animations**: Character animations, coin spinning, block bumping
- **Parallax Clouds**: Background clouds with parallax scrolling
- **Decorative Bushes**: Foreground decorations
- **UI Display**: Score, coins, world, time, and lives counter

## Controls

- **← →** Arrow Keys: Move left/right
- **SPACE**: Jump (hold for higher jumps)
- **SHIFT**: Run (move faster)
- **SPACE** (on start screen): Start game
- **SPACE** (on game over): Restart game

## How to Play

1. Open `index.html` in a web browser
2. Press SPACE to start the game
3. Use arrow keys to move Mario
4. Jump on enemies to defeat them
5. Hit question blocks from below to get items
6. Collect coins and power-ups
7. Avoid getting hit by enemies
8. Try to get the highest score!

## Game Rules

- **Lives**: You start with 3 lives. Lose a life when hit while small, or fall off the world
- **Power-Ups**: Mushrooms make you big and give you one extra hit point
- **Coins**: Collect 100 coins to earn an extra life
- **Enemies**: Stomp on enemies from above to defeat them
- **Time**: Complete the level before time runs out
- **Score**:
  - Coins: 200 points
  - Enemy defeat: 100 points
  - Question blocks: 50 points
  - Brick breaking: 50 points
  - Power-up collection: 1000 points

## Technical Details

- **Canvas Size**: 1024x480 pixels
- **Tile Size**: 32x32 pixels
- **Frame Rate**: 60 FPS
- **Game Engine**: Custom built with JavaScript
- **Rendering**: HTML5 Canvas API
- **No External Dependencies**: Pure vanilla JavaScript

## File Structure

```
mario/
├── index.html      # Main HTML file with game container and UI
├── style.css       # Styling for UI, menus, and layout
├── game.js         # Complete game engine and logic
└── README.md       # This file
```

## Game Architecture

### Classes
- **Entity**: Base class for all game objects
- **Mario**: Player character with controls and power-ups
- **Enemy**: Base class for enemies
- **Goomba**: Walking enemy type
- **Koopa**: Turtle enemy with shell mechanics
- **Coin**: Collectible items
- **Mushroom**: Power-up items
- **Block**: Level blocks (brick, question, ground)

### Systems
- **Input Handler**: Keyboard event management
- **Physics Engine**: Gravity, velocity, and movement
- **Collision System**: Entity vs entity and entity vs block collisions
- **Camera System**: Scrolling viewport that follows the player
- **Animation System**: Frame-based sprite animations
- **Level System**: Procedural level generation with blocks and enemies
- **UI System**: Score, lives, coins, and time display

## Browser Compatibility

Works in all modern browsers that support:
- HTML5 Canvas
- ES6 JavaScript
- CSS3

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Future Enhancements

Possible additions:
- Fire flower power-up with projectiles
- More enemy types (Piranha Plants, Hammer Bros)
- Multiple worlds and levels
- Sound effects and background music
- High score saving (localStorage)
- Mobile touch controls
- Boss battles
- Secret areas and warp pipes
- Flagpole ending

## Credits

Created as a tribute to the classic Super Mario Bros game by Nintendo.
Built entirely with vanilla JavaScript, HTML5, and CSS3.

Enjoy playing!