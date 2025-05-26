(function() {
    // Constantes para valores fixos
    const CANVAS_WIDTH = 480;
    const CANVAS_HEIGHT = 320;
    const PADDLE_SPEED = 7;
    const BALL_RADIUS = 10;
    const INITIAL_BALL_SPEED = 2;

    // Variáveis globais
    let canvas = document.getElementById("gameCanvas");
    let ctx = canvas.getContext("2d");
    let ball = { x: 0, y: 0, dx: 0, dy: 0, radius: BALL_RADIUS };
    let paddle = { x: 0, width: 75, height: 10 };
    let bricks = [];
    let score = 0;
    let lives = 3; // Sistema de vidas
    let phase = 1;
    const maxPhase = 3;
    let ballSpeedMultiplier = 1;
    let rightPressed = false;
    let leftPressed = false;
    let isPaused = false; // Estado de pausa

    // Sons (opcional, descomentar se arquivos de áudio estiverem disponíveis)
    // let brickSound = new Audio('brick.wav');
    // let paddleSound = new Audio('paddle.wav');
    // let wallSound = new Audio('wall.wav');

    // Inicializa o jogo com base na dificuldade
    function startGame(dificuldade) {
        if (!canvas.getContext) {
            alert("Canvas não suportado no seu navegador!");
            return;
        }
        if (!["facil", "medio", "dificil"].includes(dificuldade)) {
            console.error("Dificuldade inválida:", dificuldade);
            dificuldade = "facil";
        }
        ballSpeedMultiplier = dificuldade === "facil" ? 1 : dificuldade === "medio" ? 1.5 : 2;
        document.getElementById("menu").style.display = "none";
        canvas.style.display = "block";
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
        initGame();
        draw();
    }

    // Inicializa objetos do jogo
    function initGame() {
        ball.x = canvas.width / 2;
        ball.y = canvas.height - 30;
        ball.dx = INITIAL_BALL_SPEED * ballSpeedMultiplier;
        ball.dy = -INITIAL_BALL_SPEED * ballSpeedMultiplier;
        paddle.x = (canvas.width - paddle.width) / 2;
        initBricks();
    }

    // Inicializa blocos
    function initBricks() {
        bricks.brickColumnCount = 5;
        bricks.brickRowCount = 2 + phase; // Aumenta linhas por fase
        bricks.brickWidth = 75;
        bricks.brickHeight = 20;
        bricks.brickPadding = 10;
        bricks.brickOffsetTop = 30;
        bricks.brickOffsetLeft = 30;
        for (let c = 0; c < bricks.brickColumnCount; c++) {
            bricks[c] = [];
            for (let r = 0; r < bricks.brickRowCount; r++) {
                bricks[c][r] = { x: 0, y: 0, status: 1 };
                bricks[c][r].x = c * (bricks.brickWidth + bricks.brickPadding) + bricks.brickOffsetLeft;
                bricks[c][r].y = r * (bricks.brickHeight + bricks.brickPadding) + bricks.brickOffsetTop;
            }
        }
    }

    // Desenha a bola
    function drawBall() {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#0095DD";
        ctx.fill();
        ctx.closePath();
    }

    // Desenha a raquete
    function drawPaddle() {
        ctx.beginPath();
        ctx.rect(paddle.x, canvas.height - paddle.height, paddle.width, paddle.height);
        ctx.fillStyle = "#0095DD";
        ctx.fill();
        ctx.closePath();
    }

    // Desenha os blocos
    function drawBricks() {
        for (let c = 0; c < bricks.brickColumnCount; c++) {
            for (let r = 0; r < bricks.brickRowCount; r++) {
                if (bricks[c][r].status === 1) {
                    ctx.beginPath();
                    ctx.rect(bricks[c][r].x, bricks[c][r].y, bricks.brickWidth, bricks.brickHeight);
                    ctx.fillStyle = phase === 1 ? "green" : phase === 2 ? "orange" : "red";
                    ctx.fill();
                    ctx.closePath();
                }
            }
        }
    }

    // Desenha a pontuação
    function drawScore() {
        ctx.font = "16px Arial";
        ctx.fillStyle = "#FFF";
        ctx.fillText("Pontuação: " + score, 8, 20);
    }

    // Desenha as vidas
    function drawLives() {
        ctx.font = "16px Arial";
        ctx.fillStyle = "#FFF";
        ctx.fillText("Vidas: " + lives, canvas.width - 65, 20);
    }

    // Detecta colisões com blocos
    function collisionDetection() {
        for (let c = 0; c < bricks.brickColumnCount; c++) {
            for (let r = 0; r < bricks.brickRowCount; r++) {
                let b = bricks[c][r];
                if (b.status === 1) {
                    if (
                        ball.x > b.x &&
                        ball.x < b.x + bricks.brickWidth &&
                        ball.y > b.y &&
                        ball.y < b.y + bricks.brickHeight
                    ) {
                        ball.dy = -ball.dy;
                        b.status = 0;
                        score++;
                        // brickSound.play(); // Descomentar para som
                        if (!bricks.flat().some(brick => brick.status === 1)) {
                            if (phase < maxPhase) {
                                phase++;
                                initGame();
                            } else {
                                victory(score);
                                return;
                            }
                        }
                    }
                }
            }
        }
    }

    // Loop principal do jogo
    function draw() {
        if (isPaused) {
            ctx.fillStyle = "#FFF";
            ctx.font = "24px Arial";
            ctx.fillText("Pausado", canvas.width / 2 - 40, canvas.height / 2);
            requestAnimationFrame(draw);
            return;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBricks();
        drawBall();
        drawPaddle();
        drawScore();
        drawLives();
        collisionDetection();

        // Colisão com bordas
        if (ball.x + ball.dx > canvas.width - ball.radius || ball.x + ball.dx < ball.radius) {
            ball.dx = -ball.dx;
            // wallSound.play(); // Descomentar para som
        }
        if (ball.y + ball.dy < ball.radius) {
            ball.dy = -ball.dy;
            // wallSound.play(); // Descomentar para som
        } else if (ball.y + ball.dy > canvas.height - ball.radius) {
            if (ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
                let hitPos = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
                ball.dx = hitPos * 5 * ballSpeedMultiplier;
                ball.dy = -ball.dy;
                // paddleSound.play(); // Descomentar para som
            } else {
                lives--;
                if (lives > 0) {
                    ball.x = canvas.width / 2;
                    ball.y = canvas.height - 30;
                    ball.dx = INITIAL_BALL_SPEED * ballSpeedMultiplier;
                    ball.dy = -INITIAL_BALL_SPEED * ballSpeedMultiplier;
                    paddle.x = (canvas.width - paddle.width) / 2;
                } else {
                    gameOver(false, score);
                    return;
                }
            }
        }

        // Atualiza posições
        ball.x += ball.dx;
        ball.y += ball.dy;

        // Movimenta a raquete
        if (rightPressed && paddle.x < canvas.width - paddle.width) {
            paddle.x += PADDLE_SPEED;
        } else if (leftPressed && paddle.x > 0) {
            paddle.x -= PADDLE_SPEED;
        }

        requestAnimationFrame(draw);
    }

    // Manipuladores de eventos
    function keyDownHandler(e) {
        if (e.key === "Right" || e.key === "ArrowRight") {
            rightPressed = true;
        } else if (e.key === "Left" || e.key === "ArrowLeft") {
            leftPressed = true;
        } else if (e.key === "p" || e.key === "P") {
            isPaused = !isPaused;
        }
    }

    function keyUpHandler(e) {
        if (e.key === "Right" || e.key === "ArrowRight") {
            rightPressed = false;
        } else if (e.key === "Left" || e.key === "ArrowLeft") {
            leftPressed = false;
        }
    }

    // Controles por mouse (opcional)
    canvas.addEventListener("mousemove", function(e) {
        let relativeX = e.clientX - canvas.offsetLeft;
        if (relativeX > 0 && relativeX < canvas.width) {
            paddle.x = relativeX - paddle.width / 2;
            if (paddle.x < 0) paddle.x = 0;
            if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;
        }
    });

    // Controles por toque (opcional)
    let touchX = null;
    canvas.addEventListener("touchstart", function(e) {
        e.preventDefault();
        touchX = e.touches[0].clientX;
    }, false);
    canvas.addEventListener("touchmove", function(e) {
        e.preventDefault();
        if (touchX === null) return;
        let newX = e.touches[0].clientX;
        let deltaX = newX - touchX;
        touchX = newX;
        paddle.x += deltaX;
        if (paddle.x < 0) paddle.x = 0;
        if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;
    }, false);
    canvas.addEventListener("touchend", function(e) {
        e.preventDefault();
        touchX = null;
    }, false);

    // Funções de fim de jogo
    function gameOver(vitoria, pontuacao) {
        localStorage.setItem("vitoria", vitoria);
        localStorage.setItem("pontuacao", pontuacao);
        window.location.href = "gameover.html";
    }

    function victory(pontuacao) {
        localStorage.setItem("vitoria", true);
        localStorage.setItem("pontuacao", pontuacao);
        window.location.href = "victory.html";
    }

    function restartGame() {
        window.location.href = "index.html";
    }

    function goToMenu() {
        window.location.href = "index.html";
    }

    // Adiciona manipuladores de eventos
    document.addEventListener("keydown", keyDownHandler, false);
    document.addEventListener("keyup", keyUpHandler, false);

    // Expor função startGame globalmente
    window.startGame = startGame;
})();