// Game Configuration
const CONFIG = {
    TILE_SIZE: 32,
    GRAVITY: 0.6,
    JUMP_FORCE: -14,
    MOVE_SPEED: 3,
    RUN_SPEED: 5,
    MAX_FALL_SPEED: 15,
    ENEMY_SPEED: 1,
    CANVAS_WIDTH: 1024,
    CANVAS_HEIGHT: 480,
};

// Game State
const gameState = {
    score: 0,
    coins: 0,
    lives: 3,
    time: 400,
    gameStarted: false,
    gameOver: false,
    isPaused: false,
};

// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = CONFIG.CANVAS_WIDTH;
canvas.height = CONFIG.CANVAS_HEIGHT;

// Input Handler
const keys = {
    left: false,
    right: false,
    jump: false,
    run: false,
};

document.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft') keys.left = true;
    if (e.code === 'ArrowRight') keys.right = true;
    if (e.code === 'Space') {
        e.preventDefault();
        keys.jump = true;
        if (!gameState.gameStarted) {
            startGame();
        }
        if (gameState.gameOver) {
            resetGame();
        }
    }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.run = true;
});

document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft') keys.left = false;
    if (e.code === 'ArrowRight') keys.right = false;
    if (e.code === 'Space') keys.jump = false;
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.run = false;
});

// Camera
const camera = {
    x: 0,
    y: 0,
    width: CONFIG.CANVAS_WIDTH,
    height: CONFIG.CANVAS_HEIGHT,

    follow(target) {
        // Keep Mario in view, scroll when he moves right
        const targetX = target.x - this.width / 3;
        if (targetX > this.x) {
            this.x = targetX;
        }
        // Don't scroll past the start
        if (this.x < 0) this.x = 0;

        // Don't scroll past the end
        const maxX = level.width * CONFIG.TILE_SIZE - this.width;
        if (this.x > maxX) this.x = maxX;
    }
};

// Entity Base Class
class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.velocityX = 0;
        this.velocityY = 0;
        this.grounded = false;
        this.active = true;
    }

    applyGravity() {
        this.velocityY += CONFIG.GRAVITY;
        if (this.velocityY > CONFIG.MAX_FALL_SPEED) {
            this.velocityY = CONFIG.MAX_FALL_SPEED;
        }
    }

    update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
    }

    checkCollision(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }
}

// Mario Player
class Mario extends Entity {
    constructor(x, y) {
        super(x, y, 28, 32);
        this.direction = 1; // 1 = right, -1 = left
        this.jumping = false;
        this.powerUp = 'small'; // small, big, fire
        this.invincible = false;
        this.invincibleTimer = 0;
        this.animationFrame = 0;
        this.animationTimer = 0;
    }

    update() {
        // Handle horizontal movement
        let moveSpeed = keys.run ? CONFIG.RUN_SPEED : CONFIG.MOVE_SPEED;

        if (keys.left) {
            this.velocityX = -moveSpeed;
            this.direction = -1;
        } else if (keys.right) {
            this.velocityX = moveSpeed;
            this.direction = 1;
        } else {
            this.velocityX *= 0.8; // Friction
            if (Math.abs(this.velocityX) < 0.1) this.velocityX = 0;
        }

        // Handle jumping
        if (keys.jump && this.grounded && !this.jumping) {
            this.velocityY = CONFIG.JUMP_FORCE;
            this.jumping = true;
            this.grounded = false;
        }

        if (!keys.jump && this.velocityY < 0) {
            this.velocityY *= 0.85; // Variable jump height
        }

        if (!this.grounded) {
            this.jumping = true;
        }

        // Apply gravity
        this.applyGravity();

        // Update position
        super.update();

        // Animation
        if (this.velocityX !== 0) {
            this.animationTimer++;
            if (this.animationTimer > 5) {
                this.animationFrame = (this.animationFrame + 1) % 3;
                this.animationTimer = 0;
            }
        } else {
            this.animationFrame = 0;
        }

        // Invincibility
        if (this.invincible) {
            this.invincibleTimer--;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }

        // Check if fell off the world
        if (this.y > CONFIG.CANVAS_HEIGHT + 100) {
            this.die();
        }
    }

    draw() {
        ctx.save();

        // Flashing effect when invincible
        if (this.invincible && Math.floor(this.invincibleTimer / 5) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Draw Mario with pixel art style
        const colors = {
            skin: '#FFD7A6',
            red: '#FF0000',
            blue: '#0000FF',
            brown: '#8B4513',
            white: '#FFFFFF',
            black: '#000000',
        };

        const scale = this.powerUp === 'big' ? 1.5 : 1;
        const offsetY = this.powerUp === 'big' ? -16 : 0;

        // Flip horizontally based on direction
        if (this.direction === -1) {
            ctx.translate(this.x + this.width, this.y + offsetY);
            ctx.scale(-scale, scale);
        } else {
            ctx.translate(this.x, this.y + offsetY);
            ctx.scale(scale, scale);
        }

        // Draw Mario body
        this.drawMarioSprite(colors);

        ctx.restore();
    }

    drawMarioSprite(colors) {
        const s = 2; // pixel size

        // Hat (red)
        ctx.fillStyle = colors.red;
        ctx.fillRect(4*s, 0, 8*s, 3*s);

        // Face (skin)
        ctx.fillStyle = colors.skin;
        ctx.fillRect(3*s, 3*s, 10*s, 5*s);

        // Eyes (black)
        ctx.fillStyle = colors.black;
        ctx.fillRect(4*s, 4*s, 2*s, 2*s);
        ctx.fillRect(8*s, 4*s, 2*s, 2*s);

        // Mustache (brown)
        ctx.fillStyle = colors.brown;
        ctx.fillRect(3*s, 6*s, 10*s, 2*s);

        // Shirt (red)
        ctx.fillStyle = colors.red;
        ctx.fillRect(2*s, 8*s, 12*s, 6*s);

        // Overalls (blue)
        ctx.fillStyle = colors.blue;
        ctx.fillRect(4*s, 10*s, 8*s, 4*s);

        // Buttons (white)
        ctx.fillStyle = colors.white;
        ctx.fillRect(5*s, 11*s, s, s);
        ctx.fillRect(9*s, 11*s, s, s);

        // Arms (skin)
        ctx.fillStyle = colors.skin;
        if (this.animationFrame === 1) {
            ctx.fillRect(0, 9*s, 2*s, 4*s); // Left arm forward
            ctx.fillRect(14*s, 9*s, 2*s, 4*s); // Right arm back
        } else {
            ctx.fillRect(0, 10*s, 2*s, 4*s); // Left arm
            ctx.fillRect(14*s, 10*s, 2*s, 4*s); // Right arm
        }

        // Legs (blue)
        ctx.fillStyle = colors.blue;
        if (this.velocityX !== 0) {
            if (this.animationFrame % 2 === 0) {
                ctx.fillRect(4*s, 14*s, 4*s, 2*s); // Left leg
                ctx.fillRect(8*s, 14*s, 4*s, 2*s); // Right leg
            } else {
                ctx.fillRect(3*s, 14*s, 4*s, 2*s); // Left leg
                ctx.fillRect(9*s, 14*s, 4*s, 2*s); // Right leg
            }
        } else {
            ctx.fillRect(4*s, 14*s, 4*s, 2*s); // Left leg
            ctx.fillRect(8*s, 14*s, 4*s, 2*s); // Right leg
        }

        // Shoes (brown)
        ctx.fillStyle = colors.brown;
        ctx.fillRect(3*s, 16*s, 5*s, 2*s);
        ctx.fillRect(8*s, 16*s, 5*s, 2*s);
    }

    powerUpGrow() {
        if (this.powerUp === 'small') {
            this.powerUp = 'big';
            this.height = 48;
            gameState.score += 1000;
        }
    }

    takeDamage() {
        if (this.invincible) return;

        if (this.powerUp === 'big' || this.powerUp === 'fire') {
            this.powerUp = 'small';
            this.height = 32;
            this.invincible = true;
            this.invincibleTimer = 180; // 3 seconds at 60fps
        } else {
            this.die();
        }
    }

    die() {
        gameState.lives--;
        if (gameState.lives <= 0) {
            endGame();
        } else {
            this.reset();
        }
    }

    reset() {
        this.x = 100;
        this.y = 100;
        this.velocityX = 0;
        this.velocityY = 0;
        this.powerUp = 'small';
        this.invincible = true;
        this.invincibleTimer = 180;
    }
}

// Enemy Base Class
class Enemy extends Entity {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.velocityX = -CONFIG.ENEMY_SPEED;
        this.crushed = false;
        this.crushTimer = 0;
    }

    update() {
        if (this.crushed) {
            this.crushTimer++;
            if (this.crushTimer > 30) {
                this.active = false;
            }
            return;
        }

        this.applyGravity();
        super.update();

        // Turn around at edges or walls
        if (this.grounded && this.velocityX !== 0) {
            const ahead = this.velocityX > 0 ?
                level.getTileAt(this.x + this.width + 5, this.y + this.height) :
                level.getTileAt(this.x - 5, this.y + this.height);

            if (!ahead || ahead === 'brick' || ahead === 'question') {
                this.velocityX *= -1;
            }
        }
    }

    crush() {
        this.crushed = true;
        this.velocityX = 0;
        gameState.score += 100;
    }
}

// Goomba Enemy
class Goomba extends Enemy {
    constructor(x, y) {
        super(x, y, 28, 28);
        this.animationFrame = 0;
        this.animationTimer = 0;
    }

    update() {
        super.update();

        if (!this.crushed) {
            this.animationTimer++;
            if (this.animationTimer > 20) {
                this.animationFrame = (this.animationFrame + 1) % 2;
                this.animationTimer = 0;
            }
        }
    }

    draw() {
        const s = 2; // pixel size

        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.crushed) {
            // Draw crushed goomba
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(0, 20, 28, 8);
            ctx.fillStyle = '#000000';
            ctx.fillRect(4, 22, 4, 4);
            ctx.fillRect(20, 22, 4, 4);
        } else {
            // Draw goomba
            ctx.fillStyle = '#8B4513'; // Brown body

            // Head
            ctx.fillRect(4*s, 2*s, 6*s, 6*s);

            // Eyes (white)
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(5*s, 3*s, 2*s, 2*s);
            ctx.fillRect(9*s, 3*s, 2*s, 2*s);

            // Pupils (black)
            ctx.fillStyle = '#000000';
            ctx.fillRect(5*s, 4*s, s, s);
            ctx.fillRect(9*s, 4*s, s, s);

            // Eyebrows
            ctx.fillRect(5*s, 3*s, 2*s, s);
            ctx.fillRect(9*s, 3*s, 2*s, s);

            // Fangs
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(6*s, 6*s, s, s);
            ctx.fillRect(9*s, 6*s, s, s);

            // Body
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(2*s, 8*s, 10*s, 4*s);

            // Feet (animated)
            if (this.animationFrame === 0) {
                ctx.fillRect(2*s, 12*s, 4*s, 2*s); // Left foot
                ctx.fillRect(8*s, 12*s, 4*s, 2*s); // Right foot
            } else {
                ctx.fillRect(s, 12*s, 4*s, 2*s); // Left foot
                ctx.fillRect(9*s, 12*s, 4*s, 2*s); // Right foot
            }
        }

        ctx.restore();
    }
}

// Koopa Enemy
class Koopa extends Enemy {
    constructor(x, y) {
        super(x, y, 28, 38);
        this.shell = false;
        this.shellTimer = 0;
        this.animationFrame = 0;
        this.animationTimer = 0;
    }

    update() {
        if (this.shell && this.shellTimer > 0) {
            this.shellTimer--;
            if (this.shellTimer === 0) {
                this.revive();
            }
        }

        super.update();

        if (!this.crushed && !this.shell) {
            this.animationTimer++;
            if (this.animationTimer > 20) {
                this.animationFrame = (this.animationFrame + 1) % 2;
                this.animationTimer = 0;
            }
        }
    }

    crush() {
        if (!this.shell) {
            this.shell = true;
            this.height = 28;
            this.velocityX = 0;
            this.shellTimer = 300; // 5 seconds
            gameState.score += 100;
        } else {
            // Kick the shell
            if (mario.x < this.x) {
                this.velocityX = CONFIG.RUN_SPEED * 2;
            } else {
                this.velocityX = -CONFIG.RUN_SPEED * 2;
            }
            this.shellTimer = 0;
        }
    }

    revive() {
        this.shell = false;
        this.height = 38;
        this.velocityX = -CONFIG.ENEMY_SPEED;
    }

    draw() {
        const s = 2; // pixel size

        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.shell) {
            // Draw shell only
            ctx.fillStyle = '#00FF00'; // Green shell
            ctx.fillRect(2*s, 4*s, 10*s, 8*s);

            // Shell pattern
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(4*s, 5*s, 6*s, 6*s);

            ctx.fillStyle = '#00AA00';
            ctx.fillRect(5*s, 6*s, 4*s, 4*s);
        } else {
            // Draw full Koopa
            // Shell
            ctx.fillStyle = '#00FF00';
            ctx.fillRect(2*s, 8*s, 10*s, 8*s);

            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(4*s, 9*s, 6*s, 6*s);

            ctx.fillStyle = '#00AA00';
            ctx.fillRect(5*s, 10*s, 4*s, 4*s);

            // Head
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(4*s, 2*s, 6*s, 6*s);

            // Eyes
            ctx.fillStyle = '#000000';
            ctx.fillRect(5*s, 3*s, 2*s, 2*s);
            ctx.fillRect(8*s, 3*s, 2*s, 2*s);

            // Feet (animated)
            ctx.fillStyle = '#FFD700';
            if (this.animationFrame === 0) {
                ctx.fillRect(2*s, 16*s, 3*s, 2*s);
                ctx.fillRect(9*s, 16*s, 3*s, 2*s);
            } else {
                ctx.fillRect(s, 16*s, 3*s, 2*s);
                ctx.fillRect(10*s, 16*s, 3*s, 2*s);
            }
        }

        ctx.restore();
    }
}

// Collectibles
class Coin extends Entity {
    constructor(x, y) {
        super(x, y, 24, 24);
        this.collected = false;
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.floatOffset = 0;
        this.floatDirection = 1;
    }

    update() {
        if (this.collected) {
            this.active = false;
            return;
        }

        this.animationTimer++;
        if (this.animationTimer > 10) {
            this.animationFrame = (this.animationFrame + 1) % 4;
            this.animationTimer = 0;
        }

        this.floatOffset += this.floatDirection * 0.5;
        if (Math.abs(this.floatOffset) > 3) {
            this.floatDirection *= -1;
        }
    }

    draw() {
        const s = 2;
        ctx.save();
        ctx.translate(this.x, this.y + this.floatOffset);

        // Draw coin
        ctx.fillStyle = '#FFD700';

        if (this.animationFrame === 0 || this.animationFrame === 2) {
            ctx.fillRect(2*s, 0, 8*s, 12*s);
            ctx.fillStyle = '#FFA500';
            ctx.fillRect(4*s, 2*s, 4*s, 8*s);
        } else if (this.animationFrame === 1) {
            ctx.fillRect(4*s, 0, 4*s, 12*s);
            ctx.fillStyle = '#FFA500';
            ctx.fillRect(5*s, 2*s, 2*s, 8*s);
        } else {
            ctx.fillRect(5*s, 0, 2*s, 12*s);
        }

        ctx.restore();
    }

    collect() {
        if (!this.collected) {
            this.collected = true;
            gameState.coins++;
            gameState.score += 200;
            if (gameState.coins >= 100) {
                gameState.coins = 0;
                gameState.lives++;
            }
        }
    }
}

// Power-up Mushroom
class Mushroom extends Entity {
    constructor(x, y) {
        super(x, y, 28, 28);
        this.velocityX = 2;
        this.collected = false;
        this.spawning = true;
        this.spawnY = y + 32;
        this.targetY = y;
    }

    update() {
        if (this.collected) {
            this.active = false;
            return;
        }

        if (this.spawning) {
            this.y -= 1;
            if (this.y <= this.targetY) {
                this.spawning = false;
            }
            return;
        }

        this.applyGravity();
        super.update();

        // Bounce off walls
        const ahead = this.velocityX > 0 ?
            level.getTileAt(this.x + this.width + 5, this.y + this.height) :
            level.getTileAt(this.x - 5, this.y + this.height);

        if (!ahead || ahead === 'brick' || ahead === 'question') {
            this.velocityX *= -1;
        }
    }

    draw() {
        const s = 2;
        ctx.save();
        ctx.translate(this.x, this.y);

        // Mushroom cap (red with white spots)
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(2*s, 0, 10*s, 8*s);

        // White spots
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(3*s, 2*s, 3*s, 3*s);
        ctx.fillRect(8*s, 2*s, 3*s, 3*s);

        // Mushroom stem (white)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(4*s, 8*s, 6*s, 6*s);

        ctx.restore();
    }

    collect() {
        if (!this.collected && !this.spawning) {
            this.collected = true;
            mario.powerUpGrow();
        }
    }
}

// Block Class
class Block {
    constructor(x, y, type, hasItem = null) {
        this.x = x;
        this.y = y;
        this.type = type; // 'brick', 'question', 'ground'
        this.hasItem = hasItem;
        this.hit = false;
        this.bumpOffset = 0;
        this.animationFrame = 0;
        this.animationTimer = 0;
    }

    update() {
        if (this.bumpOffset > 0) {
            this.bumpOffset -= 2;
        }

        if (this.type === 'question' && !this.hit) {
            this.animationTimer++;
            if (this.animationTimer > 15) {
                this.animationFrame = (this.animationFrame + 1) % 3;
                this.animationTimer = 0;
            }
        }
    }

    draw() {
        const s = CONFIG.TILE_SIZE;
        ctx.save();
        ctx.translate(this.x, this.y - this.bumpOffset);

        if (this.type === 'ground') {
            // Ground block
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(0, 0, s, s);
            ctx.fillStyle = '#654321';
            ctx.fillRect(2, 2, s-4, s-4);

            // Details
            ctx.fillStyle = '#8B4513';
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    ctx.fillRect(4 + i * 8, 4 + j * 8, 6, 6);
                }
            }
        } else if (this.type === 'brick') {
            // Brick block
            ctx.fillStyle = '#CD853F';
            ctx.fillRect(0, 0, s, s);

            // Brick pattern
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 2;
            ctx.strokeRect(1, 1, s-2, s-2);

            // Horizontal lines
            ctx.beginPath();
            ctx.moveTo(0, s/2);
            ctx.lineTo(s, s/2);
            ctx.stroke();

            // Vertical lines
            ctx.beginPath();
            ctx.moveTo(s/2, 0);
            ctx.lineTo(s/2, s/2);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(s/4, s/2);
            ctx.lineTo(s/4, s);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(3*s/4, s/2);
            ctx.lineTo(3*s/4, s);
            ctx.stroke();
        } else if (this.type === 'question') {
            if (this.hit) {
                // Empty block
                ctx.fillStyle = '#8B7355';
                ctx.fillRect(0, 0, s, s);
                ctx.fillStyle = '#654321';
                ctx.fillRect(2, 2, s-4, s-4);
            } else {
                // Question block (animated)
                const colors = ['#FFD700', '#FFA500', '#FFD700'];
                ctx.fillStyle = colors[this.animationFrame];
                ctx.fillRect(0, 0, s, s);

                // Question mark
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('?', s/2, s/2);
            }
        }

        ctx.restore();
    }

    bump() {
        if (this.type === 'question' && !this.hit) {
            this.hit = true;
            this.bumpOffset = 15;

            if (this.hasItem === 'coin') {
                const coin = new Coin(this.x + 4, this.y - 32);
                coin.collect();
            } else if (this.hasItem === 'mushroom') {
                const mushroom = new Mushroom(this.x, this.y - 32);
                entities.push(mushroom);
            }

            gameState.score += 50;
        } else if (this.type === 'brick' && mario.powerUp !== 'small') {
            this.type = 'destroyed';
            gameState.score += 50;
        } else {
            this.bumpOffset = 10;
        }
    }
}

// Level
const level = {
    width: 200, // tiles
    height: 15, // tiles
    blocks: [],

    init() {
        this.blocks = [];

        // Create ground
        for (let x = 0; x < this.width; x++) {
            for (let y = 13; y < this.height; y++) {
                this.blocks.push(new Block(x * CONFIG.TILE_SIZE, y * CONFIG.TILE_SIZE, 'ground'));
            }
        }

        // Add platforms and blocks
        this.addPlatform(20, 10, 3, 'brick');
        this.addPlatform(30, 10, 3, 'brick');
        this.addPlatform(40, 8, 5, 'brick');

        // Question blocks with items
        this.blocks.push(new Block(16 * CONFIG.TILE_SIZE, 9 * CONFIG.TILE_SIZE, 'question', 'coin'));
        this.blocks.push(new Block(21 * CONFIG.TILE_SIZE, 9 * CONFIG.TILE_SIZE, 'question', 'mushroom'));
        this.blocks.push(new Block(23 * CONFIG.TILE_SIZE, 9 * CONFIG.TILE_SIZE, 'question', 'coin'));
        this.blocks.push(new Block(25 * CONFIG.TILE_SIZE, 5 * CONFIG.TILE_SIZE, 'question', 'coin'));
        this.blocks.push(new Block(31 * CONFIG.TILE_SIZE, 9 * CONFIG.TILE_SIZE, 'question', 'mushroom'));
        this.blocks.push(new Block(51 * CONFIG.TILE_SIZE, 9 * CONFIG.TILE_SIZE, 'question', 'coin'));
        this.blocks.push(new Block(70 * CONFIG.TILE_SIZE, 9 * CONFIG.TILE_SIZE, 'question', 'mushroom'));
        this.blocks.push(new Block(80 * CONFIG.TILE_SIZE, 5 * CONFIG.TILE_SIZE, 'question', 'coin'));

        // More platforms
        this.addPlatform(50, 10, 8, 'brick');
        this.addPlatform(65, 8, 4, 'brick');
        this.addPlatform(75, 6, 3, 'brick');
        this.addPlatform(90, 10, 10, 'brick');

        // Floating question blocks
        this.blocks.push(new Block(45 * CONFIG.TILE_SIZE, 6 * CONFIG.TILE_SIZE, 'question', 'coin'));
        this.blocks.push(new Block(46 * CONFIG.TILE_SIZE, 6 * CONFIG.TILE_SIZE, 'question', 'coin'));
        this.blocks.push(new Block(47 * CONFIG.TILE_SIZE, 6 * CONFIG.TILE_SIZE, 'question', 'coin'));

        // Stairs
        this.addStairs(110, 12, 8, 'brick');
        this.addStairs(130, 12, 6, 'brick');

        // Final platform
        this.addPlatform(150, 10, 15, 'brick');
    },

    addPlatform(startX, y, length, type) {
        for (let i = 0; i < length; i++) {
            this.blocks.push(new Block((startX + i) * CONFIG.TILE_SIZE, y * CONFIG.TILE_SIZE, type));
        }
    },

    addStairs(startX, startY, height, type) {
        for (let i = 0; i < height; i++) {
            for (let j = 0; j <= i; j++) {
                this.blocks.push(new Block((startX + i) * CONFIG.TILE_SIZE, (startY - j) * CONFIG.TILE_SIZE, type));
            }
        }
    },

    getTileAt(x, y) {
        const tileX = Math.floor(x / CONFIG.TILE_SIZE);
        const tileY = Math.floor(y / CONFIG.TILE_SIZE);

        const block = this.blocks.find(b =>
            Math.floor(b.x / CONFIG.TILE_SIZE) === tileX &&
            Math.floor(b.y / CONFIG.TILE_SIZE) === tileY &&
            b.type !== 'destroyed'
        );

        return block ? block.type : null;
    },

    getBlockAt(x, y) {
        const tileX = Math.floor(x / CONFIG.TILE_SIZE);
        const tileY = Math.floor(y / CONFIG.TILE_SIZE);

        return this.blocks.find(b =>
            Math.floor(b.x / CONFIG.TILE_SIZE) === tileX &&
            Math.floor(b.y / CONFIG.TILE_SIZE) === tileY &&
            b.type !== 'destroyed'
        );
    }
};

// Entities array
let entities = [];
let mario;

// Initialize game
function initGame() {
    level.init();

    mario = new Mario(100, 100);

    entities = [mario];

    // Add coins
    entities.push(new Coin(18 * CONFIG.TILE_SIZE, 8 * CONFIG.TILE_SIZE));
    entities.push(new Coin(48 * CONFIG.TILE_SIZE, 4 * CONFIG.TILE_SIZE));
    entities.push(new Coin(55 * CONFIG.TILE_SIZE, 7 * CONFIG.TILE_SIZE));
    entities.push(new Coin(68 * CONFIG.TILE_SIZE, 5 * CONFIG.TILE_SIZE));
    entities.push(new Coin(95 * CONFIG.TILE_SIZE, 8 * CONFIG.TILE_SIZE));

    // Add enemies
    entities.push(new Goomba(25 * CONFIG.TILE_SIZE, 11 * CONFIG.TILE_SIZE));
    entities.push(new Goomba(35 * CONFIG.TILE_SIZE, 11 * CONFIG.TILE_SIZE));
    entities.push(new Koopa(45 * CONFIG.TILE_SIZE, 11 * CONFIG.TILE_SIZE));
    entities.push(new Goomba(55 * CONFIG.TILE_SIZE, 11 * CONFIG.TILE_SIZE));
    entities.push(new Goomba(60 * CONFIG.TILE_SIZE, 11 * CONFIG.TILE_SIZE));
    entities.push(new Koopa(72 * CONFIG.TILE_SIZE, 11 * CONFIG.TILE_SIZE));
    entities.push(new Goomba(85 * CONFIG.TILE_SIZE, 11 * CONFIG.TILE_SIZE));
    entities.push(new Koopa(95 * CONFIG.TILE_SIZE, 11 * CONFIG.TILE_SIZE));
    entities.push(new Goomba(105 * CONFIG.TILE_SIZE, 11 * CONFIG.TILE_SIZE));
    entities.push(new Goomba(115 * CONFIG.TILE_SIZE, 11 * CONFIG.TILE_SIZE));
    entities.push(new Koopa(125 * CONFIG.TILE_SIZE, 11 * CONFIG.TILE_SIZE));
    entities.push(new Goomba(140 * CONFIG.TILE_SIZE, 11 * CONFIG.TILE_SIZE));
    entities.push(new Koopa(155 * CONFIG.TILE_SIZE, 11 * CONFIG.TILE_SIZE));
}

// Collision Detection
function checkCollisions() {
    // Mario vs Blocks
    mario.grounded = false;

    for (let block of level.blocks) {
        if (block.type === 'destroyed') continue;

        const blockBox = {
            x: block.x,
            y: block.y - block.bumpOffset,
            width: CONFIG.TILE_SIZE,
            height: CONFIG.TILE_SIZE
        };

        if (mario.checkCollision(blockBox)) {
            // Determine collision side
            const overlapLeft = (mario.x + mario.width) - blockBox.x;
            const overlapRight = (blockBox.x + blockBox.width) - mario.x;
            const overlapTop = (mario.y + mario.height) - blockBox.y;
            const overlapBottom = (blockBox.y + blockBox.height) - mario.y;

            const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

            if (minOverlap === overlapTop && mario.velocityY > 0) {
                // Landing on top
                mario.y = blockBox.y - mario.height;
                mario.velocityY = 0;
                mario.grounded = true;
                mario.jumping = false;
            } else if (minOverlap === overlapBottom && mario.velocityY < 0) {
                // Hitting from below
                mario.y = blockBox.y + blockBox.height;
                mario.velocityY = 0;
                block.bump();
            } else if (minOverlap === overlapLeft) {
                // Collision from left
                mario.x = blockBox.x - mario.width;
                mario.velocityX = 0;
            } else if (minOverlap === overlapRight) {
                // Collision from right
                mario.x = blockBox.x + blockBox.width;
                mario.velocityX = 0;
            }
        }
    }

    // Mario vs Entities
    for (let entity of entities) {
        if (entity === mario || !entity.active) continue;

        if (entity instanceof Enemy && mario.checkCollision(entity)) {
            // Check if Mario jumped on enemy
            if (mario.velocityY > 0 && mario.y + mario.height - 10 < entity.y + entity.height / 2) {
                entity.crush();
                mario.velocityY = -8; // Bounce
            } else if (!entity.crushed) {
                mario.takeDamage();
            }
        }

        if ((entity instanceof Coin || entity instanceof Mushroom) && mario.checkCollision(entity)) {
            entity.collect();
        }

        // Enemy vs Blocks
        if (entity instanceof Enemy || entity instanceof Mushroom) {
            entity.grounded = false;

            for (let block of level.blocks) {
                if (block.type === 'destroyed') continue;

                const blockBox = {
                    x: block.x,
                    y: block.y,
                    width: CONFIG.TILE_SIZE,
                    height: CONFIG.TILE_SIZE
                };

                if (entity.checkCollision(blockBox)) {
                    const overlapTop = (entity.y + entity.height) - blockBox.y;
                    const overlapBottom = (blockBox.y + blockBox.height) - entity.y;

                    if (overlapTop < overlapBottom && entity.velocityY > 0) {
                        entity.y = blockBox.y - entity.height;
                        entity.velocityY = 0;
                        entity.grounded = true;
                    }
                }
            }
        }
    }
}

// Update game state
function update() {
    if (gameState.gameOver || !gameState.gameStarted) return;

    // Update all entities
    for (let entity of entities) {
        if (entity.active) {
            entity.update();
        }
    }

    // Update blocks
    for (let block of level.blocks) {
        block.update();
    }

    // Check collisions
    checkCollisions();

    // Update camera
    camera.follow(mario);

    // Remove inactive entities
    entities = entities.filter(e => e.active || e === mario);

    // Update UI
    updateUI();
}

// Draw everything
function draw() {
    // Clear canvas
    ctx.fillStyle = '#5c94fc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw clouds
    drawClouds();

    // Draw bushes
    drawBushes();

    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Draw blocks
    for (let block of level.blocks) {
        if (block.type !== 'destroyed') {
            block.draw();
        }
    }

    // Draw entities
    for (let entity of entities) {
        if (entity.active) {
            entity.draw();
        }
    }

    ctx.restore();
}

// Draw decorative clouds
function drawClouds() {
    ctx.fillStyle = '#FFFFFF';
    const cloudPositions = [
        { x: 100 - (camera.x * 0.5), y: 50 },
        { x: 300 - (camera.x * 0.5), y: 80 },
        { x: 500 - (camera.x * 0.5), y: 60 },
        { x: 700 - (camera.x * 0.5), y: 90 },
        { x: 900 - (camera.x * 0.5), y: 70 },
    ];

    for (let cloud of cloudPositions) {
        const x = cloud.x % (canvas.width + 200) - 100;
        drawCloud(x, cloud.y);
    }
}

function drawCloud(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.arc(x + 25, y, 25, 0, Math.PI * 2);
    ctx.arc(x + 50, y, 20, 0, Math.PI * 2);
    ctx.arc(x + 25, y - 15, 20, 0, Math.PI * 2);
    ctx.fill();
}

// Draw decorative bushes
function drawBushes() {
    ctx.fillStyle = '#00AA00';
    const bushPositions = [10, 50, 90, 130, 170];

    for (let pos of bushPositions) {
        const x = (pos * CONFIG.TILE_SIZE - camera.x * 0.7) % canvas.width;
        if (x > -60 && x < canvas.width) {
            drawBush(x, canvas.height - 70);
        }
    }
}

function drawBush(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.arc(x + 20, y, 18, 0, Math.PI * 2);
    ctx.arc(x + 40, y, 15, 0, Math.PI * 2);
    ctx.fill();
}

// Update UI
function updateUI() {
    document.getElementById('score').textContent = gameState.score.toString().padStart(6, '0');
    document.getElementById('coins').textContent = '×' + gameState.coins.toString().padStart(2, '0');
    document.getElementById('lives').textContent = '×' + gameState.lives;
    document.getElementById('time').textContent = Math.floor(gameState.time);
}

// Game loop
let lastTime = 0;
let timeAccumulator = 0;

function gameLoop(currentTime) {
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    timeAccumulator += deltaTime;

    // Update timer every second
    if (timeAccumulator >= 1000 && gameState.gameStarted && !gameState.gameOver) {
        gameState.time -= 1;
        timeAccumulator = 0;

        if (gameState.time <= 0) {
            mario.die();
        }
    }

    update();
    draw();

    requestAnimationFrame(gameLoop);
}

// Start game
function startGame() {
    document.getElementById('startScreen').classList.remove('active');
    gameState.gameStarted = true;
}

// End game
function endGame() {
    gameState.gameOver = true;
    document.getElementById('gameOverScreen').classList.add('active');
}

// Reset game
function resetGame() {
    gameState.score = 0;
    gameState.coins = 0;
    gameState.lives = 3;
    gameState.time = 400;
    gameState.gameOver = false;
    gameState.gameStarted = true;

    document.getElementById('gameOverScreen').classList.remove('active');

    camera.x = 0;
    camera.y = 0;

    initGame();
    updateUI();
}

// Initialize and start
initGame();
document.getElementById('startScreen').classList.add('active');
updateUI();
requestAnimationFrame(gameLoop);
