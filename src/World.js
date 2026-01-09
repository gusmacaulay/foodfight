import * as THREE from 'three';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.currentLevelGroup = new THREE.Group();
        this.scene.add(this.currentLevelGroup);
        this.setupOven();
    }

    clearLevel() {
        this.scene.remove(this.currentLevelGroup);
        this.currentLevelGroup = new THREE.Group();
        this.scene.add(this.currentLevelGroup);
    }

    setupOven() {
        this.clearLevel();

        // Floor
        const floorGeometry = new THREE.PlaneGeometry(50, 50);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,
            metalness: 0.5,
            roughness: 0.2
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.currentLevelGroup.add(floor);

        // Walls
        const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x888888, side: THREE.DoubleSide });
        const wallGeometry = new THREE.PlaneGeometry(50, 20);

        // Back Wall
        const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
        backWall.position.set(0, 10, -25);
        backWall.receiveShadow = true;
        this.currentLevelGroup.add(backWall);

        // Left Wall
        const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
        leftWall.position.set(-25, 10, 0);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.receiveShadow = true;
        this.currentLevelGroup.add(leftWall);

        // Right Wall
        const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
        rightWall.position.set(25, 10, 0);
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.receiveShadow = true;
        this.currentLevelGroup.add(rightWall);

        // Front Wall
        const frontWall = new THREE.Mesh(wallGeometry, wallMaterial);
        frontWall.position.set(0, 10, 25);
        frontWall.rotation.y = Math.PI;
        frontWall.receiveShadow = true;
        this.currentLevelGroup.add(frontWall);

        // Ceiling
        const ceiling = new THREE.Mesh(floorGeometry, wallMaterial);
        ceiling.position.set(0, 20, 0);
        ceiling.rotation.x = Math.PI / 2;
        this.currentLevelGroup.add(ceiling);

        this.createCoils();
        this.addOvenDetails();
    }

    addOvenDetails() {
        const canGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.2, 12);
        const jarGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.8, 8);

        for (let i = 0; i < 4; i++) {
            const isCan = Math.random() > 0.5;
            const mat = new THREE.MeshStandardMaterial({
                color: new THREE.Color().setHSL(Math.random(), 0.5, 0.4)
            });
            const detail = new THREE.Mesh(isCan ? canGeo : jarGeo, mat);
            const x = (Math.random() - 0.5) * 40;
            const z = (Math.random() - 0.5) * 40;
            detail.position.set(x, isCan ? 0.6 : 0.4, z);
            detail.receiveShadow = true;
            detail.castShadow = true;
            this.currentLevelGroup.add(detail);
        }
    }

    createCoils() {
        const coilMaterial = new THREE.MeshBasicMaterial({ color: 0xff3300 });
        for (let i = 0; i < 5; i++) {
            const coilGeometry = new THREE.CylinderGeometry(0.5, 0.5, 40, 16);
            const coil = new THREE.Mesh(coilGeometry, coilMaterial);
            coil.rotation.z = Math.PI / 2;
            coil.position.set(0, 18, -20 + i * 10);
            this.currentLevelGroup.add(coil);
        }
    }

    setupCupboard() {
        this.clearLevel();

        // Floor (Dark Wood)
        const floorGeo = new THREE.PlaneGeometry(60, 60);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x3d2b1f, // Dark Brown
            roughness: 0.8
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.currentLevelGroup.add(floor);

        // Walls (Wooden Panels)
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, side: THREE.DoubleSide });
        const wallGeo = new THREE.PlaneGeometry(60, 30);

        const backWall = new THREE.Mesh(wallGeo, wallMat);
        backWall.position.set(0, 15, -30);
        this.currentLevelGroup.add(backWall);

        const leftWall = new THREE.Mesh(wallGeo, wallMat);
        leftWall.position.set(-30, 15, 0);
        leftWall.rotation.y = Math.PI / 2;
        this.currentLevelGroup.add(leftWall);

        const rightWall = new THREE.Mesh(wallGeo, wallMat);
        rightWall.position.set(30, 15, 0);
        rightWall.rotation.y = -Math.PI / 2;
        this.currentLevelGroup.add(rightWall);

        // Front Wall
        const frontWall = new THREE.Mesh(wallGeo, wallMat);
        frontWall.position.set(0, 15, 30);
        frontWall.rotation.y = Math.PI;
        this.currentLevelGroup.add(frontWall);

        // Ceiling
        const ceiling = new THREE.Mesh(floorGeo, wallMat);
        ceiling.position.set(0, 30, 0);
        ceiling.rotation.x = Math.PI / 2;
        this.currentLevelGroup.add(ceiling);

        // Shelves
        const shelfGeo = new THREE.BoxGeometry(60, 1, 10);
        const shelfMat = new THREE.MeshStandardMaterial({ color: 0x4b3621 });

        for (let i = 0; i < 3; i++) {
            const shelf = new THREE.Mesh(shelfGeo, shelfMat);
            shelf.position.set(0, 5 + i * 8, -25);
            shelf.receiveShadow = true;
            this.currentLevelGroup.add(shelf);

            // Add Food Boxes/Cans to shelf
            const boxGeo = new THREE.BoxGeometry(1.5, 2.5, 1.5);
            const canGeo = new THREE.CylinderGeometry(0.6, 0.6, 1.2, 12);
            for (let j = 0; j < 6; j++) {
                const isBox = Math.random() > 0.4;
                const itemMat = new THREE.MeshStandardMaterial({
                    color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5)
                });
                const item = new THREE.Mesh(isBox ? boxGeo : canGeo, itemMat);
                item.position.set(-20 + j * 8 + (Math.random() - 0.5) * 2, 1.3 + (i * 8) + 5, -25);
                item.receiveShadow = true;
                item.castShadow = true;
                this.currentLevelGroup.add(item);
            }
        }

        // Ambient Light change? (Handled in Game.js usually)
    }

    setupTable() {
        this.clearLevel();

        // Massive Floor (Table Wood)
        const floorGeo = new THREE.PlaneGeometry(200, 200);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x8b4513, // Saddle Brown
            roughness: 0.6,
            metalness: 0.1
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.currentLevelGroup.add(floor);

        // No walls! That's the challenge.

        // Add some table details (plates)
        const plateGeo = new THREE.CylinderGeometry(4, 4, 0.2, 32);
        const plateMat = new THREE.MeshStandardMaterial({ color: 0xffffff });

        // Cupcake parts (definitions outside loop)
        const cakeGeo = new THREE.CylinderGeometry(0.5, 0.4, 0.6, 12);
        const frostingGeo = new THREE.SphereGeometry(0.4, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
        const cherryGeo = new THREE.SphereGeometry(0.1, 8, 8);
        const eyeGeo = new THREE.SphereGeometry(0.05, 8, 8);
        const mouthGeo = new THREE.TorusGeometry(0.15, 0.02, 8, 16, Math.PI);

        const cakeMat = new THREE.MeshStandardMaterial({ color: 0xeedd88 });
        const frostMat = new THREE.MeshStandardMaterial({ color: 0xff69b4 });
        const cherryMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0xff1493 });
        const mouthMat = new THREE.MeshStandardMaterial({ color: 0x000000 });

        for (let i = 0; i < 4; i++) {
            const plate = new THREE.Mesh(plateGeo, plateMat);
            const x = (i % 2 === 0 ? 1 : -1) * 30;
            const z = (i < 2 ? 1 : -1) * 30;
            plate.position.set(x, 0.1, z);
            plate.receiveShadow = true;
            this.currentLevelGroup.add(plate);

            // Create Cupcake
            const cake = new THREE.Mesh(cakeGeo, cakeMat);
            cake.position.set(x, 0.4, z);
            cake.castShadow = true;
            this.currentLevelGroup.add(cake);

            const frosting = new THREE.Mesh(frostingGeo, frostMat);
            frosting.position.set(x, 0.7, z);
            frosting.scale.set(1.2, 1, 1.2);
            frosting.castShadow = true;
            this.currentLevelGroup.add(frosting);

            const cherry = new THREE.Mesh(cherryGeo, cherryMat);
            cherry.position.set(x, 1.1, z);
            cherry.castShadow = true;
            this.currentLevelGroup.add(cherry);

            // Facial Features
            const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
            leftEye.position.set(x - 0.2, 0.8, z + 0.35);
            this.currentLevelGroup.add(leftEye);

            const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
            rightEye.position.set(x + 0.2, 0.8, z + 0.35);
            this.currentLevelGroup.add(rightEye);

            const mouth = new THREE.Mesh(mouthGeo, mouthMat);
            mouth.position.set(x, 0.7, z + 0.38);
            mouth.rotation.x = Math.PI;
            this.currentLevelGroup.add(mouth);
        }
    }
}
