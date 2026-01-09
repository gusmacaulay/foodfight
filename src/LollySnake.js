import * as THREE from 'three';

export class LollySnake {
    constructor(scene) {
        this.scene = scene;
        this.snakes = [];
        this.segmentGeo = new THREE.SphereGeometry(0.3, 8, 8);
    }

    spawn(position) {
        const snakeGroup = new THREE.Group();
        const segments = [];
        const snakeColors = [0x00ff00, 0xff0000, 0x0000ff]; // Green, Red, Blue

        for (let i = 0; i < 10; i++) {
            const segmentColor = snakeColors[i % snakeColors.length];
            const mat = new THREE.MeshStandardMaterial({
                color: segmentColor,
                emissive: segmentColor,
                emissiveIntensity: 0.2
            });
            const segment = new THREE.Mesh(this.segmentGeo, mat);
            segment.position.set(0, 0, -i * 0.4);
            snakeGroup.add(segment);
            segments.push(segment);
        }

        // Eyes for the first segment
        const eyeGeo = new THREE.SphereGeometry(0.1, 8, 8);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.15, 0.15, 0.2);
        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.15, 0.15, 0.2);
        segments[0].add(leftEye);
        segments[0].add(rightEye);

        snakeGroup.position.copy(position);
        snakeGroup.userData = {
            segments: segments,
            targetJar: null,
            state: 'SEARCHING', // SEARCHING, COILING
            coilingAngle: 0,
            health: 2
        };

        this.scene.add(snakeGroup);
        this.snakes.push(snakeGroup);
        return snakeGroup;
    }

    update(dt, targets) {
        for (let i = this.snakes.length - 1; i >= 0; i--) {
            const snake = this.snakes[i];
            const data = snake.userData;

            if (data.state === 'SEARCHING') {
                this.updateSearching(snake, targets, dt);
            } else if (data.state === 'COILING') {
                this.updateCoiling(snake, dt);
            }

            // Segment follow logic (slight delay sensation)
            for (let j = data.segments.length - 1; j > 0; j--) {
                const seg = data.segments[j];
                const prevSeg = data.segments[j - 1];
                seg.position.lerp(prevSeg.position.clone().add(new THREE.Vector3(0, 0, -0.4)), 0.1);
            }
        }
    }

    // Helper to get target information consistently
    getTargetInfo(target) {
        if (!target) return null;

        // If it's a THREE character/mesh (like Jar)
        if (target.position && target.userData) {
            return { position: target.position, health: target.userData.health, isObject: true };
        }
        // If it's a data object (like Cupcake)
        if (target.mesh && target.health !== undefined) {
            return { position: target.mesh.position, health: target.health, isObject: false };
        }
        return null;
    }

    updateSearching(snake, targets, dt) {
        const data = snake.userData;

        // Check if current target is valid
        let targetInfo = this.getTargetInfo(data.target);
        if (!targetInfo || targetInfo.health <= 0) {
            data.target = null;
            targetInfo = null;
        }

        if (!data.target) {
            // Find nearest target
            let minDist = Infinity;
            let nearest = null;
            for (const t of targets) {
                const info = this.getTargetInfo(t);
                if (!info || info.health <= 0) continue;

                const d = snake.position.distanceTo(info.position);
                if (d < minDist) {
                    minDist = d;
                    nearest = t;
                }
            }
            data.target = nearest;
            targetInfo = this.getTargetInfo(nearest);
        }

        if (targetInfo) {
            const dir = new THREE.Vector3().subVectors(targetInfo.position, snake.position).normalize();
            snake.lookAt(targetInfo.position);
            snake.position.addScaledVector(dir, 5 * dt);

            if (snake.position.distanceTo(targetInfo.position) < 2) {
                data.state = 'COILING';
                data.coilingAngle = 0;
            }
        }
    }

    updateCoiling(snake, dt) {
        const data = snake.userData;
        let targetInfo = this.getTargetInfo(data.target);

        if (!targetInfo || targetInfo.health <= 0) {
            data.state = 'SEARCHING';
            data.target = null;
            return;
        }

        data.coilingAngle += dt * 2;
        const radius = 1.5;
        const x = Math.cos(data.coilingAngle) * radius;
        const z = Math.sin(data.coilingAngle) * radius;
        const y = 0.5 + Math.sin(data.coilingAngle * 0.5) * 1.0;

        // Move head towards the orbit position
        const targetPos = targetInfo.position.clone().add(new THREE.Vector3(x, y, z));
        snake.position.lerp(targetPos, 0.1);
        snake.lookAt(targetPos.clone().add(new THREE.Vector3(-Math.sin(data.coilingAngle), 0, Math.cos(data.coilingAngle))));

        // Heal the target
        if (Math.random() < 0.01) {
            const maxHealth = targetInfo.isObject ? 3 : 2; // Jar vs Cupcake
            if (targetInfo.health < maxHealth) {
                if (targetInfo.isObject) {
                    data.target.userData.health = Math.min(maxHealth, data.target.userData.health + 0.1);
                } else {
                    data.target.health = Math.min(maxHealth, data.target.health + 0.1);
                }
            }
        }
    }

    remove(snake) {
        const index = this.snakes.indexOf(snake);
        if (index > -1) {
            this.snakes.splice(index, 1);
            this.scene.remove(snake);
        }
    }
}
