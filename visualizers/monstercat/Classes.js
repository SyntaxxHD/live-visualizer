class Bar {
    constructor(x,y,width,height,colour) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.desiredPos = this.height;
    }

    draw(horizontal,vertical) {
        ctx.fillRect(this.x+horizontal, this.y+vertical, this.width, this.height);
    }

    update() {
        if(this.height < this.desiredPos) {
            this.height += (this.desiredPos-this.height)/settings.bars.smoothingFactor;
        } else if (this.height > this.desiredPos) {
            this.height-=(this.height-this.desiredPos)/settings.bars.smoothingFactor;
        }
        this.y = canvas.height/2-this.height;
    }
}

class Particle {
    constructor() {
        this.x = Math.random()*canvas.width;
        this.y = Math.random()*canvas.height;
        this.radius = Math.random()*1.5+0.1;
        this.opacity = Math.random()*0.5+0.5;
        this.speedX = Math.random()*5+0.5;
        this.speedY = Math.random()*4-2;
        this.changedSpeedX = this.speedX;
        this.changedSpeedY = this.speedY;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        ctx.fillStyle="rgba(255,255,255," + this.opacity + ")";
        ctx.fill();
    }

    update() {
        this.x += (settings.particles.direction == "Left" ? -this.changedSpeedX : this.changedSpeedX);
        this.y += this.changedSpeedY;
        if(this.x > canvas.width+this.radius) {
            this.x = -this.radius;
        }
        if(this.x < -this.radius) {
            this.x = canvas.width+this.radius;
        }

        if(this.y > canvas.height+this.radius) {
            this.y = -this.radius;
        }
        if(this.y < -this.radius) {
            this.y = canvas.height+this.radius;
        }
    }
}