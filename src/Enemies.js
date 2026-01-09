import * as THREE from 'three';

export class Enemies {
    constructor(scene) {
        this.scene = scene;
        this.enemies = [];
        this.spawnTimer = 0;
        this.spawnInterval = 3; // Spawn every 3 seconds
        this.isSpawning = true;

        this.carrotGeo = new THREE.ConeGeometry(0.5, 2, 8);
        this.carrotMat = new THREE.MeshStandardMaterial({ color: 0xff6600 });
        this.leafGeo = new THREE.SphereGeometry(0.4, 8, 8);
        this.leafGeo.scale(0.5, 1.5, 0.5);
        this.leafMat = new THREE.MeshStandardMaterial({ color: 0x00aa00 });
        this.ringMat = new THREE.MeshStandardMaterial({ color: 0xcc4400 });
        this.ringGeo = new THREE.TorusGeometry(0.51, 0.02, 8, 16);
        this.ringGeo.rotateX(Math.PI / 2);
    }

    spawn(position) {
        const carrot = new THREE.Mesh(this.carrotGeo, this.carrotMat);
        carrot.position.copy(position);
        carrot.position.y = 1; // Half height

        // Add segments
        for (let i = 0; i < 3; i++) {
            const ring = new THREE.Mesh(this.ringGeo, this.ringMat);
            ring.position.y = 0.5 - i * 0.5;
            ring.scale.set(1 - i * 0.1, 1 - i * 0.1, 1);
            carrot.add(ring);
        }

        // Green top
        const leaf = new THREE.Mesh(this.leafGeo, this.leafMat);
        leaf.position.y = 1;
        carrot.add(leaf);

        carrot.userData.speed = 2 + Math.random() * 2; // Random speed

        this.scene.add(carrot);
        this.enemies.push(carrot);
    }

    update(dt, targetPosition) {
        if (this.isSpawning) {
            this.spawnTimer += dt;
            if (this.spawnTimer > this.spawnInterval) {
                this.spawnTimer = 0;
                // Spawn middle of the area
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * 5; // Spawn within a radius of 5 from center
                const x = Math.sin(angle) * radius;
                const z = Math.cos(angle) * radius;
                this.spawn(new THREE.Vector3(x, 0, z));
            }
        }

        // Chase logic
        if (targetPosition) {
            for (const enemy of this.enemies) {
                // Look at player
                enemy.lookAt(targetPosition);

                // Move towards player
                const dir = new THREE.Vector3().subVectors(targetPosition, enemy.position).normalize();
                // Flatten Y
                dir.y = 0;
                enemy.position.addScaledVector(dir, enemy.userData.speed * dt);
            }
        }
    }

    remove(enemy) {
        const index = this.enemies.indexOf(enemy);
        if (index > -1) {
            this.enemies.splice(index, 1);
            this.scene.remove(enemy);
        }
    }
    stopSpawning() {
        this.isSpawning = false;
    }
}
