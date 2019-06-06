
//import java.awt.Rectangle;

class Particle {
  
  float x;
  float y;
  
  float pwidth;
  float pheight;
  
  float xspeed;
  float yspeed;
  float life;
  
  boolean ballform;
  boolean ismulticolor;
  
  // Make the Particle
  Particle(float tempX, float tempY) {
    x = tempX;
    y = tempY;
    pwidth = random(1,2);
    pheight =random(35,40);
    xspeed = 0;
    yspeed = random(-15,0);
    life = 355;
  }
  
  // Move
  void run() {
    x = x + xspeed;
    y = y + yspeed;
   
  }
  
  // Fall down
  void gravity() {
    yspeed += 0.2;
  }
  
  // Stop moving
  void stop() {
    xspeed = 0;
    //yspeed = 0;
    y=y-random(10,100);
    ballform = true;
     
  }
  
  // Ready for deletion
  boolean finished() {
    // The Particle has a "life" variable which decreases.
    // When it reaches 0 the Particle can be removed from the ArrayList.
    life -= 2.0; 
    if (life < 0) return true;
    else return false;
  }
  
  // Show
  void display() {
    // Life is used to fade out the particle as well
    noStroke();
    
    if (!ismulticolor) { 
      //fill(random(118,138),random(118,138),random(118,138),life);
      fill(random(95,121),random(127,148),random(155,175),life);
    }else {
      fill(random(0,255),random(0,255),random(0,255),life);
    }
    
    if (!ballform) {
      rect(x, y, pwidth, pheight, 18);
    } else {
      ellipse(x,y,5,5);
      
    }
    //filter(BLUR,8);

  }
}

ArrayList particles;

PShape blackhole;
int x;
int y;
int width;
int height;

PImage overlay;

ArrayList drops;

PImage [] boy;
int currentPosition = 0;
//PImage bg;

void setup() {
  size(1024,768);
  //bg = loadImage("night_sky.jpg");
  
  frameRate(120/2);
  
  blackhole = createShape(RECT,0,720,1024,68);
  x = 0;
  y = 720;
  width = 1024;
  height = 68;
  particles = new ArrayList();
  
  drops = new ArrayList();
  smooth();
}

void draw() {
  background(13,20,29);
 
  noStroke();
  fill(10,15,17);
  //fill(38, 96, 79);
  rect(x, y, width,height);
  
  for (int i = 3; i >= 0; i-- )    {
    particles.add(new Particle(random(0, 1024),random(-40,-50)));
  }

  for (int i = particles.size() - 1; i >= 0; i-- )    {
    Particle p = (Particle) particles.get(i);
    
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
      particles.remove(i);
    }
  }
}

void mousePressed() {

  for (int i = 100; i >= 0; i-- )    {
    Particle p = new Particle(random(mouseX - 50, mouseX + 50 ),random(mouseY - 10, mouseY + 10 ));
    p.ismulticolor = true;
    p.ballform = true;
    p.xspeed = random(-3,3);
    p.yspeed = random(-4,1);
    particles.add( p );
  }
  
}