export class Chocolate {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.width = 30;
        this.height = 30;

        // Movement
        this.speed = 1.5;
        this.direction = 1;
        this.range = 80;

        // Explosion properties
        this.isExploding = false;
        this.isExploded = false;
        this.explosionTimer = 0;
        this.explosionDuration = 1.0; // 1 second countdown
        this.explosionRadius = 100;
        this.detonated = false; // True when damage is dealt
    }

    update(dt, player) {
        if (this.detonated) return; // Gone

        // Movement (Patrol)
        if (!this.isExploding) {
            this.x += this.speed * this.direction;
            if (Math.abs(this.x - this.startX) > this.range) {
                this.direction *= -1;
            }

            // Check distance to player to trigger explosion
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;
            const px = player.x + player.width / 2;
            const py = player.y + player.height / 2;
            const dist = Math.sqrt((cx - px) ** 2 + (cy - py) ** 2);

            if (dist < 100) { // Trigger range
                this.startExplosion();
            }
        } else {
            // Countdown
            this.explosionTimer -= dt;
            if (this.explosionTimer <= 0) {
                return this.explode(player);
            }
        }
    }

    startExplosion() {
        if (this.isExploding) return;
        this.isExploding = true;
        this.explosionTimer = this.explosionDuration;
    }

    explode(player) {
        this.isExploded = true;
        this.detonated = true; // Mark as done

        // Check if player is in damage radius
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const px = player.x + player.width / 2;
        const py = player.y + player.height / 2;
        const dist = Math.sqrt((cx - px) ** 2 + (cy - py) ** 2);

        if (dist < this.explosionRadius) {
            // Damage player (or reset in this simple game)
            return 'explosion_hit';
        }
    }

    checkCollision(player) {
        if (this.detonated) return false;

        // Simple AABB for body collision
        if (player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y) {

            if (player.attacking) {
                // Player hits chocolate before it explodes -> Immediate explosion? 
                // Or just kill it safely? Let's say kill it safely to reward skill.
                this.detonated = true;
                return true; // Killed
            } else {
                // Touched body logic: maybe trigger explosion instantly or just small bump?
                // Let's trigger instant explosion
                if (!this.isExploding) {
                    this.startExplosion();
                    this.explosionTimer = 0.1; // Almost instant
                }
            }
        }
        return false;
    }

    draw(ctx, cameraX) {
        if (this.detonated) return;

        ctx.save();
        const renderX = this.x - cameraX;
        ctx.translate(renderX, this.y);

        // Draw Chocolate Square
        ctx.fillStyle = '#3e2723'; // Dark chocolate
        if (this.isExploding) {
            // Pulse red/orange
            if (Math.floor(Date.now() / 100) % 2 === 0) {
                ctx.fillStyle = '#ff4500';
            }
        }
        ctx.fillRect(0, 0, this.width, this.height);

        // Detail (Inner square)
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(5, 5, this.width - 10, this.height - 10);

        // If Exploding, draw timer/radius warning?
        if (this.isExploding) {
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(this.width / 2, this.height / 2, this.explosionRadius, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }
}
