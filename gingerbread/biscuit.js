export class Biscuit {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.radius = 15;
        this.collected = false;
        this.angle = 0;

        // Movement & Attack
        this.speed = 2;
        this.direction = 1;
        this.range = 100;
        this.lungeTimer = Math.random() * 5 + 3; // Lunge every 3-8 seconds
        this.isLunging = false;
        this.lungeState = 0; // 0: Idle, 1: Readying, 2: Lunging, 3: Recovering
        this.lungeDuration = 0;
    }

    update(dt, player) {
        if (this.collected) return;
        this.angle += dt * 3;

        if (this.isLunging) {
            this.handleLunge(dt, player);
        } else {
            // Normal pacing movement
            this.x += this.speed * this.direction;
            if (Math.abs(this.x - this.startX) > this.range) {
                this.direction *= -1;
            }

            // Check for lunge opportunity
            this.lungeTimer -= dt;
            if (this.lungeTimer <= 0) {
                this.startLunge();
            }
        }
    }

    startLunge() {
        this.isLunging = true;
        this.lungeState = 1; // Readying
        this.lungeDuration = 0.5; // Half second to ready
    }

    handleLunge(dt, player) {
        this.lungeDuration -= dt;
        if (this.lungeDuration <= 0) {
            this.lungeState++;
            if (this.lungeState === 2) { // Start Lunging
                this.lungeDuration = 0.4;
                // Calculate direction to player
                const dx = (player.x + player.width / 2) - this.x;
                const dy = (player.y + player.height / 2) - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                this.lungeVx = (dx / dist) * 10;
                this.lungeVy = (dy / dist) * 10;
            } else if (this.lungeState === 3) { // Recovering
                this.lungeDuration = 1.0;
            } else if (this.lungeState === 4) { // Done
                this.isLunging = false;
                this.lungeTimer = Math.random() * 5 + 3;
            }
        }

        if (this.lungeState === 2) {
            this.x += this.lungeVx;
            this.y += this.lungeVy;
        }
    }

    draw(ctx, cameraX) {
        if (this.collected) return;

        ctx.save();
        ctx.translate(this.x - cameraX, this.y + Math.sin(this.angle) * 5);

        // Visual cue for lunging
        if (this.lungeState === 1) { // Pulsing red when readying
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'red';
        } else if (this.lungeState === 2) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'orange';
        }

        // Draw Biscuit
        ctx.fillStyle = '#D2691E';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Chips
        ctx.fillStyle = '#5D2E16';
        ctx.beginPath();
        ctx.arc(-5, -5, 3, 0, Math.PI * 2);
        ctx.arc(5, 5, 3, 0, Math.PI * 2);
        ctx.arc(0, 8, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    checkCollision(player) {
        if (this.collected) return false;

        const biscuitX = this.x;
        const biscuitY = this.y + Math.sin(this.angle) * 5;

        const dx = (biscuitX) - (player.x + player.width / 2);
        const dy = (biscuitY) - (player.y + player.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.radius + 20) {
            if (player.attacking) {
                this.collected = true;
                return true;
            } else {
                // If not attacking, the player takes damage/resets
                // Return 'hit' to let the game handle it
                return 'hit';
            }
        }
        return false;
    }
}
