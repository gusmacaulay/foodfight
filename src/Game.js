import * as THREE from 'three';
import { World } from './World.js';
import { Player } from './Player.js';
import { Projectiles } from './Projectiles.js';
import { Enemies } from './Enemies.js';
import { Boss } from './Boss.js';
import { FlourBagBoss } from './FlourBagBoss.js';
import { PeanutJars } from './PeanutJars.js';
import { EggSystem } from './EggSystem.js';
import { LollySnake } from './LollySnake.js';
import { Cupcake } from './Cupcake.js';
import { BoneSpear } from './BoneSpear.js';
import { Chocolate } from './Chocolate.js';

export class Game {
    constructor() {
        console.log("Game initializing...");
        this.container = document.body;
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x111111, 0.02);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        this.clock = new THREE.Clock();

        // Components
        this.world = new World(this.scene);
        this.player = new Player(this.scene, this.camera);
        this.projectiles = new Projectiles(this.scene);
        this.enemies = new Enemies(this.scene);
        this.peanutJars = new PeanutJars(this.scene);
        this.eggSystem = new EggSystem(this.scene);
        this.lollySnakes = new LollySnake(this.scene);
        this.cupcakes = new Cupcake(this.scene);
        this.chocolates = new Chocolate(this.scene);

        // Game State
        this.states = { MENU: 'MENU', PLAYING: 'PLAYING', VIEWER: 'VIEWER' };
        this.state = this.states.MENU;
        this.playerHealth = 100;
        this.isGameOver = false;
        this.invulnerabilityTimer = 0;
        this.score = 0;
        this.level = 1;
        this.carrotsKilled = 0;
        this.jarsDefeated = 0;
        this.carrotsDefeatedL2 = 0;
        this.eggCount = 1;
        this.boss = null;
        this.bossSpawned = false;
        this.level2BossSpawned = false;
        this.hasBoneSpear = false;
        this.boneSpear = new BoneSpear(this.scene);

        // UI Handles
        this.mainMenu = document.getElementById('main-menu');
        this.levelSelectMenu = document.getElementById('level-select');
        this.gameUI = document.getElementById('game-ui');
        this.viewerUI = document.getElementById('character-viewer');
        this.crosshair = document.getElementById('crosshair');

        // Input state
        this.input = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            shoot: false,
            bomb: false
        };

        this.setupInputs();
        this.setupMenuButtons();
        this.setupLighting();

        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0x404040, 2.0); // Even brighter ambient
        this.scene.add(ambientLight);

        // Directional Light/Sun
        const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        dirLight.position.set(10, 20, 10);
        dirLight.castShadow = true;
        this.scene.add(dirLight);

        // Coil glow look
        const pointLight = new THREE.PointLight(0xffaa00, 2, 100);
        pointLight.position.set(0, 10, 0);
        pointLight.castShadow = true;
        this.scene.add(pointLight);
    }

    setupInputs() {
        window.addEventListener('keydown', (e) => this.handleKey(e, true));
        window.addEventListener('keyup', (e) => this.handleKey(e, false));
        window.addEventListener('mousedown', () => this.handleShoot());

        // Mouse Look
        window.addEventListener('mousemove', (e) => {
            if (this.state === this.states.PLAYING && document.pointerLockElement === this.renderer.domElement) {
                this.input.mouseMoveX = e.movementX || 0;
            }
        });
    }

    handleKey(event, isPressed) {
        switch (event.code) {
            case 'KeyW': this.input.forward = isPressed; break;
            case 'KeyS': this.input.backward = isPressed; break;
            case 'KeyA': this.input.left = isPressed; break;
            case 'KeyD': this.input.right = isPressed; break;
            case 'Space': this.input.bomb = isPressed; break;
            case 'Digit1':
                if (this.hasBoneSpear && this.state === this.states.PLAYING) {
                    if (isPressed && !this.boneSpear.isCharging) {
                        this.boneSpear.startCharging();
                    } else if (!isPressed && this.boneSpear.isCharging) {
                        const direction = new THREE.Vector3();
                        this.player.mesh.getWorldDirection(direction);
                        this.boneSpear.throwSpear(this.player.mesh.position.clone(), direction);
                    }
                }
                break;
        }
    }

    handleShoot() {
        if (this.state === this.states.PLAYING) {
            // Request pointer lock on click
            if (document.pointerLockElement !== this.renderer.domElement) {
                this.renderer.domElement.requestPointerLock();
            }
        }

        if (!this.player.mesh) return;

        // Get direction from player
        const direction = new THREE.Vector3();
        this.player.mesh.getWorldDirection(direction);

        // Spawn pickle
        this.projectiles.shoot(this.player.mesh.position, direction);
    }

    start() {
        this.animate();
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        const dt = this.clock.getDelta();

        if (this.state === this.states.PLAYING && !this.isGameOver) {
            // Updates
            this.player.update(dt, this.input);
            this.projectiles.update(dt);
            this.eggSystem.update(dt);
            this.boneSpear.update(dt);
            if (this.boneSpear.isCharging) {
                this.boneSpear.updateCharge(dt);
                this.updateChargeUI();
            } else {
                this.hideChargeUI();
            }
            if (this.player.mesh) {
                this.enemies.update(dt, this.player.mesh.position);
                this.peanutJars.update(dt, this.player.mesh.position);
                const snakeTargets = this.level === 3 ? this.cupcakes.cupcakes : this.peanutJars.jars;
                this.lollySnakes.update(dt, snakeTargets);
                this.cupcakes.update(dt, this.player.mesh.position);
                this.chocolates.update(dt, this.player.mesh.position);
                if (this.boss) {
                    this.boss.update(dt, this.player.mesh.position);
                }

                // Fall-off detection (Level 3 specific, but safe for all)
                if (this.player.mesh.position.y < -5) {
                    console.log("Player fell off!");
                    this.takeDamage(100); // Instant death
                }
            }

            // Bomb / Jump Input
            if (this.input.bomb && !this.bombDebounce) {
                if (this.eggCount > 0) {
                    this.throwEgg();
                } else {
                    this.player.jump();
                }
                this.bombDebounce = true;
                setTimeout(() => this.bombDebounce = false, 500);
            }

            // Check for Landing Shockwave
            if (this.player.justLanded) {
                this.triggerShockwave();
                this.player.justLanded = false;
            }

            // Collision Detection
            this.checkCollisions();

            // Check for Boss Spawn
            if (this.level === 1 && this.carrotsKilled >= 20 && !this.bossSpawned) {
                this.spawnBoss();
            }

            if (this.level === 2 && this.jarsDefeated >= 12 && this.carrotsDefeatedL2 >= 7 && !this.level2BossSpawned) {
                this.spawnFlourBoss();
            }

            if (this.invulnerabilityTimer > 0) {
                this.invulnerabilityTimer -= dt;
            }

            // Reset mouse delta after consumption
            this.input.mouseMoveX = 0;
        } else if (this.state === this.states.VIEWER) {
            this.updateViewer(dt);
        }

        this.renderer.render(this.scene, this.camera);
    }

    setupMenuButtons() {
        console.log("Setting up menu buttons...");
        const playBtn = document.getElementById('play-btn');
        const modelsBtn = document.getElementById('models-btn');
        const backBtn = document.getElementById('back-btn');
        const fullscreenBtn = document.getElementById('fullscreen-btn');

        // Level Select Buttons
        const ovenBtn = document.getElementById('oven-btn');
        const cupboardBtn = document.getElementById('cupboard-btn');
        const tableBtn = document.getElementById('table-btn');
        const selectBackBtn = document.getElementById('select-back-btn');

        if (playBtn) playBtn.onclick = () => { this.showLevelSelect(); };
        if (modelsBtn) modelsBtn.onclick = () => { console.log("Models clicked"); this.enterViewer(); };
        if (backBtn) backBtn.onclick = () => { console.log("Back clicked"); this.exitViewer(); };
        if (fullscreenBtn) fullscreenBtn.onclick = () => { this.toggleFullscreen(); };

        if (ovenBtn) ovenBtn.onclick = () => this.startAtLevel(1);
        if (cupboardBtn) cupboardBtn.onclick = () => this.startAtLevel(2);
        if (tableBtn) tableBtn.onclick = () => this.startAtLevel(3);
        if (selectBackBtn) selectBackBtn.onclick = () => this.showMainMenu();

        this.viewerIndex = 0;
        this.viewerModels = ['Burger', 'Carrot', 'Roast Chicken', 'Peanut Jar', 'Peanut', 'Egg', 'Lolly Snake', 'Flour Bag', 'Cupcake'];
        const nextBtn = document.getElementById('next-btn');
        const prevBtn = document.getElementById('prev-btn');
        if (nextBtn) nextBtn.onclick = () => this.switchModel(1);
        if (prevBtn) prevBtn.onclick = () => this.switchModel(-1);
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    showLevelSelect() {
        this.mainMenu.style.display = 'none';
        this.levelSelectMenu.style.display = 'block';
    }

    showMainMenu() {
        this.levelSelectMenu.style.display = 'none';
        this.mainMenu.style.display = 'block';
    }

    startAtLevel(level) {
        this.level = level;
        this.state = this.states.PLAYING;
        this.levelSelectMenu.style.display = 'none';
        this.gameUI.style.display = 'block';
        this.crosshair.style.display = 'block';

        if (level === 1) {
            this.world.setupOven();
            this.player.mesh.position.set(-22, 0, -22);
        } else if (level === 2) {
            this.world.setupCupboard();
            this.player.mesh.position.set(-22, 1, -22);

            // Initialization for Cupboard
            this.enemies.isSpawning = true;
            this.enemies.spawnInterval = 2;

            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2;
                const radius = 12 + Math.random() * 3;
                const x = Math.sin(angle) * radius;
                const z = Math.cos(angle) * radius;
                this.peanutJars.spawnJar(new THREE.Vector3(x, 1, z));
            }
            for (let i = 0; i < 2; i++) {
                const x = (Math.random() - 0.5) * 40;
                const z = (Math.random() - 0.5) * 40;
                this.lollySnakes.spawn(new THREE.Vector3(x, 1, z));
            }
        } else if (level === 3) {
            this.world.setupTable();
            this.player.mesh.position.set(-80, 1, -80); // Spawn at edge of big table

            // Initialization for Table (Level 3)
            this.enemies.isSpawning = true;
            this.enemies.spawnInterval = 1.5; // Even faster

            // Spawn Cupcakes
            for (let i = 0; i < 6; i++) {
                const x = (Math.random() - 0.5) * 100;
                const z = (Math.random() - 0.5) * 100;
                this.cupcakes.spawn(new THREE.Vector3(x, 0.6, z));
            }

            // Spawn Lolly Snakes
            for (let i = 0; i < 3; i++) {
                const x = (Math.random() - 0.5) * 80;
                const z = (Math.random() - 0.5) * 80;
                this.lollySnakes.spawn(new THREE.Vector3(x, 1, z));
            }

            // Spawn Chocolates
            for (let i = 0; i < 4; i++) {
                const x = (Math.random() - 0.5) * 60;
                const z = (Math.random() - 0.5) * 60;
                this.chocolates.spawn(new THREE.Vector3(x, 0, z));
            }
        }
    }

    startGame() {
        // Obsolete, replaced by startAtLevel
    }

    enterViewer() {
        this.state = this.states.VIEWER;
        this.mainMenu.style.display = 'none';
        this.viewerUI.style.display = 'flex';

        // Hide player and enemies from main scene (simple way: move camera or hide them)
        this.player.mesh.visible = false;
        this.enemies.enemies.forEach(e => e.visible = false);
        if (this.boss) this.boss.mesh.visible = false;

        this.setupViewerModels();
        this.switchModel(0);
    }

    exitViewer() {
        this.state = this.states.MENU;
        this.viewerUI.style.display = 'none';
        this.mainMenu.style.display = 'block';

        // Restore visibility
        this.player.mesh.visible = true;
        this.enemies.enemies.forEach(e => e.visible = true);
        if (this.boss) this.boss.mesh.visible = true;

        if (this.viewGroup) {
            this.scene.remove(this.viewGroup);
            this.viewGroup = null;
        }
    }

    setupViewerModels() {
        this.viewGroup = new THREE.Group();
        this.scene.add(this.viewGroup);

        // We'll create temporary models for the viewer to avoid messing with game instances
        // or just reposition existing ones. Let's create clones/new ones for simplicity.
        this.viewerMeshes = [];

        // Burger
        const burgerViewer = this.player.mesh.clone();
        burgerViewer.position.set(0, 5, 0); // Position it nicely for viewer
        burgerViewer.visible = false;
        this.viewGroup.add(burgerViewer);
        this.viewerMeshes.push(burgerViewer);

        // Carrot (spawn one)
        const carrotViewer = new THREE.Mesh(this.enemies.carrotGeo, this.enemies.carrotMat);
        const leaf = new THREE.Mesh(this.enemies.leafGeo, this.enemies.leafMat);
        leaf.position.y = 1;
        carrotViewer.add(leaf);
        carrotViewer.position.set(0, 5, 0);
        carrotViewer.visible = false;
        this.viewGroup.add(carrotViewer);
        this.viewerMeshes.push(carrotViewer);

        // Roast Chicken
        const chickenBoss = new Boss(this.scene, null); // Temporary boss model
        const chickenViewer = chickenBoss.mesh;
        chickenViewer.position.set(0, 5, 0);
        chickenViewer.visible = false;
        this.scene.remove(chickenViewer); // Remove from scene, add to group
        this.viewGroup.add(chickenViewer);
        this.viewerMeshes.push(chickenViewer);

        // Peanut Jar
        const jarGroup = new THREE.Group();
        const jar = new THREE.Mesh(this.peanutJars.jarGeo, this.peanutJars.jarMat);
        const lid = new THREE.Mesh(this.peanutJars.lidGeo, this.peanutJars.lidMat);
        lid.position.y = 1.4;
        jarGroup.add(jar);
        jarGroup.add(lid);

        const label = new THREE.Mesh(this.peanutJars.labelGeo, this.peanutJars.labelMat);
        label.position.y = 0;
        jarGroup.add(label);
        jarGroup.position.set(0, 5, 0);
        jarGroup.visible = false;
        this.viewGroup.add(jarGroup);
        this.viewerMeshes.push(jarGroup);

        // Peanut
        const peanutViewer = new THREE.Mesh(this.peanutJars.peanutGeo, this.peanutJars.peanutMat);
        peanutViewer.position.set(0, 5, 0);
        peanutViewer.scale.set(3, 3, 3); // Make it visible in viewer
        peanutViewer.visible = false;
        this.viewGroup.add(peanutViewer);
        this.viewerMeshes.push(peanutViewer);

        // Egg
        const eggViewer = new THREE.Mesh(this.eggSystem.eggGeo, this.eggSystem.eggMat);
        eggViewer.position.set(0, 5, 0);
        eggViewer.scale.set(3, 3, 3);
        eggViewer.visible = false;
        this.viewGroup.add(eggViewer);
        this.viewerMeshes.push(eggViewer);

        // Lolly Snake
        const snakeViewer = this.lollySnakes.spawn(new THREE.Vector3(0, 5, 0));
        snakeViewer.visible = false;
        this.scene.remove(snakeViewer);
        this.viewGroup.add(snakeViewer);
        this.viewerMeshes.push(snakeViewer);

        // Flour Bag
        const flourBossViewer = new FlourBagBoss(this.scene);
        flourBossViewer.mesh.visible = false;
        flourBossViewer.mesh.position.set(0, 3, 0); // Center it
        this.scene.remove(flourBossViewer.mesh);
        this.viewGroup.add(flourBossViewer.mesh);
        this.viewerMeshes.push(flourBossViewer.mesh);

        // Cupcake
        const cupcakeViewer = this.cupcakes.createModel();
        cupcakeViewer.position.set(0, 4, 0);
        cupcakeViewer.scale.set(4, 4, 4);
        cupcakeViewer.visible = false;
        this.viewGroup.add(cupcakeViewer);
        this.viewerMeshes.push(cupcakeViewer);

        // Fix camera for viewer
        this.viewerCameraPos = new THREE.Vector3(0, 7, 15);
    }

    switchModel(dir) {
        if (this.viewerMeshes.length === 0) return; // Ensure models are loaded

        if (this.viewerMeshes[this.viewerIndex]) {
            this.viewerMeshes[this.viewerIndex].visible = false;
        }
        this.viewerIndex = (this.viewerIndex + dir + this.viewerMeshes.length) % this.viewerMeshes.length;
        this.viewerMeshes[this.viewerIndex].visible = true;
        document.getElementById('model-name').innerText = this.viewerModels[this.viewerIndex];
    }

    updateViewer(dt) {
        // Rotate the model
        if (this.viewerMeshes[this.viewerIndex]) {
            this.viewerMeshes[this.viewerIndex].rotation.y += dt;
        }

        // Move camera to viewer position
        this.camera.position.lerp(this.viewerCameraPos, 0.1);
        this.camera.lookAt(0, 5, 0);
    }

    checkCollisions() {
        if (!this.player.mesh) return;

        // Pickle vs All Enemies
        for (const pickle of this.projectiles.pickles) {
            // Check Carrots
            let hit = false;
            for (const enemy of this.enemies.enemies) {
                const dist = pickle.position.distanceTo(enemy.position);
                if (dist < 1.5) {
                    this.enemies.remove(enemy);
                    this.projectiles.removePickle(pickle);
                    this.updateScore(10);
                    this.carrotsKilled++;
                    if (this.level === 2) this.carrotsDefeatedL2++;
                    hit = true;
                    break;
                }
            }
            if (hit) continue;

            // Check Peanut Jars
            for (const jar of this.peanutJars.jars) {
                const dist = pickle.position.distanceTo(jar.position);
                if (dist < 2.0) {
                    jar.userData.health--;
                    this.projectiles.removePickle(pickle);
                    if (jar.userData.health <= 0) {
                        this.peanutJars.removeJar(jar);
                        this.updateScore(50);
                        this.jarsDefeated++;
                    }
                    hit = true;
                    break;
                }
            }
            if (hit) continue;

            // Check Peanuts
            for (const peanut of this.peanutJars.peanuts) {
                const dist = pickle.position.distanceTo(peanut.position);
                if (dist < 1.0) {
                    this.peanutJars.removePeanut(peanut);
                    this.projectiles.removePickle(pickle);
                    this.updateScore(5);
                    hit = true;
                    break;
                }
            }
            if (hit) continue;

            // Check Lolly Snakes
            for (const snake of this.lollySnakes.snakes) {
                const dist = pickle.position.distanceTo(snake.position);
                if (dist < 1.0) {
                    snake.userData.health -= 1;
                    this.projectiles.removePickle(pickle);
                    if (snake.userData.health <= 0) {
                        this.lollySnakes.remove(snake);
                        this.updateScore(20);
                    }
                    hit = true;
                    break;
                }
            }
            if (hit) continue;

            // Check Cupcakes
            for (const cupcake of this.cupcakes.cupcakes) {
                const dist = pickle.position.distanceTo(cupcake.mesh.position);
                if (dist < 1.0) {
                    cupcake.health -= 1;
                    this.projectiles.removePickle(pickle);
                    if (cupcake.health <= 0) {
                        this.cupcakes.remove(cupcake);
                        this.updateScore(15);
                    }
                    hit = true;
                    break;
                }
            }
            if (hit) continue;

            // Check Chocolates
            for (const chocolate of this.chocolates.chocolates) {
                if (chocolate.isExploded) continue;
                const dist = pickle.position.distanceTo(chocolate.mesh.position);
                if (dist < 1.2) {
                    this.chocolates.explode(chocolate);
                    this.projectiles.removePickle(pickle);
                    this.updateScore(20);
                    hit = true;
                    break;
                }
            }
            if (hit) continue;

            // Check Boss
            if (this.boss && !this.boss.isDead) {
                const dist = pickle.position.distanceTo(this.boss.mesh.position);
                if (dist < 4) { // Boss is bigger
                    this.boss.takeDamage(1);
                    this.projectiles.removePickle(pickle);
                    this.updateScore(5);

                    if (this.boss.isDead && this.level === 2) {
                        this.victory();
                    }
                }
            }
        }

        // Enemy vs Player
        if (this.invulnerabilityTimer <= 0) {
            // Carrots (20 damage)
            for (const enemy of this.enemies.enemies) {
                const dist = enemy.position.distanceTo(this.player.mesh.position);
                if (dist < 2.0) {
                    this.takeDamage(20);
                    break;
                }
            }

            // Peanuts (5 damage)
            for (const peanut of this.peanutJars.peanuts) {
                const dist = peanut.position.distanceTo(this.player.mesh.position);
                if (dist < 1.5) {
                    this.takeDamage(5); // 20 of these hit = 100 dmg
                    break;
                }
            }

            // Boss
            if (this.boss && !this.boss.isDead) {
                const dist = this.boss.mesh.position.distanceTo(this.player.mesh.position);
                if (dist < 4) {
                    this.takeDamage(20);
                }
            }
            // Cupcakes (15 damage)
            for (const cupcake of this.cupcakes.cupcakes) {
                const dist = cupcake.mesh.position.distanceTo(this.player.mesh.position);
                if (dist < 1.5) {
                    this.takeDamage(15);
                    break;
                }
            }

            // Chocolates (Explosion managed in system, but check contact here for immediate trigger)
            for (const chocolate of this.chocolates.chocolates) {
                if (chocolate.isExploded) {
                    // Check if player is in explosion radius
                    const dist = chocolate.mesh.position.distanceTo(this.player.mesh.position);
                    if (dist < chocolate.explosionRadius) {
                        this.takeDamage(40); // Explosions hurt!
                        // Maybe add a temporary flag to not take multiple damage from same explosion
                        break;
                    }
                } else {
                    const dist = chocolate.mesh.position.distanceTo(this.player.mesh.position);
                    if (dist < 1.5) {
                        this.chocolates.explode(chocolate);
                        this.takeDamage(20);
                        break;
                    }
                }
            }
        }


        // Bone Spear vs All Enemies
        for (let i = this.boneSpear.spears.length - 1; i >= 0; i--) {
            const spear = this.boneSpear.spears[i];
            const damage = spear.userData.damage;
            let hit = false;

            // Carrots
            for (const enemy of this.enemies.enemies) {
                if (spear.position.distanceTo(enemy.position) < 2) {
                    this.enemies.remove(enemy);
                    this.updateScore(damage);
                    this.carrotsKilled++;
                    if (this.level === 2) this.carrotsDefeatedL2++;
                    hit = true;
                    break;
                }
            }
            if (hit) { this.boneSpear.removeSpear(spear); continue; }

            // Peanut Jars
            for (const jar of this.peanutJars.jars) {
                if (spear.position.distanceTo(jar.position) < 2.5) {
                    jar.userData.health -= 2; // Spear hits harder
                    if (jar.userData.health <= 0) {
                        this.peanutJars.removeJar(jar);
                        this.updateScore(50);
                        this.jarsDefeated++;
                    }
                    hit = true;
                    break;
                }
            }
            if (hit) { this.boneSpear.removeSpear(spear); continue; }

            // Cupcakes
            for (const cupcake of this.cupcakes.cupcakes) {
                if (spear.position.distanceTo(cupcake.mesh.position) < 2) {
                    cupcake.health -= 2;
                    if (cupcake.health <= 0) {
                        this.cupcakes.remove(cupcake);
                        this.updateScore(25);
                    }
                    hit = true;
                    break;
                }
            }
            if (hit) { this.boneSpear.removeSpear(spear); continue; }

            // Boss
            if (this.boss && !this.boss.isDead) {
                if (spear.position.distanceTo(this.boss.mesh.position) < 5) {
                    this.boss.takeDamage(damage);
                    this.boneSpear.removeSpear(spear);
                    continue;
                }
            }
        }


        // Burger vs Egg Pickups
        for (const egg of this.eggSystem.pickups) {
            const dist = egg.position.distanceTo(this.player.mesh.position);
            if (dist < 2.0) {
                this.eggSystem.removePickup(egg);
                this.eggCount++;
                this.updateHealthUI(); // Reuse to update eggs too
                break;
            }
        }

        // Egg Explosions vs Enemies
        for (const exp of this.eggSystem.explosions) {
            const radius = exp.userData.radius;
            // Carrots
            for (const enemy of this.enemies.enemies) {
                if (exp.position.distanceTo(enemy.position) < radius) {
                    this.enemies.remove(enemy);
                    this.updateScore(10);
                    this.carrotsKilled++;
                    if (this.level === 2) this.carrotsDefeatedL2++;
                }
            }
            // Peanut Jars
            for (const jar of this.peanutJars.jars) {
                if (exp.position.distanceTo(jar.position) < radius) {
                    this.peanutJars.removeJar(jar);
                    this.updateScore(50);
                    this.jarsDefeated++;
                }
            }
            // Peanuts
            for (const peanut of this.peanutJars.peanuts) {
                if (exp.position.distanceTo(peanut.position) < radius) {
                    this.peanutJars.removePeanut(peanut);
                    this.updateScore(5);
                }
            }
            // Cupcakes
            for (const cupcake of this.cupcakes.cupcakes) {
                if (exp.position.distanceTo(cupcake.mesh.position) < radius) {
                    this.cupcakes.remove(cupcake);
                    this.updateScore(15);
                }
            }
        }

        // Randomly spawn an egg in the middle area
        if (this.eggSystem.pickups.length < 2 && Math.random() < 0.005) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 10;
            const x = Math.sin(angle) * radius;
            const z = Math.cos(angle) * radius;
            this.eggSystem.spawnPickup(new THREE.Vector3(x, 0.5, z));
        }
    }

    throwEgg() {
        const direction = new THREE.Vector3();
        this.player.mesh.getWorldDirection(direction);
        this.eggSystem.throwEgg(this.player.mesh.position.clone(), direction);
        this.eggCount--;
        this.updateHealthUI();
    }

    triggerShockwave() {
        if (!this.player.mesh) return;
        const pos = this.player.mesh.position.clone();
        this.eggSystem.createShockwave(pos);
    }

    spawnBoss() {
        this.bossSpawned = true;
        this.enemies.stopSpawning();
        this.boss = new Boss(this.scene, () => this.winLevel());

        const instructions = document.getElementById('instructions');
        if (instructions) instructions.innerText = "BOSS FIGHT: ROAST CHICKEN!";
    }

    spawnFlourBoss() {
        this.level2BossSpawned = true;
        this.enemies.stopSpawning();

        // Wipe all enemies
        while (this.enemies.enemies.length > 0) this.enemies.remove(this.enemies.enemies[0]);
        while (this.peanutJars.jars.length > 0) this.peanutJars.removeJar(this.peanutJars.jars[0]);
        while (this.peanutJars.peanuts.length > 0) this.peanutJars.removePeanut(this.peanutJars.peanuts[0]);
        while (this.lollySnakes.snakes.length > 0) this.lollySnakes.remove(this.lollySnakes.snakes[0]);

        this.boss = new FlourBagBoss(this.scene);

        const instructions = document.getElementById('instructions');
        if (instructions) instructions.innerText = "BOSS FIGHT: THE FLOUR BAG!";
    }

    victory() {
        const instructions = document.getElementById('instructions');
        if (instructions) instructions.innerText = "LEVEL CLEAR! ENTERING THE DINING ROOM...";

        this.updateScore(1000);

        setTimeout(() => {
            this.startAtLevel(3);
        }, 5000);
    }

    winLevel() {
        // Transition to Level 2
        this.level = 2;
        this.hasBoneSpear = true; // Unlock Bone Spear!
        const instructions = document.getElementById('instructions');
        if (instructions) instructions.innerText = "BONE SPEAR UNLOCKED! Press 1 to charge!";

        setTimeout(() => {
            this.world.setupCupboard();
            this.player.mesh.position.set(-22, 1, -22); // Reset position to edge

            if (instructions) instructions.innerText = "LEVEL 2: THE CUPBOARD";

            // Resume carrot spawning for Level 2
            this.enemies.isSpawning = true;
            this.enemies.spawnInterval = 2; // Slightly faster

            // Spawn Peanut Jars in a central ring
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2;
                const radius = 12 + Math.random() * 3;
                const x = Math.sin(angle) * radius;
                const z = Math.cos(angle) * radius;
                this.peanutJars.spawnJar(new THREE.Vector3(x, 1, z));
            }

            // Spawn Lolly Snakes
            for (let i = 0; i < 2; i++) {
                const x = (Math.random() - 0.5) * 40;
                const z = (Math.random() - 0.5) * 40;
                this.lollySnakes.spawn(new THREE.Vector3(x, 1, z));
            }
        }, 2000);
    }

    takeDamage(amount = 20) {
        this.playerHealth -= amount;
        this.invulnerabilityTimer = 1.5;
        this.updateHealthUI();

        // Flash player
        this.player.flashRed();
        // Take a bite!
        this.player.takeBite();

        if (this.playerHealth <= 0) {
            this.playerHealth = 0;
            this.updateHealthUI();
            this.gameOver();
        }
    }

    updateHealthUI() {
        const healthEl = document.getElementById('health');
        if (healthEl) healthEl.innerText = `Health: ${this.playerHealth}`;
        const eggsEl = document.getElementById('egg-count');
        if (eggsEl) eggsEl.innerText = `Eggs: ${this.eggCount}`;
    }

    gameOver() {
        this.isGameOver = true;
        const gameOverEl = document.getElementById('game-over');
        if (gameOverEl) gameOverEl.style.display = 'block';
        const crosshairEl = document.getElementById('crosshair');
        if (crosshairEl) crosshairEl.style.display = 'none';

        this.player.explodeIntoCrumbs();
    }

    updateScore(points) {
        this.score += points;
        document.getElementById('score').innerText = `Score: ${this.score}`;
    }

    updateChargeUI() {
        const chargeBar = document.getElementById('charge-bar');
        const chargeContainer = document.getElementById('charge-container');
        if (chargeContainer) chargeContainer.style.display = 'block';
        if (chargeBar) {
            const percent = this.boneSpear.getChargePercent() * 100;
            chargeBar.style.width = percent + '%';
        }
    }

    hideChargeUI() {
        const chargeContainer = document.getElementById('charge-container');
        if (chargeContainer) chargeContainer.style.display = 'none';
    }
}
