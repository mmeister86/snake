class Snake {
  constructor(color, startPos, playerNumber) {
    this.body = [startPos];
    this.color = color;
    this.direction = playerNumber === 1 ? "RIGHT" : "LEFT";
    this.nextDirection = this.direction;
    this.growth_pending = 0;
    this.playerNumber = playerNumber;
    this.score = 0;
  }

  move() {
    this.direction = this.nextDirection;
    const head = this.body[0];
    let newHead;
    switch (this.direction) {
      case "RIGHT":
        newHead = { x: head.x + 10, y: head.y };
        break;
      case "LEFT":
        newHead = { x: head.x - 10, y: head.y };
        break;
      case "UP":
        newHead = { x: head.x, y: head.y - 10 };
        break;
      case "DOWN":
        newHead = { x: head.x, y: head.y + 10 };
        break;
    }
    this.body.unshift(newHead);
    if (this.growth_pending > 0) {
      this.growth_pending--;
    } else {
      this.body.pop();
    }
  }

  changeDirection(newDirection) {
    const opposites = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" };
    if (newDirection !== opposites[this.direction]) {
      this.nextDirection = newDirection;
    }
  }

  grow() {
    this.growth_pending++;
    this.score++;
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    this.body.forEach((segment, index) => {
      if (index === 0) {
        ctx.fillStyle = this.playerNumber === 1 ? "yellow" : "orange";
      } else {
        ctx.fillStyle = this.color;
      }
      ctx.fillRect(segment.x, segment.y, 10, 10);
    });
  }

  checkCollision(width, height, otherSnake) {
    const head = this.body[0];
    // Kollision mit Wänden
    if (head.x < 0 || head.x >= width || head.y < 0 || head.y >= height) {
      return true;
    }
    // Kollision mit sich selbst
    if (
      this.body
        .slice(1)
        .some((segment) => segment.x === head.x && segment.y === head.y)
    ) {
      return true;
    }
    // Kollision mit der anderen Schlange
    if (
      otherSnake &&
      otherSnake.body.some(
        (segment) => segment.x === head.x && segment.y === head.y
      )
    ) {
      return true;
    }
    return false;
  }
}

class Food {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.position = this.generateRandomPosition();
    this.color = this.generateRandomColor();
  }

  generateRandomPosition() {
    return {
      x: Math.floor(Math.random() * (this.width / 10)) * 10,
      y: Math.floor(Math.random() * (this.height / 10)) * 10,
    };
  }

  generateRandomColor() {
    const hue = Math.random();
    return `hsl(${hue * 360}, 100%, 50%)`;
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.position.x + 5, this.position.y + 5, 5, 0, 2 * Math.PI);
    ctx.fill();
  }
}

class Game {
  constructor(isTwoPlayerMode = false) {
    this.canvas = document.getElementById("game-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.snake1 = new Snake("limegreen", { x: 100, y: 300 }, 1);
    this.snake2 = isTwoPlayerMode
      ? new Snake("blue", { x: 700, y: 300 }, 2)
      : null;
    this.enemySnake = null; // Füge die gegnerische Schlange hinzu
    this.food = new Food(this.canvas.width, this.canvas.height);
    this.isGameOver = false;
    this.lastRenderTime = 0;
    this.gameSpeed = 15;
    this.isTwoPlayerMode = isTwoPlayerMode;

    // Laden des Hintergrundbildes
    this.background = new Image();
    this.background.src = "snake-bg.jpg";
    this.background.onload = () => {
      this.draw(); // Initialer Zeichenaufruf, sobald das Bild geladen ist
    };

    // Audio-Objekte erstellen
    this.coinSound = new Audio('Coin.wav');
    this.hissSound = new Audio('Hiss.wav');
  }

  start() {
    this.bindKeys();
    this.gameLoop(0);
  }

  bindKeys() {
    document.addEventListener("keydown", (e) => {
      switch (e.code) {
        case "KeyW":
          this.snake1.changeDirection("UP");
          break;
        case "KeyS":
          this.snake1.changeDirection("DOWN");
          break;
        case "KeyA":
          this.snake1.changeDirection("LEFT");
          break;
        case "KeyD":
          this.snake1.changeDirection("RIGHT");
          break;
      }
      if (this.isTwoPlayerMode) {
        switch (e.code) {
          case "ArrowUp":
            this.snake2.changeDirection("UP");
            break;
          case "ArrowDown":
            this.snake2.changeDirection("DOWN");
            break;
          case "ArrowLeft":
            this.snake2.changeDirection("LEFT");
            break;
          case "ArrowRight":
            this.snake2.changeDirection("RIGHT");
            break;
        }
      }
    });
  }

  gameLoop(currentTime) {
    if (this.isGameOver) return;

    window.requestAnimationFrame(this.gameLoop.bind(this));

    const secondsSinceLastRender = (currentTime - this.lastRenderTime) / 1000;
    if (secondsSinceLastRender < 1 / this.gameSpeed) return;

    this.lastRenderTime = currentTime;

    this.update();
    this.draw();
  }

  update() {
    this.snake1.move();
    if (this.isTwoPlayerMode) this.snake2.move();

    // Spawn der gegnerischen Schlange
    if (this.snake1.score >= 10 && !this.enemySnake) {
      this.enemySnake = new EnemySnake(
        Math.floor(Math.random() * (this.canvas.width / 10)) * 10,
        Math.floor(Math.random() * (this.canvas.height / 10)) * 10,
        'purple'
      );
      this.hissSound.play(); // Zischsound abspielen
    }

    // Update der gegnerischen Schlange
    if (this.enemySnake) {
      this.enemySnake.update(this.food, this.canvas.width, this.canvas.height);
    }

    // Kollisionsprüfung
    if (
      this.snake1.checkCollision(
        this.canvas.width,
        this.canvas.height,
        this.snake2
      ) ||
      (this.isTwoPlayerMode &&
        this.snake2.checkCollision(
          this.canvas.width,
          this.canvas.height,
          this.snake1
        )) ||
      (this.enemySnake && this.snake1.checkCollision(this.canvas.width, this.canvas.height, this.enemySnake))
    ) {
      this.gameOver();
      return;
    }

    if (
      this.snake1.body[0].x === this.food.position.x &&
      this.snake1.body[0].y === this.food.position.y
    ) {
      this.handleFoodCollision(this.snake1);
      this.coinSound.play(); // Münzsound abspielen
    } else if (
      this.isTwoPlayerMode &&
      this.snake2.body[0].x === this.food.position.x &&
      this.snake2.body[0].y === this.food.position.y
    ) {
      this.handleFoodCollision(this.snake2);
      this.coinSound.play(); // Münzsound abspielen
    } else if (
      this.enemySnake &&
      this.enemySnake.body[0].x === this.food.position.x &&
      this.enemySnake.body[0].y === this.food.position.y
    ) {
      this.enemySnake.grow();
      this.food = new Food(this.canvas.width, this.canvas.height);
      this.coinSound.play(); // Münzsound abspielen
    }
  }

  handleFoodCollision(snake) {
    snake.grow();
    this.food = new Food(this.canvas.width, this.canvas.height);
    this.updateScore();
    this.gameSpeed += 0.25;
  }

  updateScore() {
    document.getElementById("score1").textContent = this.snake1.score;
    if (this.isTwoPlayerMode) {
      document.getElementById("score2").textContent = this.snake2.score;
    }
  }

  draw() {
    // Zeichne das Hintergrundbild
    this.ctx.drawImage(
      this.background,
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );

    // Zeichne ein semi-transparentes Overlay für bessere Sichtbarkeit
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Zeichne ein Gitter
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    for (let i = 0; i < this.canvas.width; i += 10) {
      this.ctx.beginPath();
      this.ctx.moveTo(i, 0);
      this.ctx.lineTo(i, this.canvas.height);
      this.ctx.stroke();
    }
    for (let i = 0; i < this.canvas.height; i += 10) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, i);
      this.ctx.lineTo(this.canvas.width, i);
      this.ctx.stroke();
    }

    this.snake1.draw(this.ctx);
    if (this.isTwoPlayerMode) this.snake2.draw(this.ctx);
    if (this.enemySnake) this.enemySnake.draw(this.ctx);
    this.food.draw(this.ctx);
  }

  gameOver() {
    this.isGameOver = true;
    document.getElementById("game-over").classList.remove("hidden");
    if (this.isTwoPlayerMode) {
      const winner =
        this.snake1.score > this.snake2.score
          ? "Spieler 1"
          : this.snake2.score > this.snake1.score
          ? "Spieler 2"
          : "Unentschieden";
      document.getElementById(
        "final-score"
      ).textContent = `Spieler 1: ${this.snake1.score}, Spieler 2: ${this.snake2.score}. ${winner} gewinnt!`;
    } else {
      document.getElementById(
        "final-score"
      ).textContent = `Spieler 1: ${this.snake1.score}`;
    }
  }
}

// Event Listeners
document.getElementById("start-button-1p").addEventListener("click", () => {
  document.getElementById("start-menu").classList.add("hidden");
  const game = new Game(false);
  game.start();
});

document.getElementById("start-button-2p").addEventListener("click", () => {
  document.getElementById("start-menu").classList.add("hidden");
  const game = new Game(true);
  game.start();
});

document.getElementById("restart-button").addEventListener("click", () => {
  location.reload();
});

// Füge diese Klasse nach der Snake-Klasse hinzu
class EnemySnake extends Snake {
  constructor(x, y, color) {
    super(color, { x, y }, 3);  // Verwende 3 als Spielernummer für den Feind
    this.direction = 'RIGHT';
    this.targetFood = null;
    this.newFoodDelay = 0;
    this.NEW_FOOD_DELAY_MAX = 30; // Anzahl der Frames, die gewartet werden soll
  }

  update(food, canvasWidth, canvasHeight) {
    if (this.targetFood !== food) {
      this.targetFood = food;
      this.newFoodDelay = this.NEW_FOOD_DELAY_MAX;
    }

    if (this.newFoodDelay > 0) {
      this.newFoodDelay--;
      this.move();
      return;
    }

    const head = this.body[0];
    const possibleMoves = [
      { direction: 'UP', x: head.x, y: head.y - 10 },
      { direction: 'DOWN', x: head.x, y: head.y + 10 },
      { direction: 'LEFT', x: head.x - 10, y: head.y },
      { direction: 'RIGHT', x: head.x + 10, y: head.y }
    ];

    // Filtere sichere Bewegungen
    const safeMoves = possibleMoves.filter(move => 
      this.isSafeMove(move, canvasWidth, canvasHeight)
    );

    if (safeMoves.length > 0) {
      // Wähle die Bewegung, die am nächsten zum Futter führt
      const bestMove = safeMoves.reduce((best, current) => {
        const currentDist = this.distanceToFood(current, food.position);
        const bestDist = this.distanceToFood(best, food.position);
        return currentDist < bestDist ? current : best;
      });

      this.changeDirection(bestMove.direction);
    } else {
      // Wenn keine sichere Bewegung möglich ist, wähle eine zufällige sichere Richtung
      this.chooseRandomSafeDirection(canvasWidth, canvasHeight);
    }

    this.move();
  }

  distanceToFood(position, foodPosition) {
    return Math.abs(position.x - foodPosition.x) + Math.abs(position.y - foodPosition.y);
  }

  isSafeMove(move, canvasWidth, canvasHeight) {
    return (
      move.x >= 0 &&
      move.x < canvasWidth &&
      move.y >= 0 &&
      move.y < canvasHeight &&
      !this.body.some(segment => segment.x === move.x && segment.y === move.y)
    );
  }

  chooseRandomSafeDirection(canvasWidth, canvasHeight) {
    const head = this.body[0];
    const directions = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
    const safeMoves = directions.filter(dir => {
      let nextMove = { x: head.x, y: head.y };
      switch (dir) {
        case 'UP': nextMove.y -= 10; break;
        case 'DOWN': nextMove.y += 10; break;
        case 'LEFT': nextMove.x -= 10; break;
        case 'RIGHT': nextMove.x += 10; break;
      }
      return this.isSafeMove(nextMove, canvasWidth, canvasHeight);
    });
    
    if (safeMoves.length > 0) {
      const randomDirection = safeMoves[Math.floor(Math.random() * safeMoves.length)];
      this.changeDirection(randomDirection);
    }
    // Wenn keine sichere Richtung gefunden wurde, behalte die aktuelle Richtung bei
  }
}
