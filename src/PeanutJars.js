import * as THREE from 'three';

export class PeanutJars {
    constructor(scene) {
        this.scene = scene;
        this.jars = [];
        this.peanuts = [];

        // Jar Geometry
        this.jarGeo = new THREE.CylinderGeometry(1, 1.2, 2.5, 12);
        this.jarMat = new THREE.MeshStandardMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.6,
            roughness: 0.1,
            metalness: 0.1
        });

        // Lid Geometry
        this.lidGeo = new THREE.CylinderGeometry(1.1, 1.1, 0.4, 12);
        this.lidMat = new THREE.MeshStandardMaterial({ color: 0xcc0000 });

        // Label Geometry
        this.labelGeo = new THREE.CylinderGeometry(1.05, 1.05, 1.5, 12, 1, true);
        this.labelMat = new THREE.MeshStandardMaterial({ color: 0xffff00 });

        // Peanut Geometry
        this.peanutGeo = new THREE.SphereGeometry(0.5, 8, 8);
        this.peanutGeo.scale(1.2, 0.8, 0.8);
        this.peanutMat = new THREE.MeshStandardMaterial({ color: 0xd2b48c }); // Tan
    }

    spawnJar(position) {
        const jarGroup = new THREE.Group();

        const jar = new THREE.Mesh(this.jarGeo, this.jarMat);
        jarGroup.add(jar);

        const lid = new THREE.Mesh(this.lidGeo, this.lidMat);
        lid.position.y = 1.4;
        jarGroup.add(lid);

        const label = new THREE.Mesh(this.labelGeo, this.labelMat);
        label.position.y = 0;
        jarGroup.add(label);

        jarGroup.position.copy(position);
        jarGroup.userData.health = 3;
        jarGroup.userData.spawnTimer = 0;
        jarGroup.userData.spawnInterval = 8; // Spawn a peanut every 8 seconds

        this.scene.add(jarGroup);
        this.jars.push(jarGroup);
    }

    update(dt, targetPosition) {
        // Update Jars (spawning peanuts)
        for (const jar of this.jars) {
            jar.userData.spawnTimer += dt;
            if (jar.userData.spawnTimer > jar.userData.spawnInterval) {
                jar.userData.spawnTimer = 0;
                this.spawnPeanut(jar.position.clone());
            }
        }

        // Update Peanuts (chasing player)
        if (targetPosition) {
            for (let i = this.peanuts.length - 1; i >= 0; i--) {
                const peanut = this.peanuts[i];
                peanut.lookAt(targetPosition);
                const dir = new THREE.Vector3().subVectors(targetPosition, peanut.position).normalize();
                dir.y = 0;
                peanut.position.addScaledVector(dir, 5 * dt); // Peanut speed

                // Hop animation
                peanut.position.y = 0.5 + Math.abs(Math.sin(Date.now() * 0.01)) * 0.5;
            }
        }
    }

    spawnPeanut(position) {
        const peanut = new THREE.Mesh(this.peanutGeo, this.peanutMat);
        peanut.position.copy(position);
        peanut.position.y = 0.5;
        this.scene.add(peanut);
        this.peanuts.push(peanut);
    }

    removeJar(jar) {
        const index = this.jars.indexOf(jar);
        if (index > -1) {
            this.jars.splice(index, 1);
            this.scene.remove(jar);
        }
    }

    removePeanut(peanut) {
        const index = this.peanuts.indexOf(peanut);
        if (index > -1) {
            this.peanuts.splice(index, 1);
            this.scene.remove(peanut);
        }
    }
}
