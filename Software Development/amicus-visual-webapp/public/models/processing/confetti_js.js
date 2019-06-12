// function setup() {
//     let d = 70;
//     let p1 = d;
//     let p2 = p1 + d;
//     let p3 = p2 + d;
//     let p4 = p3 + d;
  
//     // Sets the screen to be 720 pixels wide and 400 pixels high
//     createCanvas(720, 400);
//     background(0);
//     noSmooth();
  
//     translate(140, 0);
  
//     // Draw gray box
//     stroke(153);
//     line(p3, p3, p2, p3);
//     line(p2, p3, p2, p2);
//     line(p2, p2, p3, p2);
//     line(p3, p2, p3, p3);
  
//     // Draw white points
//     stroke(255);
//     point(p1, p1);
//     point(p1, p3);
//     point(p2, p4);
//     point(p3, p1);
//     point(p4, p2);
//     point(p4, p4);
//   }

// function draw() {
//     background(50,50,50);
// }
  

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
      this.yspeed += 0.15;
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
        //fill(random(118,138),random(118,138),random(118,138),this.life);
        //fill(random(95,121),random(127,148),random(155,175),this.life);
        //fill(255,255,255,this.life);
        fill(random(0,255),random(0,255),random(0,255),this.life);
      }else {
        //fill(random(0,255),random(0,255),random(0,255),this.life);
        fill(0,0,0,this.life);
      }
      
      if (!this.ballform) {
        //rect(this.x, this.y, this.pwidth, this.pheight, 18);
        ellipse(this.x,this.y,random(5, 15),random(5, 15));
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
  
  var x, y, w, h;
  
  //PImage bg;
  
  function setup() {
    // createCanvas(1024,768);
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;
    createCanvas(WIDTH,HEIGHT);
    //bg = loadImage("night_sky.jpg");
    
    frameRate(120/2);
    x = 0;
    y = 720;
    w = WIDTH;
    h = HEIGHT;
    blackhole = rect(x,y,w,h);
    particles = [];
    
    drops = [];
    smooth();
  }
  
  function draw() {
    
    background(13,20,29);
   
    noStroke();
    fill(10,15,17);
    //fill(38, 96, 79);
    rect(x, y, w,h);
    
    for (i = 3; i >= 0; i-- )    {
      particles.push(new Particle(random(0, window.innerWidth),random(-40,-50)));
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
  
