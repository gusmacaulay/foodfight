import * as THREE from 'three';

export class FlourBagBoss {
    constructor(scene) {
        this.scene = scene;
        this.mesh = this.createModel();
        this.health = 40;
        this.maxHealth = 40;
        this.isDead = false;
        this.speed = 1.2;
        this.state = 'CHASE'; // CHASE, STOMP
        this.attackTimer = 0;

        this.scene.add(this.mesh);
    }

    createModel() {
        const group = new THREE.Group();

        // Bag body (rounded box)
        const bodyGeo = new THREE.BoxGeometry(4, 5, 2.5);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.8 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 2.5;
        group.add(body);

        // Top folds
        const topGeo = new THREE.BoxGeometry(4.2, 0.5, 2.7);
        const top = new THREE.Mesh(topGeo, bodyMat);
        top.position.y = 5.1;
        group.add(top);

        // Eyes (menacing blue)
        const eyeGeo = new THREE.SphereGeometry(0.4, 16, 16);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-1, 3.5, 1.3);
        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(1, 3.5, 1.3);
        group.add(leftEye);
        group.add(rightEye);

        // "FLOUR" Label
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#eeeeee';
        ctx.fillRect(0, 0, 256, 128);
        ctx.fillStyle = '#333';
        ctx.font = 'bold 64px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('FLOUR', 128, 80);

        const labelTex = new THREE.CanvasTexture(canvas);
        const labelGeo = new THREE.PlaneGeometry(3, 1.5);
        const labelMat = new THREE.MeshBasicMaterial({ map: labelTex });
        const label = new THREE.Mesh(labelGeo, labelMat);
        label.position.set(0, 2, 1.26);
        group.add(label);

        return group;
    }

    update(dt, targetPosition) {
        if (this.isDead || !targetPosition) return;

        // Move towards player
        const dir = new THREE.Vector3().subVectors(targetPosition, this.mesh.position).normalize();
        dir.y = 0;
        this.mesh.position.addScaledVector(dir, this.speed * dt);
        this.mesh.lookAt(targetPosition.x, this.mesh.position.y, targetPosition.z);

        // Wobble animation
        this.mesh.rotation.z = Math.sin(Date.now() * 0.005) * 0.05;
        this.mesh.position.y = Math.sin(Date.now() * 0.01) * 0.2;
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
        // Visual feedback
        this.mesh.traverse(child => {
            if (child.isMesh && child.material.emissive) {
                child.material.emissive.setHex(0xffffff);
                setTimeout(() => {
                    if (this.mesh) child.material.emissive.setHex(0x000000);
                }, 100);
            }
        });
    }

    die() {
        this.isDead = true;
        // Animation/Cleanup handled by Game
    }

    remove() {
        this.scene.remove(this.mesh);
    }
}
