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

class CParticle {
  
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
      this.yspeed += 0.15;
    }
    
    // Stop moving
    stop() {
      this.xspeed = 0;
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
        fill(random(0,255),random(0,255),random(0,255),this.life);
      }else {
        fill(0,0,0,this.life);
      }
      
      if (!this.ballform) {
        ellipse(this.x,this.y,random(5, 15),random(5, 15));
      } else {
        ellipse(this.x,this.y,5,5);
      }
    }
  }
  
  var cparticles = [];
  
  var cblackhole;
  
  var coverlay;
  
  var cdrops = [];
  
  var cboy = [];
  
  var ccurrentPosition = 0;
  
  var cx, cy, cw, ch;

  var particles = [];
  
  var blackhole;
  
  var overlay;
  
  var drops = [];
  
  var boy = [];
  
  var currentPosition = 0;
  
  var x, y, w, h;

  var confetti = false;
    
  function setup() {
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;
    createCanvas(WIDTH,HEIGHT);
    
    frameRate(120/2);
    cx = 0;
    cy = 720;
    cw = WIDTH;
    ch = HEIGHT;
    x = 0;
    y = 720;
    w = WIDTH;
    h = HEIGHT;
    cblackhole = rect(cx,cy,cw,ch);
    blackhole = rect(x, y, w, h);
    cparticles = [];
    particles = [];
    
    cdrops = [];
    drops = [];
    smooth();
  }

  function draw() {
    
    background(13,20,29);
   
    noStroke();
    fill(10,15,17);

    if (confetti) {
        rect(cx, cy, cw,ch);
        
        for (i = 3; i >= 0; i-- )    {
        cparticles.push(new CParticle(random(0, window.innerWidth),random(-40,-50)));
        }
    
        for (i = cparticles.length - 1; i >= 0; i-- )    {
            var p = cparticles[i];
            
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
                cparticles.splice(i, 1);
            }
        }
    } else {
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
}

function mouseClicked() {
    
    if (confetti == false){
        confetti = true;
    } else {
        confetti = false;
    }

}
  
