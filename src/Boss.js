import * as THREE from 'three';

export class Boss {
    constructor(scene, onDeath) {
        this.scene = scene;
        this.onDeath = onDeath;
        this.health = 50;
        this.isDead = false;
        this.mesh = null;
        this.speed = 1;
        this.createChicken();
    }

    createChicken() {
        this.mesh = new THREE.Group();

        // Golden Brown Material
        const chickenMat = new THREE.MeshStandardMaterial({
            color: 0x8b4513, // SaddleBrown
            roughness: 0.3,
            metalness: 0.2
        });

        // Body (Oval/Squashed Sphere)
        const bodyGeo = new THREE.SphereGeometry(3, 16, 16);
        const body = new THREE.Mesh(bodyGeo, chickenMat);
        body.scale.set(1.5, 1, 1.2);
        this.mesh.add(body);

        // Drumsticks (Legs)
        const legGeo = new THREE.CylinderGeometry(0.5, 1, 3, 12);

        const leftLeg = new THREE.Mesh(legGeo, chickenMat);
        leftLeg.position.set(-2, -1, 3);
        leftLeg.rotation.x = Math.PI / 2;
        leftLeg.rotation.z = Math.PI / 6;
        this.mesh.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeo, chickenMat);
        rightLeg.position.set(2, -1, 3);
        rightLeg.rotation.x = Math.PI / 2;
        rightLeg.rotation.z = -Math.PI / 6;
        this.mesh.add(rightLeg);

        // Wings
        const wingGeo = new THREE.SphereGeometry(1.5, 12, 12);

        const leftWing = new THREE.Mesh(wingGeo, chickenMat);
        leftWing.scale.set(1, 0.4, 1.5);
        leftWing.position.set(-4, 0.5, 0);
        leftWing.rotation.z = -Math.PI / 6;
        this.mesh.add(leftWing);

        const rightWing = new THREE.Mesh(wingGeo, chickenMat);
        rightWing.scale.set(1, 0.4, 1.5);
        rightWing.position.set(4, 0.5, 0);
        rightWing.rotation.z = Math.PI / 6;
        this.mesh.add(rightWing);

        // Menacing Eyes
        const eyeRedGeo = new THREE.SphereGeometry(0.4, 8, 8);
        const eyeRedMat = new THREE.MeshStandardMaterial({ color: 0xff0000 }); // Red eyes
        const pupilGeo = new THREE.SphereGeometry(0.15, 8, 8);
        const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000 });

        const leftEye = new THREE.Group();
        const leftRed = new THREE.Mesh(eyeRedGeo, eyeRedMat);
        const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
        leftPupil.position.z = 0.35;
        leftEye.add(leftRed);
        leftEye.add(leftPupil);
        leftEye.position.set(-1, 1.5, 4); // Facing player (+Z)
        leftEye.scale.set(1, 1.5, 1); // Angry slit look
        this.mesh.add(leftEye);

        const rightEye = new THREE.Group();
        const rightRed = new THREE.Mesh(eyeRedGeo, eyeRedMat);
        const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
        rightPupil.position.z = 0.35;
        rightEye.add(rightRed);
        rightEye.add(rightPupil);
        rightEye.position.set(1, 1.5, 4);
        rightEye.scale.set(1, 1.5, 1);
        this.mesh.add(rightEye);

        // Mouth with Sharp Teeth
        const mouthGeo = new THREE.BoxGeometry(2, 0.5, 0.5);
        const mouthMat = new THREE.MeshStandardMaterial({ color: 0x220000 });
        const mouth = new THREE.Mesh(mouthGeo, mouthMat);
        mouth.position.set(0, 0, 4.5);
        this.mesh.add(mouth);

        const toothGeo = new THREE.ConeGeometry(0.15, 0.4, 4);
        const toothMat = new THREE.MeshStandardMaterial({ color: 0xffffff });

        for (let i = 0; i < 5; i++) {
            const toothTop = new THREE.Mesh(toothGeo, toothMat);
            toothTop.position.set(-0.8 + i * 0.4, 0.2, 0.1);
            toothTop.rotation.x = Math.PI;
            mouth.add(toothTop);

            const toothBottom = new THREE.Mesh(toothGeo, toothMat);
            toothBottom.position.set(-0.8 + i * 0.4, -0.2, 0.1);
            mouth.add(toothBottom);
        }

        this.mesh.position.y = 10; // Start in air/oven shelf
        this.mesh.castShadow = true;
        this.scene.add(this.mesh);
    }

    update(dt, targetPosition) {
        if (this.isDead || !this.mesh) return;

        // Move towards player slowly
        if (targetPosition) {
            this.mesh.lookAt(targetPosition);

            // Wobble animation
            this.mesh.position.y = 3 + Math.sin(Date.now() * 0.005) * 0.5;

            const dir = new THREE.Vector3().subVectors(targetPosition, this.mesh.position).normalize();
            dir.y = 0;
            this.mesh.position.addScaledVector(dir, this.speed * dt);
        }
    }

    takeDamage(amount) {
        this.health -= amount;

        // Flash red
        this.mesh.traverse((child) => {
            if (child.isMesh) {
                const oldColor = child.material.color.clone();
                child.material.color.set(0xff0000);
                setTimeout(() => child.material.color.copy(oldColor), 100);
            }
        });

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.isDead = true;
        this.scene.remove(this.mesh);
        if (this.onDeath) this.onDeath();
    }
}
