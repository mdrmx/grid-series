// Ordered list of available still images to expose in the grid UI.
const ASSET_NAMES = [
  "wallala.jpg",
  "botticelli.png",
  "james-webb.jpg",
  "james-webb2.jpg",
  "yinka.jpg",
  "penfold.png",
  "fonts1.png",
  "logo-banner.png",
];
let logoImg;

let grid;
let cameraCapture;
let fullscreenButton;
const stillImages = {};
let activeBuffer = null;
let isFullscreen = false;

// Preload all still images ahead of setup to avoid draw-time fetches.
function preload() {
  ASSET_NAMES.forEach((name) => {
    stillImages[name] = loadImage(`assets/${name}`);
  });
  logoImg = loadImage(`assets/logo-banner.png`);
}

// Initialize canvas, media sources, and the grid controller UI.
function setup() {
  const defaultImageName = ASSET_NAMES[ASSET_NAMES.length - 1];
  const defaultImage = stillImages[defaultImageName];

  createCanvas(defaultImage.width, defaultImage.height);
  activeBuffer = defaultImage;

  // Configure the webcam capture element so it is ready when the user selects it.
  cameraCapture = createCapture(VIDEO, { flipped: true });
  cameraCapture.elt.setAttribute("playsinline", "");
  cameraCapture.hide();
  cameraCapture.elt.onloadedmetadata = () => {
    cameraCapture.size(
      cameraCapture.elt.videoWidth * 2,
      cameraCapture.elt.videoHeight * 2
    );
    cameraCapture.hide();
    if (grid && grid.getSourceType() === "camera") {
      updateBuffer(cameraCapture);
    }
  };

  grid = new Grid(40, 40, defaultImage, {
    assets: ASSET_NAMES,
    defaultSource: "camera",
    defaultImage: defaultImageName,
    onSourceChange: handleSourceChange,
    onImageChange: handleImageChange,
  });
  grid.createGrid();
  grid.setBuffer(defaultImage);

  fullscreenButton = createButton("Enter Fullscreen");
  fullscreenButton.parent(grid.container);
  fullscreenButton.mousePressed(toggleFullscreen);

  handleSourceChange(grid.getSourceType());
}

// Draw the evolving grid by sampling noise-driven regions from the active buffer.
function draw() {
  background(255);
  noStroke();
  grid.noiseGrid();
  grid.tiles.forEach((tile) => {
    tile.show();
  });
  // fill(255, 255);
  // rect(0, height - height / 4, width / 4, height / 4, 2);
  // image(logoImg, 0, height - height / 4, width / 4, height / 4);
  // console.log(stillImages);
}

// React to source changes from the UI, selecting camera or still images.
function handleSourceChange(source) {
  if (source === "camera") {
    waitForMedia(cameraCapture, () => updateBuffer(cameraCapture));
    return;
  }
  handleImageChange(grid.getSelectedImageName());
}

// Swap the underlying buffer when the user picks a different still image.
function handleImageChange(imageName) {
  if (!imageName || grid.getSourceType() !== "image") {
    return;
  }
  const selectedImage = stillImages[imageName];
  if (!selectedImage) {
    return;
  }
  if (selectedImage.width && selectedImage.height) {
    updateBuffer(selectedImage);
  } else {
    waitForMedia(selectedImage, () => updateBuffer(selectedImage));
  }
}

// Update the render buffer and resize the canvas to the new dimensions.
function updateBuffer(buffer) {
  if (!buffer || !buffer.width || !buffer.height) {
    return;
  }
  activeBuffer = buffer;
  if (!isFullscreen) {
    resizeCanvas(buffer.width, buffer.height);
  }
  grid.setBuffer(buffer);
  grid.createGrid();
}

// Toggle fullscreen mode and resize the canvas/grid accordingly.
function toggleFullscreen() {
  const shouldBeFullscreen = !fullscreen();
  fullscreen(shouldBeFullscreen);
  isFullscreen = shouldBeFullscreen;
  if (fullscreenButton) {
    fullscreenButton.html(
      shouldBeFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"
    );
  }
  if (!grid) {
    return;
  }
  if (shouldBeFullscreen) {
    resizeCanvas(windowWidth, windowHeight);
    grid.createGrid();
    return;
  }
  if (activeBuffer) {
    resizeCanvas(activeBuffer.width, activeBuffer.height);
    grid.createGrid();
  }
}

// React to browser window changes while fullscreen to keep canvas fitted.
function windowResized() {
  if (!isFullscreen) {
    return;
  }
  if (!grid) {
    return;
  }
  resizeCanvas(windowWidth, windowHeight);
  grid.createGrid();
}
// Ensure media assets report valid dimensions before invoking the callback.
function waitForMedia(media, callback) {
  if (!media) {
    return;
  }
  if (media.width && media.height) {
    callback();
    return;
  }
  setTimeout(() => waitForMedia(media, callback), 50);
}
