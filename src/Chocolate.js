import * as THREE from 'three';

export class Chocolate {
    constructor(scene) {
        this.scene = scene;
        this.chocolates = [];

        // Shared Geometries/Materials
        this.blockGeo = new THREE.BoxGeometry(0.8, 0.6, 1.2);
        this.blockMat = new THREE.MeshStandardMaterial({ color: 0x3E2723 });
        this.wrapperGeo = new THREE.BoxGeometry(0.82, 0.4, 0.8);
        this.wrapperMat = new THREE.MeshStandardMaterial({ color: 0xD32F2F });
        this.eyeGeo = new THREE.SphereGeometry(0.05, 8, 8);
        this.eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    }

    createModel() {
        const group = new THREE.Group();

        // Chocolate Block
        const block = new THREE.Mesh(this.blockGeo, this.blockMat.clone());
        block.position.y = 0.3;
        block.castShadow = true;
        group.add(block);

        // Wrapper (Red)
        const wrapper = new THREE.Mesh(this.wrapperGeo, this.wrapperMat);
        wrapper.position.y = 0.2;
        wrapper.position.z = 0.2;
        group.add(wrapper);

        // Eyes (Angry)
        const leftEye = new THREE.Mesh(this.eyeGeo, this.eyeMat);
        leftEye.position.set(-0.2, 0.45, 0.6);
        group.add(leftEye);

        const rightEye = new THREE.Mesh(this.eyeGeo, this.eyeMat);
        rightEye.position.set(0.2, 0.45, 0.6);
        group.add(rightEye);

        return group;
    }

    spawn(position) {
        const mesh = this.createModel();
        mesh.position.copy(position);
        this.scene.add(mesh);

        const chocolate = {
            mesh: mesh,
            isExploded: false,
            explosionTimer: 0,
            explosionDuration: 0.5,
            explosionRadius: 5,
            speed: 3 + Math.random() * 2,
            isPulsing: false,
            fuseTimer: 0,
            health: 1
        };

        this.chocolates.push(chocolate);
        return mesh;
    }

    update(dt, playerPos) {
        for (let i = this.chocolates.length - 1; i >= 0; i--) {
            const c = this.chocolates[i];

            if (c.isExploded) {
                c.explosionTimer -= dt;
                if (c.explosionTimer <= 0) {
                    this.remove(c);
                }
                continue;
            }

            // Look at player
            c.mesh.lookAt(playerPos);

            // Move towards player
            const dir = new THREE.Vector3().subVectors(playerPos, c.mesh.position).normalize();
            dir.y = 0;
            c.mesh.position.addScaledVector(dir, c.speed * dt);

            // Proximity Fuse
            const dist = c.mesh.position.distanceTo(playerPos);
            if (dist < 4 && !c.isPulsing) {
                c.isPulsing = true;
                c.fuseTimer = 1.2;
            }

            if (c.isPulsing) {
                c.fuseTimer -= dt;
                const pulse = (Math.sin(Date.now() * 0.01) + 1) / 2;
                // children[0] is the block
                c.mesh.children[0].material.emissive.setRGB(pulse * 0.5, 0, 0);

                if (c.fuseTimer <= 0) {
                    this.explode(c);
                }
            }
        }
    }

    explode(c) {
        if (c.isExploded) return;
        c.isExploded = true;
        c.explosionTimer = c.explosionDuration;

        // Visual Explosion effect
        const expGeo = new THREE.SphereGeometry(c.explosionRadius, 16, 16);
        const expMat = new THREE.MeshBasicMaterial({
            color: 0xff4500,
            transparent: true,
            opacity: 0.5
        });
        const expMesh = new THREE.Mesh(expGeo, expMat);
        expMesh.position.copy(c.mesh.position);
        this.scene.add(expMesh);

        // Fade out and remove visual effect
        let opacity = 0.5;
        const fadeOut = () => {
            opacity -= 0.02;
            if (opacity > 0) {
                expMesh.material.opacity = opacity;
                expMesh.scale.multiplyScalar(1.05);
                requestAnimationFrame(fadeOut);
            } else {
                this.scene.remove(expMesh);
            }
        };
        fadeOut();

        // Remove the chocolate mesh early or hide it
        c.mesh.visible = false;
    }

    remove(chocolate) {
        const index = this.chocolates.indexOf(chocolate);
        if (index > -1) {
            this.scene.remove(chocolate.mesh);
            this.chocolates.splice(index, 1);
        }
    }
}
