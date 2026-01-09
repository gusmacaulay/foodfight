import { Player } from './player.js';
import { Biscuit } from './biscuit.js';
import { Enemy } from './enemy.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const biscuitCounter = document.getElementById('biscuit-count');

const player = new Player(canvas);
const input = { left: false, right: false, jump: false };

let biscuits = [];
let enemies = [];
let biscuitScore = 0;
let cameraX = 0;
let lastTime = 0;

// Level Data
const platforms = [
    { x: 0, y: 550, width: 3000, height: 50 }, // Long Ground
    { x: 200, y: 450, width: 120, height: 20 },
    { x: 450, y: 380, width: 120, height: 20 },
    { x: 700, y: 300, width: 120, height: 20 },
    { x: 1000, y: 400, width: 200, height: 20 },
    { x: 1300, y: 350, width: 150, height: 20 },
    { x: 1600, y: 450, width: 150, height: 20 },
    { x: 1900, y: 300, width: 200, height: 20 },
    { x: 2200, y: 380, width: 120, height: 20 },
    { x: 2500, y: 300, width: 150, height: 20 },
    { x: 2800, y: 450, width: 200, height: 20 }
];

function initLevel() {
    biscuits = [
        new Biscuit(260, 420),
        new Biscuit(510, 350),
        new Biscuit(760, 270),
        new Biscuit(1100, 370),
        new Biscuit(1400, 320),
        new Biscuit(1700, 420),
        new Biscuit(2000, 270),
        new Biscuit(2300, 350),
        new Biscuit(2600, 270)
    ];

    enemies = [
        new Enemy(600, 510, 150),
        new Enemy(1200, 510, 200),
        new Enemy(1800, 510, 150),
        new Enemy(2400, 510, 250)
    ];
}

// Input Handling
window.addEventListener('keydown', (e) => {
    switch (e.code) {
        case 'ArrowLeft': case 'KeyA': input.left = true; break;
        case 'ArrowRight': case 'KeyD': input.right = true; break;
        case 'Space': case 'ArrowUp':
            if (!input.jump) input.jump = true;
            break;
        case 'AltLeft': case 'AltRight':
            e.preventDefault(); // Prevent browser alt menu
            player.attack();
            break;
    }
});

window.addEventListener('keyup', (e) => {
    switch (e.code) {
        case 'ArrowLeft': case 'KeyA': input.left = false; break;
        case 'ArrowRight': case 'KeyD': input.right = false; break;
        case 'Space': case 'ArrowUp': input.jump = false; break;
    }
});

function gameLoop(timestamp) {
    const dt = (timestamp - lastTime) / 1000 || 1 / 60;
    lastTime = timestamp;

    // Camera scrolling (center on player)
    const targetCameraX = player.x - canvas.width / 2 + player.width / 2;
    cameraX += (targetCameraX - cameraX) * 0.1;
    cameraX = Math.max(0, Math.min(cameraX, 3000 - canvas.width));

    // Clear Screen
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update Player
    player.update(input, platforms, dt);

    // Update and Draw Biscuits
    biscuits.forEach(b => {
        b.update(dt, player);
        const collision = b.checkCollision(player);
        if (collision === true) {
            biscuitScore++;
            biscuitCounter.innerText = biscuitScore;
        } else if (collision === 'hit') {
            // Player hit by biscuit
            resetPlayer();
        }
        b.draw(ctx, cameraX);
    });

    function resetPlayer() {
        player.x = 100;
        player.y = 100;
        player.vx = 0;
        player.vy = 0;
        player.attacking = false;
    }

    // Update and Draw Enemies
    enemies = enemies.filter(e => {
        e.update(dt);
        if (e.checkCollision(player)) {
            if (player.attacking) {
                // Enemy defeated!
                return false;
            } else {
                resetPlayer();
            }
        }
        e.draw(ctx, cameraX);
        return true;
    });

    // Draw Platforms
    platforms.forEach(p => {
        const renderX = p.x - cameraX;
        if (renderX + p.width < 0 || renderX > canvas.width) return; // Culling

        ctx.fillStyle = '#8B4513'; // SaddleBrown
        ctx.fillRect(renderX, p.y, p.width, p.height);

        // Snow/Icing on top
        ctx.fillStyle = '#fff';
        ctx.fillRect(renderX, p.y, p.width, 5);
    });

    // Draw Player
    player.draw(cameraX);

    requestAnimationFrame(gameLoop);
}

// Start Game
initLevel();
gameLoop();
