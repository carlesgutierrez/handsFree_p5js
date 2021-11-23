/**
 * Finger painting: A starter sketch demonstrating how to "finger paint" with Handsfree.js
 *
 * Step 1: Press the ▶ Play Button on the top left of the p5 editor (or load this sketch in a browser)
 * Step 2: Click "Start Webcam" underneath the black canvas
 * Step 3: Wait a few moments for everything to start (the computer vision models are large)
 * Step 4: Pinch your fingers to paint 👌 The left index pointer (big black circle) is an eraser and the left pinky clears the whole screen
 *
 * ----------
 *
 * How it works (CTRL+F for "#n" to jump to that bit of code):
 * -- Add Handsfree.js to index.html
 * #1 Configure Handsfree.js
 * #2 Detect when fingers are pinched and then paint there
 * #3 Draw your hands landmarks onto the sketch
 *
 * ----------
 *
 * Docs: https://handsfree.js.org
 * GitHub: https://github.com/midiblocks/handsfree
 * Twitter (me + handsfree.js): https://github.com/midiblocks
 * Twitter (just handsfree.js): https://github.com/handsfreejs
 *
 * ----------
 *
 * Ideas:
 * - Experiment with different input methods (like pinching to cycle through colors). Gestures are coming soon: https://handsfree.js.org/gesture/
 * - If you need 3D (but with a limit of 1 hand), see here: https://handsfree.js.org/ref/model/handpose.html
 * - Try the "palm pointer" for a different approach to painting: https://handsfree.js.org/ref/plugin/palmPointers.html
 * - This can support up to 4 hands: https://handsfree.js.org/ref/model/hands.html#with-config
 */

/**
 * Setup
 * - Configure handsfree (set which models, plugins, and gestures you want to use)
 * - Create start/stop buttons. It's nice to always ask user for permission to start webcam :)
 */
function setup() {
  sketch = createCanvas(640, 480);

  //Use capture from p5js
  capture = createCapture(VIDEO);
  capture.hide();

  // Colors for each fingertip
  colorMap = [
    // Left fingertips
    [
      color(0, 0, 0),
      color(255, 0, 255),
      color(0, 0, 255),
      color(255, 255, 255),
    ],
    // Right fingertips
    [color(255, 0, 0), color(0, 255, 0), color(0, 0, 255), color(255, 255, 0)],
  ];

  // #1 Turn on some models (hand tracking) and the show debugger
  // @see https://handsfree.js.org/#quickstart-workflow
  handsfree = new Handsfree({
    showDebug: false, // Comment this out to hide the default webcam feed with landmarks
    hands: true,
    setup: {
      video: {
        $el: capture.elt,
      },
    },
  });

  // Add webcam buttons under the canvas
  // Handsfree.js comes with a bunch of classes to simplify hiding/showing things when things are loading
  // @see https://handsfree.js.org/ref/util/classes.html#started-loading-and-stopped-states
  buttonStart = createButton("Start Webcam");
  buttonStart.class("handsfree-show-when-stopped");
  buttonStart.class("handsfree-hide-when-loading");
  buttonStart.mousePressed(() => handsfree.start());

  // Create a "loading..." button
  buttonLoading = createButton("...loading...");
  buttonLoading.class("handsfree-show-when-loading");

  // Create a stop button
  buttonStop = createButton("Stop Webcam");
  buttonStop.class("handsfree-show-when-started");
  buttonStop.mousePressed(() => handsfree.stop());
}

/**
 * Main draw loop
 */
function draw() {
  background(0);

  //Draw camera first
  push();
  imageMode(CENTER);
  translate(width, 0);
  scale(-1, 1);
  image(capture, width * 0.5, height * 0.5, width, height);
  noStroke();
  fill(10, 10, 10, 200);
  rect(0, 0, width, height);
  pop();

  fingerPaint();
  drawHands();
}

/**
 * #2 Finger paint
 * Since p5.js already has it's own loop, we just check the data directly
 * @see https://handsfree.js.org/ref/plugin/pinchers.html
 */
// Whenever we pinch and move we'll store those points as a set of [x1, y1, handIndex, fingerIndex, size]
paint = [];

function fingerPaint() {
  // Check for pinches and create dots if something is pinched
  const hands = handsfree.data?.hands;
  if (hands?.pinchState) {
    // Loop through each hand
    hands.pinchState.forEach((hand, handIndex) => {
      // Loop through each finger
      hand.forEach((state, finger) => {
        // Other states are "start" and "released"
        if (state === "held") {
          // Left [0] index finger [0] is the eraser, so let's make it paint larger
          const circleSize = handIndex === 0 && finger === 0 ? 40 : 10;

          // Store the paint
          paint.push([
            hands.curPinch[handIndex][finger].x,
            hands.curPinch[handIndex][finger].y,
            handIndex,
            finger,
            circleSize,
          ]);
        }
      });
    });
  }

  // Draw the paint
  paint.forEach((dot) => {
    fill(colorMap[dot[2]][dot[3]]);
    circle(
      sketch.width - dot[0] * sketch.width,
      dot[1] * sketch.height,
      dot[4]
    );
  });

  // Clear everything if the left [0] pinky [3] is pinched
  if (hands?.pinchState && hands.pinchState[0][3] === "released") {
    paint = [];
  }
}

/**
 * #3 Draw the hands into the P5 canvas
 * @see https://handsfree.js.org/ref/model/hands.html#data
 */
function drawHands() {
  const hands = handsfree.data?.hands;

  // Bail if we don't have anything to draw
  if (!hands?.landmarks) return;

  // Draw keypoints
  hands.landmarks.forEach((hand, handIndex) => {
    hand.forEach((landmark, landmarkIndex) => {
      // Set color
      // @see https://handsfree.js.org/ref/model/hands.html#data
      if (colorMap[handIndex]) {
        switch (landmarkIndex) {
          case 8:
            fill(colorMap[handIndex][0]);
            break;
          case 12:
            fill(colorMap[handIndex][1]);
            break;
          case 16:
            fill(colorMap[handIndex][2]);
            break;
          case 20:
            fill(colorMap[handIndex][3]);
            break;
          default:
            fill(color(255, 255, 255));
        }
      }

      // Set stroke
      if (handIndex === 0 && landmarkIndex === 8) {
        stroke(color(255, 255, 255));
        strokeWeight(5);
        circleSize = 40;
      } else {
        stroke(color(0, 0, 0));
        strokeWeight(0);
        circleSize = 10;
      }

      circle(
        // Flip horizontally
        sketch.width - landmark.x * sketch.width,
        landmark.y * sketch.height,
        circleSize
      );
    });
  });
}
