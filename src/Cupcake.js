import * as THREE from 'three';

export class Cupcake {
    constructor(scene) {
        this.scene = scene;
        this.cupcakes = [];

        // Shared Geometries/Materials
        this.baseGeo = new THREE.CylinderGeometry(0.5, 0.4, 0.6, 12);
        this.frostingGeo = new THREE.SphereGeometry(0.4, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2); // Dome
        this.cherryGeo = new THREE.SphereGeometry(0.1, 8, 8);
        this.eyeGeo = new THREE.SphereGeometry(0.05, 8, 8);
        this.mouthGeo = new THREE.TorusGeometry(0.15, 0.02, 8, 16, Math.PI); // Half circle smile

        this.baseMat = new THREE.MeshStandardMaterial({ color: 0xeedd88 }); // Cake color
        this.frostingMat = new THREE.MeshStandardMaterial({ color: 0xff69b4 }); // Pink frosting
        this.cherryMat = new THREE.MeshStandardMaterial({ color: 0xff0000 }); // Red cherry
        this.eyeMat = new THREE.MeshStandardMaterial({ color: 0xff1493 }); // Deep pink eyes
        this.mouthMat = new THREE.MeshStandardMaterial({ color: 0x000000 }); // Black smile
    }

    createModel() {
        const group = new THREE.Group();

        // Base
        const base = new THREE.Mesh(this.baseGeo, this.baseMat);
        base.position.y = 0.3;
        base.castShadow = true;
        group.add(base);

        // Frosting
        const frosting = new THREE.Mesh(this.frostingGeo, this.frostingMat);
        frosting.position.y = 0.6;
        frosting.scale.set(1.2, 1, 1.2);
        frosting.castShadow = true;
        group.add(frosting);

        // Cherry
        const cherry = new THREE.Mesh(this.cherryGeo, this.cherryMat);
        cherry.position.y = 1.0;
        cherry.castShadow = true;
        group.add(cherry);

        // Pink Eyes
        const leftEye = new THREE.Mesh(this.eyeGeo, this.eyeMat);
        leftEye.position.set(-0.15, 0.75, 0.5);
        group.add(leftEye);

        const rightEye = new THREE.Mesh(this.eyeGeo, this.eyeMat);
        rightEye.position.set(0.15, 0.75, 0.5);
        group.add(rightEye);

        // Happy Smile (Torus)
        const mouth = new THREE.Mesh(this.mouthGeo, this.mouthMat);
        mouth.position.set(0, 0.65, 0.5);
        mouth.rotation.x = Math.PI; // Flip it to smile
        group.add(mouth);

        return group;
    }

    spawn(position) {
        const mesh = this.createModel();
        mesh.position.copy(position);
        this.scene.add(mesh);

        const cupcake = {
            mesh: mesh,
            velocity: new THREE.Vector3(0, 0, 0),
            jumpTimer: Math.random() * 2,
            isJumping: false,
            health: 2
        };

        this.cupcakes.push(cupcake);
        return mesh;
    }

    update(dt, playerPos) {
        for (let i = this.cupcakes.length - 1; i >= 0; i--) {
            const cupcake = this.cupcakes[i];

            // AI: Jump towards player
            cupcake.jumpTimer -= dt;

            if (cupcake.jumpTimer <= 0 && !cupcake.isJumping) {
                cupcake.isJumping = true;
                cupcake.velocity.y = 5;

                // Direction to player
                const dir = new THREE.Vector3().subVectors(playerPos, cupcake.mesh.position).normalize();
                cupcake.velocity.x = dir.x * 3;
                cupcake.velocity.z = dir.z * 3;
            }

            if (cupcake.isJumping) {
                cupcake.velocity.y -= 9.8 * dt; // Gravity
                cupcake.mesh.position.add(cupcake.velocity.clone().multiplyScalar(dt));

                if (cupcake.mesh.position.y <= 0.6) { // Half height
                    cupcake.mesh.position.y = 0.6;
                    cupcake.isJumping = false;
                    cupcake.velocity.set(0, 0, 0);
                    cupcake.jumpTimer = 1 + Math.random() * 2;
                }
            } else {
                // Wobble when idle
                cupcake.mesh.rotation.z = Math.sin(Date.now() * 0.01) * 0.1;
            }
        }
    }

    remove(cupcake) {
        const index = this.cupcakes.indexOf(cupcake);
        if (index > -1) {
            this.scene.remove(cupcake.mesh);
            this.cupcakes.splice(index, 1);
        }
    }
}
