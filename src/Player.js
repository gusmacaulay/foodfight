import * as THREE from 'three';

export class Player {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.speed = 10;
        this.rotationSpeed = 3;

        this.createBurger();

        // Third Person Camera Offset
        this.cameraOffset = new THREE.Vector3(0, 5, -8);

        this.bites = [];
        this.crumbs = [];
        this.isDead = false;

        this.verticalVelocity = 0;
        this.gravity = -30;
        this.isJumping = false;
        this.groundHeight = 0;
    }

    createBurger() {
        this.mesh = new THREE.Group();

        // Bottom Bun
        const bunGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 16);
        const bunMat = new THREE.MeshStandardMaterial({ color: 0xffaa44 }); // Brownish bun
        const bottomBun = new THREE.Mesh(bunGeo, bunMat);
        bottomBun.position.y = 0.25;
        this.mesh.add(bottomBun);

        // Patty
        const pattyGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.4, 16);
        const pattyMat = new THREE.MeshStandardMaterial({ color: 0x441100 }); // Dark brown meat
        const patty = new THREE.Mesh(pattyGeo, pattyMat);
        patty.position.y = 0.7;
        this.mesh.add(patty);

        // Cheese
        const cheeseGeo = new THREE.BoxGeometry(3.1, 0.1, 3.1);
        const cheeseMat = new THREE.MeshStandardMaterial({ color: 0xffdd00 }); // Yellow cheese
        const cheese = new THREE.Mesh(cheeseGeo, cheeseMat);
        cheese.position.y = 0.95;
        this.mesh.add(cheese);

        // Top Bun
        const topBunGeo = new THREE.SphereGeometry(1.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const topBun = new THREE.Mesh(topBunGeo, bunMat);
        topBun.position.y = 1.0;
        this.mesh.add(topBun);

        // Sesame Seeds
        const seedGeo = new THREE.BoxGeometry(0.1, 0.05, 0.2);
        const seedMat = new THREE.MeshStandardMaterial({ color: 0xfffdd0 });
        for (let i = 0; i < 20; i++) {
            const seed = new THREE.Mesh(seedGeo, seedMat);
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 1.2;
            seed.position.set(Math.cos(angle) * dist, 1.45, Math.sin(angle) * dist);
            // Note: 1.45 is roughly the top surface of the bun (1.0 height + 0.45 curvature)
            seed.rotation.set(Math.random(), Math.random(), Math.random());
            this.mesh.add(seed); // Better to add to mesh group directly or topBun
        }

        // Eyes (Googly)
        const eyeGeo = new THREE.SphereGeometry(0.3, 16, 16);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const pupilGeo = new THREE.SphereGeometry(0.1, 16, 16);
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.6, 1.8, 1.0);
        const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
        leftPupil.position.set(0, 0, 0.25);
        leftEye.add(leftPupil);
        this.mesh.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.6, 1.8, 1.0);
        const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
        rightPupil.position.set(0, 0, 0.25);
        rightEye.add(rightPupil);
        this.mesh.add(rightEye);

        this.mesh.castShadow = true;
        this.scene.add(this.mesh);

        // Add a simple pointer to see where forward is
        // const arrowHelper = new THREE.ArrowHelper( new THREE.Vector3(0,0,1), new THREE.Vector3(0,0,0), 2, 0xff0000 );
        // this.mesh.add( arrowHelper );
    }

    update(dt, input) {
        if (!this.mesh || this.isDead) {
            this.updateCrumbs(dt);
            return;
        }

        // Rotation
        if (input.left) {
            this.mesh.rotation.y += this.rotationSpeed * dt;
        }
        if (input.right) {
            this.mesh.rotation.y -= this.rotationSpeed * dt;
        }

        // Movement
        const direction = new THREE.Vector3();
        this.mesh.getWorldDirection(direction);
        // NOTE: Three.js standard logic often assumes -Z is forward for cameras, but for models it depends.
        // Let's assume +Z is "forward" relative to the mesh rotation for now. 

        if (input.forward) {
            this.mesh.position.addScaledVector(direction, this.speed * dt);
        }
        if (input.backward) {
            this.mesh.position.addScaledVector(direction, -this.speed * dt);
        }

        // Jump Physics
        if (this.isJumping || this.mesh.position.y > this.groundHeight) {
            this.verticalVelocity += this.gravity * dt;
            this.mesh.position.y += this.verticalVelocity * dt;

            if (this.mesh.position.y <= this.groundHeight) {
                this.mesh.position.y = this.groundHeight;
                this.verticalVelocity = 0;
                this.isJumping = false;
                this.justLanded = true; // Flag for Game.js
            }
        }

        // Wall Collisions (Clamping)
        const limit = 24;
        this.mesh.position.x = Math.max(-limit, Math.min(limit, this.mesh.position.x));
        this.mesh.position.z = Math.max(-limit, Math.min(limit, this.mesh.position.z));

        // Camera Follow
        this.updateCamera();
    }

    jump() {
        if (!this.isJumping && !this.isDead) {
            this.isJumping = true;
            this.verticalVelocity = 15;
            this.justLanded = false;
        }
    }

    updateCrumbs(dt) {
        for (let i = this.crumbs.length - 1; i >= 0; i--) {
            const crumb = this.crumbs[i];
            crumb.position.addScaledVector(crumb.userData.velocity, dt);
            crumb.userData.velocity.y -= 9.8 * dt; // Gravity
            crumb.rotation.x += crumb.userData.spin.x * dt;
            crumb.rotation.y += crumb.userData.spin.y * dt;

            if (crumb.position.y < 0) {
                crumb.position.y = 0;
                crumb.userData.velocity.multiplyScalar(0);
            }
        }
    }

    updateCamera() {
        // Calculate ideal camera position based on player rotation
        // We want the camera behind the player.
        // If player faces Z+, camera should be at Z-.

        const idealOffset = this.cameraOffset.clone();
        idealOffset.applyMatrix4(this.mesh.matrixWorld);

        this.camera.position.lerp(idealOffset, 0.1); // Smooth follow
        this.camera.lookAt(this.mesh.position);
    }

    flashRed() {
        const originalColors = [];
        this.mesh.traverse((child) => {
            if (child.isMesh && child.userData.isBite !== true) {
                originalColors.push({ mesh: child, color: child.material.color.clone() });
                child.material.color.set(0xff0000);
            }
        });

        setTimeout(() => {
            originalColors.forEach(({ mesh, color }) => {
                mesh.material.color.copy(color);
            });
        }, 200);
    }

    takeBite() {
        // Add a "hole" sphere that is pure black
        const biteGeo = new THREE.SphereGeometry(0.5 + Math.random() * 0.3, 12, 12);
        const biteMat = new THREE.MeshBasicMaterial({ color: 0x000000 }); // True black for "hole" look
        const bite = new THREE.Mesh(biteGeo, biteMat);

        // Random position on the burger edge
        const angle = Math.random() * Math.PI * 2;
        const radius = 1.2 + Math.random() * 0.3;
        bite.position.set(Math.cos(angle) * radius, 0.5 + Math.random() * 1.0, Math.sin(angle) * radius);
        bite.userData.isBite = true;

        this.mesh.add(bite);
        this.bites.push(bite);
    }

    explodeIntoCrumbs() {
        this.isDead = true;
        this.mesh.visible = false;

        const colors = [0xffaa44, 0x441100, 0xffdd00]; // Bun, Patty, Cheese
        const crumbGeo = new THREE.BoxGeometry(0.2, 0.2, 0.2);

        for (let i = 0; i < 100; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            const crumbMat = new THREE.MeshStandardMaterial({ color: color });
            const crumb = new THREE.Mesh(crumbGeo, crumbMat);

            crumb.position.copy(this.mesh.position);
            crumb.position.y += Math.random() * 2;

            crumb.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 15,
                Math.random() * 15,
                (Math.random() - 0.5) * 15
            );

            crumb.userData.spin = new THREE.Vector3(
                Math.random() * 10,
                Math.random() * 10,
                Math.random() * 10
            );

            this.scene.add(crumb);
            this.crumbs.push(crumb);
        }
    }
}
