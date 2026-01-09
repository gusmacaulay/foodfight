import * as THREE from 'three';

export class EggSystem {
    constructor(scene) {
        this.scene = scene;
        this.pickups = [];
        this.projectiles = [];
        this.explosions = [];

        // Egg Geometry
        this.eggGeo = new THREE.SphereGeometry(0.5, 12, 12);
        this.eggGeo.scale(0.8, 1.2, 0.8);
        this.eggMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    }

    spawnPickup(position) {
        const egg = new THREE.Mesh(this.eggGeo, this.eggMat);
        egg.position.copy(position);
        egg.position.y = 1;
        this.scene.add(egg);
        this.pickups.push(egg);
        return egg;
    }

    throwEgg(startPos, direction) {
        const egg = new THREE.Mesh(this.eggGeo, this.eggMat);
        egg.position.copy(startPos);

        const velocity = direction.clone().multiplyScalar(20);
        velocity.y = 10; // Upward arc

        egg.userData.velocity = velocity;
        egg.userData.gravity = -20;

        this.scene.add(egg);
        this.projectiles.push(egg);
    }

    update(dt) {
        // Pickups rotation/bob
        for (const pickup of this.pickups) {
            pickup.rotation.y += dt;
            pickup.position.y = 1 + Math.sin(Date.now() * 0.005) * 0.3;
        }

        // Projectiles movement
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const egg = this.projectiles[i];
            egg.userData.velocity.y += egg.userData.gravity * dt;
            egg.position.addScaledVector(egg.userData.velocity, dt);

            if (egg.position.y <= 0) {
                this.explode(egg.position.clone());
                this.scene.remove(egg);
                this.projectiles.splice(i, 1);
            }
        }

        // Explosions
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const exp = this.explosions[i];
            exp.scale.addScalar(dt * 20);
            exp.material.opacity -= dt * 2;
            if (exp.material.opacity <= 0) {
                this.scene.remove(exp);
                this.explosions.splice(i, 1);
            }
        }
    }

    explode(position) {
        const expGeo = new THREE.SphereGeometry(1, 16, 16);
        const expMat = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.8
        });
        const exp = new THREE.Mesh(expGeo, expMat);
        exp.position.copy(position);
        exp.userData.radius = 8; // Explosion radius
        this.scene.add(exp);
        this.explosions.push(exp);
    }

    createShockwave(position) {
        const expGeo = new THREE.TorusGeometry(1, 0.2, 8, 32);
        expGeo.rotateX(Math.PI / 2);
        const expMat = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 1.0
        });
        const exp = new THREE.Mesh(expGeo, expMat);
        exp.position.copy(position);
        exp.userData.radius = 6; // slightly smaller than egg
        this.scene.add(exp);
        this.explosions.push(exp);
    }

    removePickup(egg) {
        const index = this.pickups.indexOf(egg);
        if (index > -1) {
            this.pickups.splice(index, 1);
            this.scene.remove(egg);
        }
    }
}
