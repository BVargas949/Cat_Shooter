// --Tutorial Used: Creating Space Invaders in JavaScript by Frederick De Blesser--
// Listens to see when the jumbotron button is pushed
document.getElementById("start_button").addEventListener("mousedown", function () {
    // Ensures that the Start Game button actually runs an event when clicked.
    // this uses jQuery to select the intro card and make it fade out over 2000 milliseconds (2 seconds)
    $("#introCard").fadeOut(1000);
    setTimeout(function gameRun() {
        //The following const lines create global variables which will be used throughout the program in other functions. 
        //Key Codes 
        const KEY_CODE_LEFT = 37;
        const KEY_CODE_RIGHT = 39;
        const KEY_CODE_SPACE = 32;

        //Game Area
        const GAME_WIDTH = 1200;
        const GAME_HEIGHT = 560;

        // Player Values : size, speed, projectile speed, projectile cooldown
        const PLAYER_WIDTH = 10;
        const PLAYER_MAX_SPEED = 700.0;
        const LASER_MAX_SPEED = 400.0;
        const LASER_COOLDOWN = 0.4;

        // Enemy Values: enemy amount, enemy spacing, enemy projectile cooldown
        const ENEMIES_PER_ROW = 8;
        const ENEMY_HORIZONTAL_PADDING = 80;
        const ENEMY_VERTICAL_PADDING = 70;
        const ENEMY_VERTICAL_SPACING = 80;
        const ENEMY_COOLDOWN = 4.0;

        // Begins the game with no keys being pressed, player being still, and gameOver not initialized
        const GAME_STATE = {
            lastTime: Date.now(),
            leftPressed: false,
            rightPressed: false,
            spacePressed: false,
            playerX: 0,
            playerY: 0,
            playerCooldown: 0,
            lasers: [],
            enemies: [],
            enemyLasers: [],
            gameOver: false
        };

        // Arrow Function
        // 
        rectsIntersect = (r1, r2) => {
            return !(
                r2.left > r1.right ||
                r2.right < r1.left ||
                r2.top > r1.bottom ||
                r2.bottom < r1.top
            );
        }

        // Sets position of the element
        function setPosition(el, x, y) {
            // Template Literal 
            el.style.transform = `translate(${x}px, ${y}px)`;
        }

        // Arrow Function
        clamp = (v, min, max) => {
            if (v < min) {
                return min;
            } else if (v > max) {
                return max;
            } else {
                return v;
            }
        }

        function rand(min, max) {
            if (min === undefined) min = 0;
            if (max === undefined) max = 1;
            return min + Math.random() * (max - min);
        }

        // Creates player on the screen, setting its position
        function createPlayer($container) {
            GAME_STATE.playerX = GAME_WIDTH / 2;
            GAME_STATE.playerY = GAME_HEIGHT - 50;
            const $player = document.createElement("img");
            $player.src = "cat.png";
            $player.className = "player";
            $container.appendChild($player);
            setPosition($player, GAME_STATE.playerX, GAME_STATE.playerY);
        }

        // Allows for the player to be removed from screen when the player has lost
        function destroyPlayer($container, player) {
            $container.removeChild(player);
            GAME_STATE.gameOver = true;
        }

        // Updates the player sprite in order to allow the player to move on the screen when pressing certain specified keys
        function updatePlayer(dt, $container) {
            if (GAME_STATE.leftPressed) {
                GAME_STATE.playerX -= dt * PLAYER_MAX_SPEED;
            }
            if (GAME_STATE.rightPressed) {
                GAME_STATE.playerX += dt * PLAYER_MAX_SPEED;
            }

            GAME_STATE.playerX = clamp(
                GAME_STATE.playerX,
                PLAYER_WIDTH,
                GAME_WIDTH - PLAYER_WIDTH
            );

            if (GAME_STATE.spacePressed && GAME_STATE.playerCooldown <= 0) {
                createLaser($container, GAME_STATE.playerX, GAME_STATE.playerY);
                GAME_STATE.playerCooldown = LASER_COOLDOWN;
            }
            if (GAME_STATE.playerCooldown > 0) {
                GAME_STATE.playerCooldown -= dt;
            }

            const player = document.querySelector(".player");
            setPosition(player, GAME_STATE.playerX, GAME_STATE.playerY);
        }

        // Creates the cat that is being used as the projectile by the player
        function createLaser($container, x, y) {
            const $element = document.createElement("img");
            $element.src = "pixel_cat.png";
            $element.className = "laser";
            $container.appendChild($element);
            const laser = { x, y, $element };
            GAME_STATE.lasers.push(laser);
            setPosition($element, x, y);
        }

        // Updates the projectile sprite in order to respond to the player 
        function updateLasers(dt, $container) {
            const lasers = GAME_STATE.lasers;
            for (let i = 0; i < lasers.length; i++) {
                const laser = lasers[i];
                laser.y -= dt * LASER_MAX_SPEED;
                if (laser.y < 0) {
                    destroyLaser($container, laser);
                }
                setPosition(laser.$element, laser.x, laser.y);
                const r1 = laser.$element.getBoundingClientRect();
                const enemies = GAME_STATE.enemies;
                for (let j = 0; j < enemies.length; j++) {
                    const enemy = enemies[j];
                    if (enemy.isDead) continue;
                    const r2 = enemy.$element.getBoundingClientRect();
                    if (rectsIntersect(r1, r2)) {
                        // Enemy was hit
                        destroyEnemy($container, enemy);
                        destroyLaser($container, laser);
                        break;
                    }
                }
            }
            GAME_STATE.lasers = GAME_STATE.lasers.filter(e => !e.isDead);
        }

        // Detect when the player is hit in order to prompt the Game Over screen
        function destroyLaser($container, laser) {
            $container.removeChild(laser.$element);
            laser.isDead = true;
        }

        // Creates the enemies on screen, writing them into the HTML without having to repeat the image over and over again in the HTML
        function createEnemy($container, x, y) {
            const $element = document.createElement("img");
            $element.src = "enemy_ship.png";
            $element.className = "enemy";
            $container.appendChild($element);
            const enemy = {
                x,
                y,
                cooldown: rand(0.5, ENEMY_COOLDOWN),
                $element
            };
            GAME_STATE.enemies.push(enemy);
            setPosition($element, x, y);
        }

        // Allows the characters to move on screen, both in side to side while also in a circular motion
        function updateEnemies(dt, $container) {
            const dx = Math.sin(GAME_STATE.lastTime / 1000.0) * 40;
            const dy = Math.cos(GAME_STATE.lastTime / 1000.0) * 20;

            const enemies = GAME_STATE.enemies;
            for (let i = 0; i < enemies.length; i++) {
                const enemy = enemies[i];
                const x = enemy.x + dx;
                const y = enemy.y + dy;
                setPosition(enemy.$element, x, y);
                enemy.cooldown -= dt;
                if (enemy.cooldown <= 0) {
                    createEnemyLaser($container, x, y);
                    enemy.cooldown = ENEMY_COOLDOWN;
                }
            }
            GAME_STATE.enemies = GAME_STATE.enemies.filter(e => !e.isDead);
        }

        // Destroys an enemy upon being hit by one of the players projectiles
        function destroyEnemy($container, enemy) {
            $container.removeChild(enemy.$element);
            enemy.isDead = true;
        }

        // Creates the blast that will be shot by the enemy towards the player sprite
        function createEnemyLaser($container, x, y) {
            const $element = document.createElement("img");
            $element.src = "enemy-fire.png";
            $element.className = "enemy-laser";
            $container.appendChild($element);
            const laser = { x, y, $element };
            GAME_STATE.enemyLasers.push(laser);
            setPosition($element, x, y);
        }

        // Allows for the enemy blasts to move on screen, going downwards towards the player 
        function updateEnemyLasers(dt, $container) {
            const lasers = GAME_STATE.enemyLasers;
            for (let i = 0; i < lasers.length; i++) {
                const laser = lasers[i];
                laser.y += dt * LASER_MAX_SPEED;
                if (laser.y > GAME_HEIGHT) {
                    destroyLaser($container, laser);
                }
                setPosition(laser.$element, laser.x, laser.y);
                const r1 = laser.$element.getBoundingClientRect();
                const player = document.querySelector(".player");
                const r2 = player.getBoundingClientRect();
                if (rectsIntersect(r1, r2)) {
                    // Player was hit
                    destroyPlayer($container, player);
                    break;
                }
            }
            GAME_STATE.enemyLasers = GAME_STATE.enemyLasers.filter(e => !e.isDead);
        }

        // 
        function init() {
            const $container = document.querySelector(".game");
            createPlayer($container);

            const enemySpacing = (GAME_WIDTH - ENEMY_HORIZONTAL_PADDING * 2) / (ENEMIES_PER_ROW - 1);
            for (let j = 0; j < 3; j++) {
                const y = ENEMY_VERTICAL_PADDING + j * ENEMY_VERTICAL_SPACING;
                for (let i = 0; i < ENEMIES_PER_ROW; i++) {
                    const x = i * enemySpacing + ENEMY_HORIZONTAL_PADDING;
                    createEnemy($container, x, y);
                }
            }
        }

        // 
        function playerHasWon() {
            return GAME_STATE.enemies.length === 0;
        }

        // 
        function update(e) {
            const currentTime = Date.now();
            const dt = (currentTime - GAME_STATE.lastTime) / 1000.0;

            if (GAME_STATE.gameOver) {
                document.querySelector(".game-over").style.display = "block";
                return;
            }

            if (playerHasWon()) {
                document.querySelector(".victory").style.display = "block";
                return;
            }

            const $container = document.querySelector(".game");
            updatePlayer(dt, $container);
            updateLasers(dt, $container);
            updateEnemies(dt, $container);
            updateEnemyLasers(dt, $container);

            GAME_STATE.lastTime = currentTime;
            window.requestAnimationFrame(update);
        }

        // 
        function onKeyDown(e) {
            if (e.keyCode === KEY_CODE_LEFT) {
                GAME_STATE.leftPressed = true;
            } else if (e.keyCode === KEY_CODE_RIGHT) {
                GAME_STATE.rightPressed = true;
            } else if (e.keyCode === KEY_CODE_SPACE) {
                GAME_STATE.spacePressed = true;
            }
        }

        // 
        function onKeyUp(e) {
            if (e.keyCode === KEY_CODE_LEFT) {
                GAME_STATE.leftPressed = false;
            } else if (e.keyCode === KEY_CODE_RIGHT) {
                GAME_STATE.rightPressed = false;
            } else if (e.keyCode === KEY_CODE_SPACE) {
                GAME_STATE.spacePressed = false;
            }
        }

        // 
        init();
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);
        window.requestAnimationFrame(update);
    }
        , 1000);
});