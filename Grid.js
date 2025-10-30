class Grid {
  constructor(rows, cols, buffer, options = {}) {
    this.initializeState(rows, cols, buffer, options);

    this.tiles = [];
    this.container = this.createControlContainer();
    this.clsBtn = this.createCloseButton();
    this.ctrlBtn = this.createControlButton();
    this.createControls();
    this.registerControlEvents();
    this.handleCloseButton();
    this.handleControlButton();
    this.toggleImageControls();
    this.updateLabels();
    this.updateNoiseLabels();
  }

  initializeState(rows, cols, buffer, options) {
    this.rows = rows;
    this.cols = cols;
    this.buffer = buffer;
    this.assets = options.assets || [];
    this.onSourceChange = options.onSourceChange || (() => {});
    this.onImageChange = options.onImageChange || (() => {});
    this.currentSource =
      options.defaultSource || (this.assets.length ? "image" : "camera");
    this.currentImageName = options.defaultImage || this.assets[0] || null;
    this.s = createVector(width / cols, height / rows);
  }

  createControlContainer() {
    const container = createElement("div");
    container.addClass("control-container");
    return container;
  }
  createCloseButton() {
    const closeBtn = createButton("X");
    closeBtn.style("position", "absolute");
    closeBtn.style("font-size", "10px");
    closeBtn.style("left", "83%");
    this.container.child(closeBtn);
    return closeBtn;
  }
  handleCloseButton() {
    this.clsBtn.mousePressed(() => {
      this.container.style("display", "none");
      this.ctrlBtn.style("display", "block");
    });
    // ;
  }

  createControlButton() {
    const controlsButton = createButton("controls");
    controlsButton.style("position", "absolute");
    controlsButton.style("top", "5px");
    controlsButton.style("left", "10px");
    controlsButton.style("font-size", "15px");
    controlsButton.style("display", "none");
    controlsButton.style("background-color", "rgba(255, 255, 255, 0.8)");
    controlsButton.style("border-radius", "5px");

    // controlsButton.style("left", "83%");
    //  this.container.child(closeBtn);
    return controlsButton;
  }

  handleControlButton() {
    this.ctrlBtn.mousePressed(() => {
      this.container.style("display", "block");
      this.ctrlBtn.style("display", "none");
    });
  }
  createControls() {
    this.rowControl = this.createSliderControl({
      labelText: "Row count",
      min: 1,
      max: 400,
      value: this.rows,
    });

    this.colControl = this.createSliderControl({
      labelText: "Column count",
      min: 1,
      max: 400,
      value: this.cols,
    });

    this.noiseControl = this.createSliderControl({
      labelText: "Noise scale",
      min: 0.001,
      max: 0.1,
      value: 0.01,
      step: 0.001,
    });

    this.noiseSpeedControl = this.createSliderControl({
      labelText: "Noise speed",
      min: 0.0001,
      max: 0.005,
      value: 0.0004,
      step: 0.000005,
    });

    this.sourceControl = this.createSelectControl({
      labelText: "Source",
      options: this.buildSourceOptions(),
      selected: this.currentSource,
    });

    this.imageControl = this.createSelectControl({
      labelText: "Select image",
      options: this.assets.map((asset) => ({ label: asset, value: asset })),
      selected: this.currentImageName,
    });

    this.rowLabel = this.rowControl.label;
    this.rowSlider = this.rowControl.control;
    this.colLabel = this.colControl.label;
    this.colSlider = this.colControl.control;
    this.noiseLabel = this.noiseControl.label;
    this.noiseSlider = this.noiseControl.control;
    this.noiseSpeedLabel = this.noiseSpeedControl.label;
    this.noiseSpeedSlider = this.noiseSpeedControl.control;
    this.sourceLabel = this.sourceControl.label;
    this.sourceSelect = this.sourceControl.control;
    this.imageLabel = this.imageControl.label;
    this.imageSelect = this.imageControl.control;
  }

  createSliderControl({ labelText, min, max, value, step = 1 }) {
    const label = createDiv(labelText);
    this.container.child(label);
    const control = createSlider(min, max, value, step);
    this.container.child(control);
    return { label, control };
  }

  createSelectControl({ labelText, options, selected }) {
    const label = createDiv(labelText);
    this.container.child(label);
    const control = createSelect();
    options.forEach(({ label: optionLabel, value }) =>
      control.option(optionLabel, value)
    );
    if (selected) {
      control.selected(selected);
    }
    this.container.child(control);
    return { label, control };
  }

  buildSourceOptions() {
    const options = [{ label: "Camera", value: "camera" }];
    if (this.assets.length) {
      options.push({ label: "Image", value: "image" });
    }
    return options;
  }

  registerControlEvents() {
    this.rowSlider.input(() => this.createGrid());
    this.colSlider.input(() => this.createGrid());
    this.noiseSlider.input(() => this.noiseGrid());
    this.noiseSpeedSlider.input(() => this.noiseGrid());
    this.sourceSelect.changed(() => this.handleSourceChange());
    this.imageSelect.changed(() => this.handleImageChange());
  }

  handleSourceChange() {
    this.currentSource = this.sourceSelect.value();
    this.toggleImageControls();
    this.onSourceChange(this.currentSource);
  }

  handleImageChange() {
    this.currentImageName = this.imageSelect.value();
    this.onImageChange(this.currentImageName);
  }

  createGrid() {
    this.syncGridDimensions();
    this.buildTiles();
    this.updateLabels();
  }

  syncGridDimensions() {
    this.rows = floor(this.rowSlider.value());
    this.cols = floor(this.colSlider.value());
    this.s = createVector(width / this.cols, height / this.rows);
  }

  buildTiles() {
    this.tiles = [];
    const tileWidth = this.s.x;
    const tileHeight = this.s.y;
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const position = { x: col * tileWidth, y: row * tileHeight };
        const dimensions = { width: tileWidth, height: tileHeight };
        this.tiles.push(new Tile(position, this.buffer, dimensions));
      }
    }
  }

  noiseGrid() {
    if (!this.isBufferReady() || !this.tiles.length) {
      return;
    }

    const noiseScale = this.noiseSlider.value();
    const noiseSpeed = this.noiseSpeedSlider.value();
    const time = frameCount * noiseSpeed;
    const maxScanX = Math.max(this.buffer.width - this.s.x, 0);
    const maxScanY = Math.max(this.buffer.height - this.s.y, 0);

    this.updateNoiseLabels(noiseScale, noiseSpeed);
    let zoff = time;
    this.tiles.forEach((tile, index) => {
      const col = index % this.cols;
      const row = Math.floor(index / this.cols);
      const noiseValX = noise(col * noiseScale, row * noiseScale, time);
      const noiseValY = noise(
        col * noiseScale + 1000,
        row * noiseScale + 1000,
        time
      );
      const scanX = floor(noiseValX * maxScanX);
      const scanY = floor(noiseValY * maxScanY);
      tile.scan(scanX, scanY);
      tile.setImage(this.buffer);
      zoff += 0.0000001;
    });
  }

  updateLabels() {
    this.rowLabel.html(`Rows: ${this.rows}`);
    this.colLabel.html(`Columns: ${this.cols}`);
  }

  updateNoiseLabels(
    noiseScale = this.noiseSlider.value(),
    noiseSpeed = this.noiseSpeedSlider.value()
  ) {
    this.noiseLabel.html(`Noise scale: ${noiseScale.toFixed(3)}`);
    this.noiseSpeedLabel.html(`Noise speed: ${noiseSpeed.toFixed(4)}`);
  }

  toggleImageControls() {
    const display = this.currentSource === "image" ? "block" : "none";
    this.imageLabel.style("display", display);
    this.imageSelect.style("display", display);
  }

  isBufferReady() {
    return this.buffer && this.buffer.width && this.buffer.height;
  }

  setBuffer(buffer) {
    this.buffer = buffer;
    this.tiles.forEach((tile) => tile.setImage(buffer));
  }

  getSourceType() {
    return this.currentSource;
  }

  getSelectedImageName() {
    return this.currentImageName;
  }
}
