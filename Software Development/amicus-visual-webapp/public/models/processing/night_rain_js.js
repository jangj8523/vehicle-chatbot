class Particle {

    // Make the Particle
    constructor(tempX, tempY) {
      this.x = tempX;
      this.y = tempY;
      this.pwidth = random(1,2);
      this.pheight =random(35,40);
      this.xspeed = 0;
      this.yspeed = random(-15,0);
      this.life = 355;
      this.ballform = false;
      this.ismulticolor = false;

    }

    // Move
    run() {
      this.x = this.x + this.xspeed;
      this.y = this.y + this.yspeed;
    }

    // Fall down
    gravity() {
      this.yspeed += 0.2;
    }

    // Stop moving
    stop() {
      this.xspeed = 0;
      //yspeed = 0;
      this.y=this.y-random(10,100);
      this.ballform = true;
    }

    // Ready for deletion
    finished() {
      // The Particle has a "life" variable which decreases.
      // When it reaches 0 the Particle can be removed from the ArrayList.
      this.life -= 2.0;
      if (this.life < 0) {
        return true;
      } else {
        return false;
      }
    }

    // Show
    display() {
      // Life is used to fade out the particle as well
      noStroke();

      if (!this.ismulticolor) {
        //fill(random(118,138),random(118,138),random(118,138),life);
        fill(random(95,121),random(127,148),random(155,175),this.life);
      }else {
        fill(random(0,255),random(0,255),random(0,255),this.life);
      }

      if (!this.ballform) {
        rect(this.x, this.y, this.pwidth, this.pheight, 18);
      } else {
        ellipse(this.x,this.y,5,5);
      }
    }
  }

  var particles = [];

  //Rectangle blackhole;
  var blackhole;

  var overlay;

  var drops = [];

  var boy = [];

  var currentPosition = 0;

  var x;
  var y;
  var w;
  var h;
  //PImage bg;

  function setup() {
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;
    createCanvas(WIDTH,HEIGHT);
    //bg = loadImage("night_sky.jpg");

    frameRate(120/2);
    x = 0;
    y = HEIGHT;
    w = WIDTH;
    h = 68;
    blackhole = rect(x,y,w,h);
    particles = [];

    drops = [];
    smooth();

    this.enabled = true;

    window.addEventListener('event_rain', this.onRainToggle, false);
  }

  function onRainToggle() {
    this.enabled = !this.enabled;
  }

  function draw() {
    background(0,0,0);

    if (!this.enabled) return;

    noStroke();
    fill(10,15,17);
    //fill(38, 96, 79);
    rect(x, y, w,h);

    for (i = 3; i >= 0; i-- )    {
      particles.push(new Particle(random(0, WIDTH),random(-40,-50)));
    }

    for (i = particles.length - 1; i >= 0; i-- )    {
      var p = particles[i];

      p.run();
      p.gravity();
      p.display();

      if ((p.x > mouseX - 50 ) && (p.x < mouseX + 50 )  && (p.y > mouseY - 50 ) && (p.y < mouseY + 50 ) && !p.ismulticolor) {
       p.stop();
      }


      if ((p.x > 750 - 10 ) && (p.x < 750 + 60 )  && (p.y > 640- 10 ) && (p.y < 640  ) ) {
        p.stop();

      }
      if (p.finished()) {
        particles.splice(i, 1);
      }
    }
  }
