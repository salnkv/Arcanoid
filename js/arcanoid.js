var coordZone = { none: 0, x: 1, y: 2 };

$(document).ready(function () {
    var canvas = document.getElementById("canvas");
    canvas.width = 840;
    canvas.height = 576;
    var game = new Game(canvas);
    game.startGame();
});

function Game(canvas, blocks, ball, platform) {
    canvas.addEventListener("mousemove", mousemoveHandler, false);
    canvas.addEventListener("click", mouseclickHandler, false);

    var context = canvas.getContext("2d");
    var blockWidth = canvas.width / 12;
    var blockHeight = canvas.height / (12 * 3);
    var blocksTop = blockHeight * 3;
    var ballIsRunning = false;
    var score;
    var timer;
    var blockSets = new BlocksSets();

    this.startGame = function() {
        startGame();
        tick();
    };

    var startGame = function () {
        ballIsRunning = false;
        score = 0;
        blocks = blockSets.getBlockSet(blockWidth, blockHeight, blocksTop, Math.floor((Math.random() * blockSets.getMaxNumber()) + 1));
        platform = new Platform(canvas.width / 2 - blockWidth, blockHeight * 32, blockWidth * 2, blockHeight, "red");
        var radius = 8;
        ball = new Ball(canvas.width / 2 - radius, platform.y - radius * 2, radius, "blue");
        ball.directionX = 1;
        ball.directionY = -1;
        $("div#score").text(score);
    }

    var tick = function () {
        context.clearRect(0, 0, canvas.width, canvas.height);
        draw();
        requestFrame(tick);
    }

    var endGame = function () {
        stopTimer();
        startGame();
    }

    function startTimer() {
        ballIsRunning = true;
        timer = setInterval(moveBall, 2);
    }

    function stopTimer() {
        clearInterval(timer);
    }

    function moveBall() {
        checkBallCollisions(ball, platform, blocks);
        ball.x += ball.directionX;
        ball.y += ball.directionY;
    }

    function checkBallCollisions(ball, platform, blocks) {
        //canvas
        if (ball.x <= 0) {
            ball.x = 0;
            ball.directionX *= -1;
        } else if (ball.x >= canvas.width - ball.diameter) {
            ball.x = canvas.width - ball.diameter;
            ball.directionX *= -1;
        }
        if (ball.y <= 0) {
            ball.y = 0;
            ball.directionY *= -1;
        } else if (ball.y >= canvas.height - ball.diameter) {
            alert("You lost! Your score: " + score);
            endGame();            
        }

        //platform
        var result = ball.tryToCollideWith(platform);        

        //blocks
        for (var i = 0; i < blocks.length; ) {
            var res = ball.tryToCollideWith(blocks[i]);
            if (res) {
                score += 10;
                $("div#score").text(score);
                blocks[i].health -= 1;
                if (blocks[i].health <= 0)
                    blocks.splice(i, 1);
            } else {
                i++;
            }
        }

        if (blocks.length <= 0)
        {
            alert("You win! Your score: " + score);
            endGame();
        }
    }

    function draw() {
        for (var i = 0; i < blocks.length; i++) {
            drawBlock(blocks[i]);
        }
        drawPlatform(platform);
        drawBall(ball);
    }

    function drawBlock(block) {
        context.beginPath();
        context.rect(block.x, block.y, block.width, block.height);
        context.fillStyle = block.getColor();
        context.fill();
        context.lineWidth = 1;
        context.strokeStyle = "black";
        context.stroke();
    }

    function drawPlatform(platform) {
        context.beginPath();
        context.rect(platform.x, platform.y, platform.width, platform.height);
        context.fillStyle = platform.color;
        context.fill();
        context.lineWidth = 1;
        context.strokeStyle = "black";
        context.stroke();
    }

    function drawBall(ball) {
        context.beginPath();
        context.arc(ball.x + ball.radius, ball.y + ball.radius, ball.radius, 0, 2 * Math.PI, false);
        context.fillStyle = ball.color;
        context.fill();
        context.lineWidth = 1;
        context.strokeStyle = "black";
        context.stroke();
    }

    function mousemoveHandler(e) {
        var x, y;

        if (e.layerX || e.layerX == 0) { // Firefox
            x = e.layerX;
            y = e.layerY;
        } else if (e.offsetX || e.offsetX == 0) {
            x = e.offsetX;
            y = e.offsetY;
        }

        var platformX = x - platform.width / 2;
        if (platformX < 0)
            platformX = 0;
        else if (platformX > canvas.width - platform.width)
            platformX = canvas.width - platform.width;
        platform.x = platformX;

        if (!ballIsRunning)
        {
            var ballX = x - ball.radius;
            if (ballX < 0)
                ballX = 0;
            else if (ballX > canvas.width - ball.diameter)
                ballX = canvas.width - ball.diameter;

            ball.x = ballX;
        }
    }

    function mouseclickHandler(e) {
        if (!ballIsRunning)
            startTimer();
    }

    function requestFrame(callback) {
        var f = window.mozRequestAnimationFrame ||
            window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            function (callback) {
                window.setTimeout(callback, 500);
            }

        f(callback);
    };
}

function Ball(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.diameter = radius * 2;
    this.directionX = 1;
    this.directionY = -1;
    this.color = color;

    this.tryToCollideWith = function (object) {
        if (this.x >= object.x - this.radius &&
            this.x <= object.x + object.width) {
            if (object.ballInZone == coordZone.none)
                object.ballInZone = coordZone.y;
        } else if (this.y <= object.y + object.height &&
            this.y >= object.y - this.diameter) {
            if (object.ballInZone == coordZone.none)
                object.ballInZone = coordZone.x;
        } else {
            object.ballInZone = coordZone.none;
        }

        if (object.ballInZone == coordZone.y) {
            if (this.y > object.y - this.diameter &&
                this.y < object.y + object.height) {
                //top
                if (this.y > object.y - this.diameter &&
                this.y < object.y + object.height / 2) {
                    this.y = object.y - this.diameter;
                    if (this.directionY > 0)
                        this.directionY *= -1;
                }
                //bottom
                else if (this.y > object.y + object.height / 2 - this.diameter &&
                         this.y < object.y + object.height) {
                    this.y = object.y + object.height;
                    if (this.directionY < 0)
                        this.directionY *= -1;
                }

                return true;
            }
        }
        else if (object.ballInZone == coordZone.x) {
            if (this.x > object.x - this.radius &&
                this.x < object.x + object.width) {
                //right
                if (this.x > object.x - this.radius &&
                    this.x < object.x + object.width / 2) {
                    this.x = object.x - this.diameter;
                    if (this.directionX > 0)
                        this.directionX *= -1;

                    return true;
                }
                //left
                else if (this.x < object.x + object.width &&
                         this.x > object.x - this.radius + object.width / 2) {
                    this.x = object.x + object.width;
                    if (this.directionX < 0)
                        this.directionX *= -1;

                    return true;
                }
            }
        }

        return false;
    }
}

function Platform(x, y, width, height, color) {
    this.x = x;
    this.y = y;
    this.width = width,
    this.height = height;
    this.color = color;
    this.ballInZone = coordZone.none;
}

function Block(x, y, width, height, colors) {
    this.x = x;
    this.y = y;
    this.width = width,
    this.height = height;
    this.ballInZone = coordZone.none;
    this.health = colors ? colors.length : 1;

    this.getColor = function () {
        return colors && colors.length > 0 && this.health > 0 ? colors[this.health - 1] : "green";
    }
}

function getBlocksSet1(blockWidth, blockHeight, blocksTop) {
    var colors = [ "green", "yellow", "orange", "red" ];

    return [
        new Block(1  * blockWidth, 1 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 1)),
        new Block(2  * blockWidth, 1 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 1)),
        new Block(3  * blockWidth, 1 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 1)),
        new Block(4  * blockWidth, 1 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 1)),
        new Block(5  * blockWidth, 1 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 2)),
        new Block(6  * blockWidth, 1 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 2)),
        new Block(7  * blockWidth, 1 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 1)),
        new Block(8  * blockWidth, 1 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 1)),
        new Block(9  * blockWidth, 1 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 1)),
        new Block(10 * blockWidth, 1 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 1)),
        new Block(1  * blockWidth, 2 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 1)),
        new Block(2  * blockWidth, 2 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 1)),
        new Block(3  * blockWidth, 2 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 1)),
        new Block(4  * blockWidth, 2 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 2)),
        new Block(5  * blockWidth, 2 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 2)),
        new Block(6  * blockWidth, 2 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 2)),
        new Block(7  * blockWidth, 2 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 2)),
        new Block(8  * blockWidth, 2 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 1)),
        new Block(9  * blockWidth, 2 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 1)),
        new Block(10 * blockWidth, 2 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 1)),
        new Block(1  * blockWidth, 3 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 1)),
        new Block(2  * blockWidth, 3 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 1)),
        new Block(3  * blockWidth, 3 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 2)),
        new Block(4  * blockWidth, 3 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 2)),
        new Block(5  * blockWidth, 3 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 3)),
        new Block(6  * blockWidth, 3 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 3)),
        new Block(7  * blockWidth, 3 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 2)),
        new Block(8  * blockWidth, 3 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 2)),
        new Block(9  * blockWidth, 3 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 1)),
        new Block(10 * blockWidth, 3 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 1)),
        new Block(1  * blockWidth, 4 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 1)),
        new Block(2  * blockWidth, 4 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 2)),
        new Block(3  * blockWidth, 4 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 2)),
        new Block(4  * blockWidth, 4 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 3)),
        new Block(5  * blockWidth, 4 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 3)),
        new Block(6  * blockWidth, 4 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 3)),
        new Block(7  * blockWidth, 4 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 3)),
        new Block(8  * blockWidth, 4 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 2)),
        new Block(9  * blockWidth, 4 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 2)),
        new Block(10 * blockWidth, 4 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 1)),
        new Block(1 * blockWidth,  5 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 2)),
        new Block(2 * blockWidth,  5 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 2)),
        new Block(3 * blockWidth,  5 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 3)),
        new Block(4 * blockWidth,  5 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 3)),
        new Block(5 * blockWidth,  5 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 4)),
        new Block(6 * blockWidth,  5 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 4)),
        new Block(7 * blockWidth,  5 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 3)),
        new Block(8 * blockWidth,  5 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 3)),
        new Block(9 * blockWidth,  5 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 2)),
        new Block(10 * blockWidth, 5 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 2)),
        new Block(1 * blockWidth,  6 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 2)),
        new Block(2 * blockWidth,  6 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 2)),
        new Block(3 * blockWidth,  6 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 3)),
        new Block(4 * blockWidth,  6 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 3)),
        new Block(5 * blockWidth,  6 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 4)),
        new Block(6 * blockWidth,  6 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 4)),
        new Block(7 * blockWidth,  6 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 3)),
        new Block(8 * blockWidth,  6 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 3)),
        new Block(9 * blockWidth,  6 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 2)),
        new Block(10 * blockWidth, 6 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 2)),
        new Block(1 * blockWidth,  7 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 1)),
        new Block(2 * blockWidth,  7 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 2)),
        new Block(3 * blockWidth,  7 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 2)),
        new Block(4 * blockWidth,  7 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 3)),
        new Block(5 * blockWidth,  7 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 3)),
        new Block(6 * blockWidth,  7 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 3)),
        new Block(7 * blockWidth,  7 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 3)),
        new Block(8 * blockWidth,  7 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 2)),
        new Block(9 * blockWidth,  7 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 2)),
        new Block(10 * blockWidth, 7 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 1)),
        new Block(1 * blockWidth,  8 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 1)),
        new Block(2 * blockWidth,  8 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 1)),
        new Block(3 * blockWidth,  8 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 2)),
        new Block(4 * blockWidth,  8 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 2)),
        new Block(5 * blockWidth,  8 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 3)),
        new Block(6 * blockWidth,  8 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 3)),
        new Block(7 * blockWidth,  8 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 2)),
        new Block(8 * blockWidth,  8 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 2)),
        new Block(9 * blockWidth,  8 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 1)),
        new Block(10 * blockWidth, 8 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 1)),
        new Block(1 * blockWidth,  9 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 1)),
        new Block(2 * blockWidth,  9 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 1)),
        new Block(3 * blockWidth,  9 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 1)),
        new Block(4 * blockWidth,  9 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 2)),
        new Block(5 * blockWidth,  9 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 2)),
        new Block(6 * blockWidth,  9 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 2)),
        new Block(7 * blockWidth,  9 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 2)),
        new Block(8 * blockWidth,  9 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 1)),
        new Block(9 * blockWidth,  9 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 1)),
        new Block(10 * blockWidth, 9 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 1)),
        new Block(1 * blockWidth,  10 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 1)),
        new Block(2 * blockWidth,  10 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 1)),
        new Block(3 * blockWidth,  10 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 1)),
        new Block(4 * blockWidth,  10 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 1)),
        new Block(5 * blockWidth,  10 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 2)),
        new Block(6 * blockWidth,  10 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 2)),
        new Block(7 * blockWidth,  10 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 1)),
        new Block(8 * blockWidth,  10 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 1)),
        new Block(9 * blockWidth,  10 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 1)),
        new Block(10 * blockWidth, 10 * blockHeight + blocksTop, blockWidth, blockHeight, colors.slice(0, 1)),
    ];
}