class Tile {
  constructor(pos, image, dimensions) {
    this.pos = createVector(pos.x, pos.y);
    this.image = image;
    this.scanX = pos.x;
    this.scanY = pos.y;
    this.dimensions = dimensions;
  }

  show() {
    if (!this.image) {
      return;
    }
    image(
      this.image,
      this.pos.x,
      this.pos.y,
      this.dimensions.width,
      this.dimensions.height,
      this.scanX,
      this.scanY,
      this.dimensions.width,
      this.dimensions.height
    );
  }
  setImage(image) {
    this.image = image;
  }
  scan(x, y) {
    this.scanX = x;
    this.scanY = y;
  }
}
