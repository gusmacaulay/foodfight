export class Enemy {
    constructor(x, y, range = 100) {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.width = 40;
        this.height = 40;
        this.range = range;
        this.speed = 2;
        this.direction = 1;
    }

    update(dt) {
        this.x += this.speed * this.direction;
        if (Math.abs(this.x - this.startX) > this.range) {
            this.direction *= -1;
        }
    }

    draw(ctx, cameraX) {
        ctx.save();
        ctx.translate(this.x - cameraX, this.y);

        // Draw Angry Biscuit Enemy (Square biscuit with angry face)
        ctx.fillStyle = '#8B4513'; // Darker Brown
        ctx.fillRect(0, 0, this.width, this.height);

        // Angry Eyes
        ctx.fillStyle = 'white';
        ctx.fillRect(5, 10, 8, 8);
        ctx.fillRect(27, 10, 8, 8);

        ctx.fillStyle = 'black';
        ctx.fillRect(8, 13, 3, 3);
        ctx.fillRect(30, 13, 3, 3);

        // Angry Eyebrows
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(3, 8); ctx.lineTo(15, 12);
        ctx.moveTo(37, 8); ctx.lineTo(25, 12);
        ctx.stroke();

        // Frown
        ctx.beginPath();
        ctx.arc(20, 35, 8, Math.PI, 0, false);
        ctx.stroke();

        ctx.restore();
    }

    checkCollision(player) {
        if (player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y) {
            return true;
        }
        return false;
    }
}
