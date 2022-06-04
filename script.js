const canvas = document.querySelector("canvas");
const button = document.querySelector("button");
const mainFrame = document.querySelector("#main-container");
const splashFrame = document.querySelector("#splash-container");
const canvasFrame = document.querySelector("#canvas-container");

var ctx = canvas.getContext("2d");
const FPS = 30;
const NUMBER_OF_BOIDS = 100;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let flag = true;
let n = 0;
const boids = [];
class Boid {
  constructor() {
    this.position = {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
    };
    this.velocity = { x: this.getRandom(20), y: this.getRandom(20) };
    this.acceleration = { x: this.getRandom(5), y: this.getRandom(5) };
    this.angle = 0;
    this.maxSpeed = 12;
    this.perceptionRadius = 100;
    this.maxForce = 0.55;
    this.seperationRadius = 100;
  }
  draw() {
    ctx.fillStyle = "#999";
    var slope = this.velocity.y / this.velocity.x;
    if (this.velocity.y > 0 && this.velocity.x > 0)
      this.angle = Math.PI + Math.abs(Math.atan(slope));
    if (this.velocity.y > 0 && this.velocity.x < 0)
      this.angle = 2 * Math.PI - Math.abs(Math.atan(slope));
    if (this.velocity.y < 0 && this.velocity.x > 0)
      this.angle = Math.PI - Math.abs(Math.atan(slope));
    if (this.velocity.y < 0 && this.velocity.x < 0)
      this.angle = Math.abs(Math.atan(slope));

    if (n < 1000) {
      console.log((this.angle * 190) / Math.PI);
      n++;
    }
    var h = Math.sqrt(15 * 15 + 5 * 5);
    var phi = Math.asin(5 / h);
    var x1 = this.position.x + h * Math.cos(this.angle + phi);
    var y1 = this.position.y + h * Math.sin(this.angle + phi);
    var x2 = this.position.x + h * Math.cos(this.angle - phi);
    var y2 = this.position.y + h * Math.sin(this.angle - phi);

    ctx.beginPath();
    ctx.moveTo(this.position.x, this.position.y);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.moveTo(this.position.x, this.position.y);
    ctx.fill();
  }
  update() {
    this.velocity.x += this.acceleration.x;
    this.velocity.y += this.acceleration.y;
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }
  edges() {
    if (this.position.x < 0) this.position.x = canvas.width;
    if (this.position.x > canvas.width) this.position.x = 0;
    if (this.position.y < 0) this.position.y = canvas.height;
    if (this.position.y > canvas.height) this.position.y = 0;
  }
  getRandom(n) {
    var a = Math.random() * n - n / 2;
    return a;
  }
  align(boids) {
    let steering = { x: 0, y: 0 };
    var dist = 0;
    var total = 0;
    for (var i = 0; i < boids.length; i++) {
      var other = boids[i];
      dist = Math.sqrt(
        (other.position.x - this.position.x) *
          (other.position.x - this.position.x) +
          (other.position.y - this.position.y) *
            (other.position.y - this.position.y)
      );
      if (dist < this.perceptionRadius && other != this) {
        steering.x += other.velocity.x;
        steering.y += other.velocity.y;
        total++;
      }
    }
    if (total > 0) {
      steering.x = steering.x / total;
      steering.y = steering.y / total;
      var mag = Math.sqrt(steering.x * steering.x + steering.y * steering.y);
      steering.x = steering.x * (this.maxSpeed / mag);
      steering.y = steering.y * (this.maxSpeed / mag);

      steering.x = steering.x - this.velocity.x;
      steering.y = steering.y - this.velocity.y;
      if (steering.x > this.maxForce) steering.x = this.maxForce;
      if (steering.y > this.maxForce) steering.y = this.maxForce;
      if (steering.x < -this.maxForce) steering.x = -this.maxForce;
      if (steering.y < -this.maxForce) steering.y = -this.maxForce;
    }
    return steering;
  }

  cohesion(boids) {
    let avgPos = { x: 0, y: 0 };
    var dist = 0;
    var total = 0;
    for (var i = 0; i < boids.length; i++) {
      var other = boids[i];
      dist = Math.sqrt(
        (other.position.x - this.position.x) *
          (other.position.x - this.position.x) +
          (other.position.y - this.position.y) *
            (other.position.y - this.position.y)
      );
      if (dist < this.perceptionRadius && other != this) {
        avgPos.x += other.position.x;
        avgPos.y += other.position.y;
        total++;
      }
    }
    if (total > 0) {
      avgPos.x = avgPos.x / total;
      avgPos.y = avgPos.y / total;
      avgPos.x = avgPos.x - this.position.x;
      avgPos.y = avgPos.y - this.position.y;

      var mag = Math.sqrt(avgPos.x * avgPos.x + avgPos.y * avgPos.y);
      avgPos.x = avgPos.x * (this.maxSpeed / mag);
      avgPos.y = avgPos.y * (this.maxSpeed / mag);

      avgPos.x = avgPos.x - this.velocity.x;
      avgPos.y = avgPos.y - this.velocity.y;
      if (avgPos.x > this.maxForce) avgPos.x = this.maxForce;
      if (avgPos.y > this.maxForce) avgPos.y = this.maxForce;
      if (avgPos.x < -this.maxForce) avgPos.x = -this.maxForce;
      if (avgPos.y < -this.maxForce) avgPos.y = -this.maxForce;
    }
    return avgPos;
  }
  seperation(boids) {
    let steering = { x: 0, y: 0 };
    var dist = 0;
    var total = 0;
    let diff = { x: 0, y: 0 };
    for (var i = 0; i < boids.length; i++) {
      diff = { x: 0, y: 0 };
      var other = boids[i];
      dist = Math.sqrt(
        (other.position.x - this.position.x) *
          (other.position.x - this.position.x) +
          (other.position.y - this.position.y) *
            (other.position.y - this.position.y)
      );
      if (dist < this.seperationRadius && other != this) {
        diff.x = this.position.x - other.position.x;
        diff.y = this.position.y - other.position.y;
        diff.x = diff.x / dist;
        diff.y = diff.y / dist;
        steering.x += diff.x;
        steering.y += diff.y;
        total++;
      }
    }
    if (total > 0) {
      steering.x = steering.x / total;
      steering.y = steering.y / total;
      var mag = Math.sqrt(steering.x * steering.x + steering.y * steering.y);
      steering.x = steering.x * (this.maxSpeed / mag);
      steering.y = steering.y * (this.maxSpeed / mag);

      steering.x = steering.x - this.velocity.x;
      steering.y = steering.y - this.velocity.y;
      if (steering.x > this.maxForce) steering.x = this.maxForce;
      if (steering.y > this.maxForce) steering.y = this.maxForce;
      if (steering.x < -this.maxForce) steering.x = -this.maxForce;
      if (steering.y < -this.maxForce) steering.y = -this.maxForce;
    }
    return steering;
  }

  flock(boids) {
    this.acceleration = { x: 0, y: 0 };
    let alignment = this.align(boids);
    let cohesion = this.cohesion(boids);
    let seperation = this.seperation(boids);
    this.acceleration.x = alignment.x + cohesion.x + seperation.x;
    this.acceleration.y = alignment.y + cohesion.y + seperation.y;
  }
}
function init() {
  for (var i = 0; i < NUMBER_OF_BOIDS; i++) {
    var b = new Boid();
    b.draw();
    boids.push(b);
  }
}

function move() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (var i = 0; i < NUMBER_OF_BOIDS; i++) {
    boid = boids[i];
    boid.edges();
    boid.flock(boids);
    boid.update();
    boid.draw();
  }
}

function main() {
  setTimeout(() => {
    setInterval(move, 1000 / FPS); //;
  }, 1000);
}

init();

button.onclick = function () {
  mainFrame.classList.add("animate-frame");
  splashFrame.style.opacity = 0;
  canvas.style.opacity = 1;
  main();
};
