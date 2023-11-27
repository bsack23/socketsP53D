//get container for our canvas
const sketchContainer = document.getElementById('sketch-container');

//get socket which only uses websockets as a means of communication
const socket = io({
  transports: ['websocket'],
});

//the p5js sketch
// note: this is using the p5 instance mode
// https://p5js.org/reference/#/p5/p5
// to separate the p5 code from regular javascript
// ... plus, it's cool!

const sketch = (p) => {
  let font;
p.preload = () => {
  font = p.loadFont('Sans.otf');
}
  let positions = {};
  //the p5js setup function
  p.setup = () => {
    //to fill up the full container, get the width an height
    const containerPos = sketchContainer.getBoundingClientRect();
    // try with WEBGL
    const cnv = p.createCanvas(containerPos.width, containerPos.height, p.WEBGL); //the canvas!
    // p.textAlign(p.CENTER, p.CENTER);
    p.frameRate(30); //set framerate to 30, same as server
    p.textFont(font);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(p.height/20);
    socket.on('positions', (data) => {
      //get the data from the server to continually update the positions
      positions = data;
      // console.log(positions);
    });
  };
  // global locations on the 3d grid
  let gx = 1,
    gy = 1
    gz = 1;

  let num = 8;

  let zdepth = 700;
  let clicked = false;
      //the p5js draw function, runs every frame rate
  //(30-60 times / sec)
  p.draw = () => {
    p.orbitControl();
    p.background(0); //reset background to black
    if (!clicked) {
    p.text('Use arrow keys to move up and down\nuse + and - to move out and in', 0, 0);
    }
    // make the grid
    let spacing = p.width / num;
  let x = -(p.width / 2);
  let y = -(p.height / 2);
  let z = -zdepth;
  for (let k = 0; k < num; k++) {
    for (let i = 0; i < num; i++) {
      for (let l = 0; l < num; l++) {
        p.push();
        p.translate(x, y, z);
//         emissiveMaterial("lightblue");
        p.noFill();
        p.stroke(200);
        p.box(spacing - 20);
        p.pop();
        z += spacing;
      }
      z = -zdepth;
      x += spacing;
    }
    x = -(p.width / 2);
    y += spacing;
  }

    for (const id in positions) {
      const position = positions[id];
     
      // draw white box wherever other players' positions are
      let xpos = position.x * spacing - p.width / 2;
      let ypos = position.y * spacing - p.height / 2;
      let zpos = position.z * spacing - zdepth;
      p.push(); 
      p.fill(255); //sets the fill color of the box to white
      p.translate(xpos, ypos, zpos);
      p.box(spacing - 20);
      p.pop();
    }

    let xloc = gx * spacing - p.width / 2;
    let yloc = gy * spacing - p.height / 2;
    let zloc = gz * spacing - zdepth;
    p.push();
    p.translate(xloc, yloc, zloc);
    p.emissiveMaterial("red");
    p.box(spacing - 19);
    p.pop();
  };
  // user changes positions on grid with arrow keys
  p.keyPressed = () => {
    clicked = true;
    switch (p.key) {
      case "ArrowUp":
        gy -= 1;
        break;
      case "ArrowDown":
        gy += 1;
        break;
      case "ArrowLeft":
        gx -= 1;
        break;
      case "ArrowRight":
        gx += 1;
        break;
      case "-":
        gz -= 1;
        break;
      case "+":
        gz += 1;
    }
    // boundaries for our little ball on the grid
    if (gy < 0) gy = 0;
    if (gy > num - 1) gy = num - 1;
    if (gx < 0) gx = 0;
    if (gx > num - 1) gx = num - 1;
    if (gz < 0) gz = 0;
    if (gz > num - 1) gz = num - 1;
    console.log(gx, gy, gz );
  
  
    
    // send this client's updated position back to the server
    socket.emit('updatePosition', {
      x: gx,
      y: gy,
      z: gz
    });
  }
};

//initialize the sketch!
new p5(sketch, sketchContainer);
