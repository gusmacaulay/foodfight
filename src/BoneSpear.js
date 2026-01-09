import * as THREE from 'three';

export class BoneSpear {
    constructor(scene) {
        this.scene = scene;
        this.spears = [];
        this.isCharging = false;
        this.chargeLevel = 0;
        this.maxCharge = 2.0; // 2 seconds to full charge

        // Bone geometry and materials
        this.boneGeo = new THREE.CylinderGeometry(0.1, 0.1, 2, 8);
        this.tipGeo = new THREE.ConeGeometry(0.15, 0.5, 8);
        this.boneMat = new THREE.MeshStandardMaterial({
            color: 0xf5f5dc, // Beige/bone color
            roughness: 0.4,
            metalness: 0.1
        });
    }

    createSpearModel() {
        const group = new THREE.Group();

        // Main bone shaft
        const shaft = new THREE.Mesh(this.boneGeo, this.boneMat);
        shaft.rotation.x = Math.PI / 2; // Point forward
        group.add(shaft);

        // Front tip
        const frontTip = new THREE.Mesh(this.tipGeo, this.boneMat);
        frontTip.position.z = 1.25;
        frontTip.rotation.x = -Math.PI / 2;
        group.add(frontTip);

        // Back tip
        const backTip = new THREE.Mesh(this.tipGeo, this.boneMat);
        backTip.position.z = -1.25;
        backTip.rotation.x = Math.PI / 2;
        group.add(backTip);

        // Knobby joints for bone look
        const jointGeo = new THREE.SphereGeometry(0.15, 8, 8);
        const joint1 = new THREE.Mesh(jointGeo, this.boneMat);
        joint1.position.z = 0.5;
        group.add(joint1);

        const joint2 = new THREE.Mesh(jointGeo, this.boneMat);
        joint2.position.z = -0.5;
        group.add(joint2);

        group.castShadow = true;
        return group;
    }

    startCharging() {
        this.isCharging = true;
        this.chargeLevel = 0;
    }

    updateCharge(dt) {
        if (this.isCharging) {
            this.chargeLevel = Math.min(this.chargeLevel + dt, this.maxCharge);
        }
    }

    getChargePercent() {
        return this.chargeLevel / this.maxCharge;
    }

    throwSpear(position, direction) {
        if (!this.isCharging) return;

        const spear = this.createSpearModel();
        spear.position.copy(position);
        spear.position.y += 1; // Offset to burger height
        spear.lookAt(position.clone().add(direction));

        // Scale and speed based on charge
        const chargeMultiplier = 0.5 + this.getChargePercent() * 1.5; // 0.5x to 2x
        spear.scale.setScalar(chargeMultiplier);

        const speed = 20 + this.getChargePercent() * 30; // 20-50 speed
        const damage = 5 + Math.floor(this.getChargePercent() * 15); // 5-20 damage

        spear.userData = {
            velocity: direction.clone().normalize().multiplyScalar(speed),
            damage: damage,
            lifetime: 3 // 3 seconds max flight time
        };

        this.scene.add(spear);
        this.spears.push(spear);

        this.isCharging = false;
        this.chargeLevel = 0;
    }

    cancelCharge() {
        this.isCharging = false;
        this.chargeLevel = 0;
    }

    update(dt) {
        for (let i = this.spears.length - 1; i >= 0; i--) {
            const spear = this.spears[i];
            const data = spear.userData;

            // Move spear
            spear.position.addScaledVector(data.velocity, dt);

            // Rotate for visual effect
            spear.rotation.z += dt * 5;

            // Countdown lifetime
            data.lifetime -= dt;
            if (data.lifetime <= 0) {
                this.removeSpear(spear);
            }
        }
    }

    removeSpear(spear) {
        const index = this.spears.indexOf(spear);
        if (index > -1) {
            this.scene.remove(spear);
            this.spears.splice(index, 1);
        }
    }
}
