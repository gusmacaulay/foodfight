export class Player {
    constructor(canvas) {
        this.ctx = canvas.getContext('2d');
        this.width = 40;
        this.height = 60;
        this.x = 100;
        this.y = 100;
        this.vx = 0;
        this.vy = 0;
        this.speed = 5;
        this.jumpStrength = -12;
        this.gravity = 0.6;
        this.grounded = false;

        // Sprite details
        this.color = '#CD853F'; // Peru (Gingerbread) color

        // Combat
        this.attacking = false;
        this.attackTimer = 0;
        this.attackDuration = 0.2; // 200ms
        this.attackType = 'punch'; // 'punch' or 'kick'
    }

    attack() {
        if (!this.attacking) {
            this.attacking = true;
            this.attackTimer = this.attackDuration;

            // Toggle attack type
            this.attackType = (this.attackType === 'punch') ? 'kick' : 'punch';
        }
    }

    update(input, platforms, dt = 1 / 60) {
        // Attack Timer
        if (this.attacking) {
            this.attackTimer -= dt;
            if (this.attackTimer <= 0) {
                this.attacking = false;
            }
        }

        // Horizontal Movement
        if (input.right) {
            this.vx = this.speed;
        } else if (input.left) {
            this.vx = -this.speed;
        } else {
            this.vx = 0;
        }

        // Jumping
        if (input.jump && this.grounded) {
            this.vy = this.jumpStrength;
            this.grounded = false;
        }

        // Apply Physics
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;

        // Collision Detection
        this.grounded = false; // Assume in air until collision found
        this.checkPlatformCollisions(platforms);

        // Screen Boundaries
        if (this.x < 0) this.x = 0;
        // Don't limit right side to allow scrolling logic later (or just loop for now)
    }

    checkPlatformCollisions(platforms) {
        for (const platform of platforms) {
            if (this.x < platform.x + platform.width &&
                this.x + this.width > platform.x &&
                this.y < platform.y + platform.height &&
                this.y + this.height > platform.y) {

                // Collision happened. Check direction.
                // Simple AABB resolution for platformer (mainly focused on top collision)
                const prevY = this.y - this.vy;

                // If we were above the platform before, land on it
                if (prevY + this.height <= platform.y) {
                    this.y = platform.y - this.height;
                    this.vy = 0;
                    this.grounded = true;
                }
                // If we hit the bottom (bonk head)
                else if (prevY >= platform.y + platform.height) {
                    this.y = platform.y + platform.height;
                    this.vy = 0;
                }
                // Determine side collisions if needed (velocity based)
                else if (this.vx > 0) { // Hitting left side
                    this.x = platform.x - this.width;
                    this.vx = 0;
                } else if (this.vx < 0) { // Hitting right side
                    this.x = platform.x + platform.width;
                    this.vx = 0;
                }
            }
        }
    }

    draw(cameraX) {
        // Draw Body (Gingerbread shape - simple rects/circles)
        const renderX = this.x - cameraX;
        this.ctx.fillStyle = this.color;

        // Head
        this.ctx.beginPath();
        this.ctx.arc(renderX + 20, this.y + 10, 15, 0, Math.PI * 2);
        this.ctx.fill();

        // Torso
        this.ctx.fillRect(renderX + 5, this.y + 20, 30, 25);

        // Arms
        this.ctx.fillRect(renderX - 5, this.y + 22, 10, 8); // Left
        this.ctx.fillRect(renderX + 35, this.y + 22, 10, 8); // Right

        // Legs
        this.ctx.fillRect(renderX + 8, this.y + 45, 10, 15); // Left
        this.ctx.fillRect(renderX + 22, this.y + 45, 10, 15); // Right

        // Decorations (Buttons / Eyes)
        this.ctx.fillStyle = 'white';
        // Eyes
        this.ctx.beginPath();
        this.ctx.arc(renderX + 15, this.y + 8, 2, 0, Math.PI * 2);
        this.ctx.arc(renderX + 25, this.y + 8, 2, 0, Math.PI * 2);
        this.ctx.fill();

        // Mouth
        this.ctx.strokeStyle = 'red';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(renderX + 20, this.y + 12, 5, 0, Math.PI, false);
        this.ctx.stroke();

        // Buttons
        this.ctx.fillStyle = 'purple'; // Gumdrops
        this.ctx.beginPath();
        this.ctx.arc(renderX + 20, this.y + 28, 3, 0, Math.PI * 2);
        this.ctx.arc(renderX + 20, this.y + 36, 3, 0, Math.PI * 2);
        this.ctx.fill();

        // Attack Animation
        if (this.attacking) {
            // Punch
            if (this.attackType === 'punch') {
                this.ctx.fillStyle = this.color;
                // Extend right arm
                this.ctx.fillRect(renderX + 35 + 10, this.y + 22, 15, 8); // Extended arm

                // Fist
                this.ctx.fillStyle = '#A0522D'; // Darker for fist
                this.ctx.beginPath();
                this.ctx.arc(renderX + 35 + 10 + 15, this.y + 26, 6, 0, Math.PI * 2);
                this.ctx.fill();
            }
            // Kick
            else if (this.attackType === 'kick') {
                // Retract normal right leg for visual clarity? Maybe just draw over it or let it be.
                // Actually, let's draw an extended leg.

                this.ctx.fillStyle = this.color;

                // Leg extending out
                ctx.save();
                ctx.translate(renderX + 27, this.y + 45); // Pivot at hip/leg connection
                ctx.rotate(-Math.PI / 4); // Kick up
                ctx.fillRect(0, 0, 10, 20); // Leg

                // Foot
                ctx.fillStyle = 'white'; // Icing?
                ctx.fillRect(0, 20, 10, 5);
                ctx.restore();
            }
        }
    }
}
