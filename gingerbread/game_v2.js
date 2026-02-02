import { Player } from './player_v2.js';
import { Biscuit } from './biscuit.js?v=2';
import { Enemy } from './enemy.js?v=2';
import { Chocolate } from './chocolate.js?v=2';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const biscuitCounter = document.getElementById('biscuit-count');

const player = new Player(canvas);
const input = { left: false, right: false, jump: false };

let biscuits = [];
let enemies = [];
let chocolates = [];
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

    chocolates = [
        new Chocolate(900, 520),
        new Chocolate(1600, 520),
        new Chocolate(2100, 520),
        new Chocolate(3100, 520) // Off screen test
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

// Background Drawing
function drawBackground(ctx, cameraX, timer) {
    // Sky
    ctx.fillStyle = '#87CEEB'; // Sky Blue
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Candy Mountains (Parallax 0.2)
    const mountainParallax = 0.2;
    const mountainOffset = -cameraX * mountainParallax;

    // Draw a few repeats to cover scrolling
    const mountainWidth = 400;
    const startM = Math.floor(-mountainOffset / mountainWidth) - 1;
    const endM = startM + Math.ceil(canvas.width / mountainWidth) + 2;

    for (let i = startM; i < endM; i++) {
        const mx = i * mountainWidth + mountainOffset;
        const my = canvas.height - 150; // Base of mountains

        // Mountain 1 (Pink)
        ctx.fillStyle = '#FFC0CB';
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(mx + 200, my - 300);
        ctx.lineTo(mx + 400, my);
        ctx.fill();

        // Stripes (White)
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(mx + 100, my - 150); ctx.lineTo(mx + 300, my - 150); // Mid stripe
        ctx.stroke();

        // Mountain 2 (Purple - Offset)
        ctx.fillStyle = '#DDA0DD'; // Plum
        ctx.beginPath();
        ctx.moveTo(mx + 200, my);
        ctx.lineTo(mx + 400, my - 200);
        ctx.lineTo(mx + 600, my);
        ctx.fill();
    }

    // Chocolate River
    // Animated waves
    const riverY = canvas.height - 40;
    ctx.fillStyle = '#5D2906'; // Chocolate Color
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    for (let x = 0; x <= canvas.width; x += 10) {
        const y = riverY + Math.sin((x + cameraX + timer * 200) * 0.02) * 10;
        ctx.lineTo(x, y);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.fill();
}

function gameLoop(timestamp) {
    const dt = (timestamp - lastTime) / 1000 || 1 / 60;
    lastTime = timestamp;

    // Camera scrolling (center on player)
    const targetCameraX = player.x - canvas.width / 2 + player.width / 2;
    cameraX += (targetCameraX - cameraX) * 0.1;
    cameraX = Math.max(0, Math.min(cameraX, 3000 - canvas.width));

    // Clear Screen
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Background
    drawBackground(ctx, cameraX, timestamp / 1000); // Use timestamp for wave animation


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
        e.draw(ctx, cameraX);
        return true;
    });

    // Update and Draw Chocolates
    chocolates = chocolates.filter(c => {
        const result = c.update(dt, player);
        if (result === 'explosion_hit') {
            resetPlayer();
        }

        const col = c.checkCollision(player);
        if (col === true) {
            // Player killed chocolate (attacked it)
            // It detonated harmlessly? Or we just remove it.
            // checkCollision sets detonated=true so it won't draw/update next frame
            // We can remove it from array or let 'detonated' flag handle it (but better to remove)
        }

        // If it exploded (detonated), remove it
        if (c.detonated) {
            // One last draw frame? No, it's gone.
            // But if we want to show an explosion effect, we might need a persistent effect object.
            // For now, let's just draw it one last time? 
            // Actually, `Chocolate.draw` returns if `detonated` is true.
            // So it's invisible immediately.
            // Maybe we should keep it for a few frames or spawn a detached explosion effect?
            // The task says "Draw the explosion effect when triggered".
            // `Chocolate.draw` handles `isExploding` visual, but once `detonated` (exploded), it stops drawing.
            // We can check `c.detonated` and if true, spawn a visual effect object if we had a system for that.
            // For now, we'll just remove it.
            return false;
        }

        c.draw(ctx, cameraX);
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
