import * as THREE from 'three';

export class Projectiles {
    constructor(scene) {
        this.scene = scene;
        this.pickles = [];
        this.speed = 20;

        // Geometry reuse
        this.pickleGeometry = new THREE.CapsuleGeometry(0.2, 0.8, 4, 8);
        this.pickleMaterial = new THREE.MeshStandardMaterial({ color: 0x00cc00, roughness: 0.4 });

        this.bumpGeo = new THREE.SphereGeometry(0.08, 4, 4);
        this.bumpMat = new THREE.MeshStandardMaterial({ color: 0x008800 });
    }

    updatePickleColor(color) {
        if (this.pickleMaterial) this.pickleMaterial.color.set(color);
        if (this.bumpMat) {
            const darkColor = new THREE.Color(color).multiplyScalar(0.6);
            this.bumpMat.color.copy(darkColor);
        }
    }

    shoot(position, direction) {
        const pickle = new THREE.Mesh(this.pickleGeometry, this.pickleMaterial);

        // Spawn slightly in front of player
        const spawnPos = position.clone().addScaledVector(direction, 2);
        spawnPos.y += 1; // Shoot from mid-height

        pickle.position.copy(spawnPos);

        // Orient pickle to face direction (it is vertical by default, rotate it to lay flat)
        pickle.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);

        // Add bumps for detail
        for (let i = 0; i < 6; i++) {
            const bump = new THREE.Mesh(this.bumpGeo, this.bumpMat);
            bump.position.set(
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.6
            );
            pickle.add(bump);
        }

        // Store velocity
        pickle.userData.velocity = direction.clone().multiplyScalar(this.speed);

        this.scene.add(pickle);
        this.pickles.push(pickle);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            this.removePickle(pickle);
        }, 3000);
    }

    update(dt) {
        for (const pickle of this.pickles) {
            const move = pickle.userData.velocity.clone().multiplyScalar(dt);
            pickle.position.add(move);
        }
    }

    removePickle(pickle) {
        const index = this.pickles.indexOf(pickle);
        if (index > -1) {
            this.pickles.splice(index, 1);
            this.scene.remove(pickle);
        }
    }
}
