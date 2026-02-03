import { DPI, palletColor } from '../../constants/common.js';
import Box from './canvasBox.js';

/**
 * @class Pallet
 * @classdesc This class is responsible for rendering the pallet on the canvas
 * @param {string} id - ID of the canvas
 * @param {HTMLElement} parent - Parent element of the pallet
 * @param {number} palletLength - Length of the pallet
 * @param {number} palletWidth - Width of the pallet
 * @param {Array<Box>} boxes - Array of rendered boxes
 * @param {Object} patternSize - Size of the pattern
 */
export default class Pallet {
  constructor(
    id,
    parent,
    stackData,
    palletLength,
    palletWidth,
    boxes,
    patternSize
  ) {
    this.id = id;
    this.parent = parent;
    this.palletLength = palletLength;
    this.palletWidth = palletWidth;
    this.scale = 300 / this.palletWidth;
    this.canvas = this.createCanvas(
      this.id,
      this.parent,
      this.palletLength * this.scale,
      this.palletWidth * this.scale
    );
    this.boxes = boxes;
    this.calcBoxes = JSON.parse(JSON.stringify(boxes));
    this.patternSize = patternSize;
    this.boxSelected = null;
    this.selectedBoxIndex = -1;

    this.stackData = stackData;
  }

  /**
   * Create a canvas element and append it to the parent element
   * @alias createCanvas
   * @memberof Pallet
   * @param {string} id - ID of the canvas
   * @param {HTMLElement} parent - Parent element of the pallet
   * @param {number} canvasWidth - Width of the canvas
   * @param {number} canvasHeight - Height of the canvas
   * @returns {Object} - Object containing the canvas context, the id and the canvas element
   */
  createCanvas(id, parent, canvasWidth, canvasHeight) {
    const childDiv = document.createElement('div');
    childDiv.id = id;
    childDiv.style.width = canvasWidth + 'px';
    childDiv.style.height = canvasHeight + 'px';

    const canvasElem = document.createElement('canvas');
    canvasElem.width = canvasWidth;
    canvasElem.height = canvasHeight;

    childDiv.appendChild(canvasElem);
    parent.appendChild(childDiv);

    const ctx = canvasElem.getContext('2d');
    this.configCanvas(ctx);

    return {
      ctx: ctx,
      id: id,
      canvasElem: canvasElem,
    };
  }

  /**
   * Configure the canvas, change origin and scale it
   * @alias configCanvas
   * @memberof Pallet
   * @param {Object} ctx - canvas context
   */
  configCanvas(ctx) {
    this.changeOrigin(ctx);
    ctx.scale(this.scale, this.scale);
  }

  /**
   * Change the origin of the canvas
   * @alias changeOrigin
   * @memberof Pallet
   * @param {Object} ctx - canvas context
   */
  changeOrigin(ctx) {
    const DEG_TO_RAD = Math.PI / 180;

    ctx.translate(0, ctx.canvas.height);
    ctx.rotate(-90 * DEG_TO_RAD);
  }

  /**
   * Draw the pallet on the canvas
   * @alias draw
   * @memberof Pallet
   */
  draw() {
    const woodHeight = 70.5 / this.scale;
    const dist = 25;
    const ctx = this.canvas.ctx;
    ctx.lineWidth = DPI;
    ctx.fillStyle = palletColor;

    for (let i = 0; i < 6; i++) {
      ctx.fillRect(
        i * (dist + woodHeight),
        0,
        woodHeight,
        this.palletLength / this.scale
      );
    }
  }

  /**
   * Clear the canvas
   * @alias clearCanvas
   * @memberof Pallet
   */
  clearCanvas() {
    this.canvas.ctx.clearRect(
      0,
      0,
      this.palletLength / this.scale,
      this.palletWidth / this.scale
    );
  }

  /**
   * Clear the canvas and draw the pallet again
   * @alias clearBoxes
   * @memberof Pallet
   */
  clearBoxes() {
    this.clearCanvas();
    this.draw();
  }

  /**
   * Set the pattern for the pallet
   * @param {object} boxPattern
   * @memberof Pallet
   */
  set pattern(boxPattern) {
    this.boxes = boxPattern;
    this.calcBoxes = JSON.parse(JSON.stringify(boxPattern));
  }

  /**
   * Set the pattern size for the pallet
   * @param {object} patternSize
   * @memberof Pallet
   */
  set patternDim(patternSize) {
    this.patternSize = patternSize;
  }

  /**
   * Draw the boxes on the pallet
   * @alias drawBoxes
   * @param {boolean} centerBoxes - True if the boxes should be centered, false otherwise
   * @param {Array<number>} boxStatuses - Array containing the status of the boxes
   * @param {boolean} drawIndex - True if the index of the boxes should be drawn, false otherwise
   * @memberof Pallet
   */
  drawBoxes(
    centerBoxes = true,
    boxStatuses = null,
    drawIndex = false,
    boxParents = new Array(40).fill(0)
  ) {
    const boxes = this.getBoxes();
    this.clearBoxes();
    boxes.forEach((box) => (box.collide = false));

    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const collision = this.boxOnBox(boxes[i], boxes[j], 0.1);
        boxes[i].collide = boxes[i].collide || collision;
        boxes[j].collide = boxes[j].collide || collision;
      }
    }

    const offsetX =
      (this.palletWidth - this.patternSize.patternSizeY) / 2 -
      this.patternSize._minY;
    const offsetY =
      (this.palletLength - this.patternSize.patternSizeX) / 2 -
      this.patternSize._minX;

    boxes.forEach((box, i) => {
      if (centerBoxes) box.centerBoxes(offsetX, offsetY);
      if (
        box.x < 0 ||
        box.y < 0 ||
        box.x + box.length > this.palletWidth ||
        box.y + box.width > this.palletLength
      ) {
        box.collide = true;
      }
      boxStatuses
        ? box.draw(this.canvas.ctx, boxStatuses[i])
        : box.draw(this.canvas.ctx);

      if (drawIndex) {
        if (boxParents[i] === 0) {
          this.drawBoxIndex(box, i + 1);
        } else {
          this.drawBoxIndex(box, boxParents[i]);
        }
      }
    });
  }

  /**
   * Draw the index of the boxes
   * @alias drawBoxIndex
   * @memberof Pallet
   * @param {Box} box - Box to draw the index on
   * @param {number} index - Index of the box
   */
  drawBoxIndex(box, index) {
    const offs = 10;
    this.canvas.ctx.fillStyle = '#fff';
    this.canvas.ctx.font = '70px Arial';

    this.canvas.ctx.rotate(90 * (Math.PI / 180));

    this.canvas.ctx.fillText(
      index,
      box.y + box.width / 2 - 2 * offs,
      -box.x - box.length / 2 + offs
    );

    this.canvas.ctx.rotate(-90 * (Math.PI / 180));
  }

  /**
   * Draw the labels of the boxes
   * @alias drawBoxLabels
   * @memberof Pallet
   */
  drawBoxLabels() {
    this.getBoxes().forEach((box) => {
      box.drawLabel(this.canvas.ctx);
    });
  }

  /**
   * Check if two boxes are colliding with a tolerance
   * @alias boxOnBox
   * @memberof Pallet
   * @param {Box} box1 - First box
   * @param {Box} box2 - Second box
   * @param {number} tolerance - The tolerance value
   * @returns {boolean} - True if the boxes are colliding, false otherwise
   */
  boxOnBox(box1, box2, tolerance = 0) {
    return (
      box1.x < box2.x + box2.length - tolerance &&
      box1.x + box1.length > box2.x + tolerance &&
      box1.y < box2.y + box2.width - tolerance &&
      box1.y + box1.width > box2.y + tolerance
    );
  }

  /**
   * Get back the boxes array
   * @alias getBoxes
   * @memberof Pallet
   * @returns {Array<Box>} - Array of boxes
   */
  getBoxes() {
    return this.boxSelected
      ? [...this.boxes, this.boxSelected]
      : [...this.boxes];
  }

  /**
   * Get back the boxes that are used for calculation, not centered
   * @alias getCalcBoxes
   * @memberof Pallet
   * @returns {Array<Object>} - Array of boxes
   */
  getCalcBoxes() {
    return this.calcBoxes;
  }

  /**
   * Handle the mouse down event
   * @alias onMouseDown
   * @memberof Pallet
   * @param {Object} event - Event object
   */
  onMouseDown(stackIndex, event) {
    const mousePos = this.getMousePos(event);

    if (!this.boxSelected) {
      // Box is not selected
      this.selectBox(this.findBoxOnPos(mousePos));
    }

    if (this.boxSelected) {
      if (this.boxSelected.pointOnBox(mousePos)) {
        if (stackIndex != -1) {
          // Box already selected and clicked on box
          const boxItem =
            this.stackData.pItems[stackIndex][this.selectedBoxIndex];
          const labelOrient = boxItem.labelOrient;
          switch (labelOrient) {
            case 1:
            case 3:
              boxItem.labelOrient = labelOrient === 1 ? 3 : 1;
              break;
            default:
              boxItem.labelOrient = labelOrient === 0 ? 2 : 0;
          }
          this.boxSelected.labelOrient = boxItem.labelOrient;
        }
      } else {
        // Box already selected and clicked outside box
        this.deselectBox();
      }
    }
    this.renderBoxWithLabels();
  }

  /**
   * Render boxes with labels
   * @alias renderBoxWithLabels
   * @memberof Pallet
   */
  renderBoxWithLabels() {
    this.drawBoxes(false);
    this.drawBoxLabels();
  }

  /**
   * Get the mouse position on the canvas
   * @alias getMousePos
   * @memberof Pallet
   * @param {Object} evt - Event object
   * @returns {Object} - Object containing the x and y coordinate of the mouse
   */
  getMousePos(evt) {
    const rect = this.canvas.canvasElem.getBoundingClientRect();

    return {
      x: (rect.bottom - evt.clientY) / this.scale,
      y: (evt.clientX - rect.left) / this.scale,
    };
  }

  /**
   * Deselect the box
   * @alias deselectBox
   * @memberof Pallet
   */
  deselectBox() {
    if (this.boxSelected) {
      this.boxSelected.selected = false;
      this.boxes.splice(this.selectedBoxIndex, 0, this.boxSelected);
      this.boxSelected = null;
      this.selectedBoxIndex = -1;
    }
  }

  /**
   * Select the box
   * @alias deselectBox
   * @memberof Pallet
   */
  selectBox(boxToBeSelected) {
    // Remove the selected box from boxes array and add it to boxSelected
    this.boxes = this.boxes.filter((box) => box !== boxToBeSelected);
    this.boxSelected = boxToBeSelected;
    if (this.boxSelected) {
      this.boxSelected.selected = true;
    }
  }

  /**
   * Find the box on the position and the index of that box
   * @alias findBoxOnPos
   * @memberof Pallet
   * @param {Object} pos - Position of the mouse
   * @returns {Box} - Box on the position
   */
  findBoxOnPos(pos) {
    // Save the box and the index of the box
    let index = -1;
    const boxesOnPos = this.boxes.filter((box, i) => {
      if (box.pointOnBox(pos, box)) {
        index = i;
        return true;
      }
    });
    this.selectedBoxIndex = index;
    // In case of colliding boxes, return the last one
    if (boxesOnPos.length > 0) {
      return boxesOnPos[boxesOnPos.length - 1];
    } else {
      return null;
    }
  }

  /**
   * Find the new place for the box on the pallet starting from 0,0
   * @alias findNewPlaceForBox
   * @memberof Pallet
   * @param {string} orientation - Orientation of the box
   * @returns {string} - Formula for the new place
   */
  findNewPlaceForBox(orientation, direction = 'x') {
    const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));

    // "length" = dimension along X, "width" = dimension along Y
    const [boxDimX, boxDimY] =
      orientation === 'H'
        ? [this.stackData.boxProp.length, this.stackData.boxProp.width]
        : [this.stackData.boxProp.width, this.stackData.boxProp.length];

    const newBox = new Box(0, 0, 0, 0, 0, [false, false, false, false]);
    const inc = gcd(boxDimX, boxDimY);

    if (direction === 'x') {
      // Outer loop: y, Inner loop: x
      for (let y = 0; y + boxDimY <= this.palletWidth; y += inc) {
        for (let x = 0; x + boxDimX <= this.palletLength; x += inc) {
          newBox.update(x, y, x + boxDimX, y + boxDimY);
          if (this.isPlaceFree(newBox)) {
            const formula = this.calculatePlacementFormula(
              x,
              y,
              orientation,
              newBox
            );
            if (formula) return formula;
          }
        }
      }
    } else {
      // direction = 'y': Outer loop: x, Inner loop: y
      for (let x = 0; x + boxDimX <= this.palletLength; x += inc) {
        for (let y = 0; y + boxDimY <= this.palletWidth; y += inc) {
          newBox.update(x, y, x + boxDimX, y + boxDimY);
          if (this.isPlaceFree(newBox)) {
            const formula = this.calculatePlacementFormula(
              x,
              y,
              orientation,
              newBox
            );
            if (formula) return formula;
          }
        }
      }
    }

    return null;
  }

  calculatePlacementFormula(coordX, coordY, orientation, newBox) {
    // Same coefficient logic as your original function
    const calculateCoefficients = (solutions, axis) => {
      let l, w;
      if (solutions.length === 1) {
        l = solutions[0].a;
        w = solutions[0].b;
      } else {
        let boxL = 0;
        let boxW = 0;
        this.calcBoxes.forEach((box) => {
          const endBox = box[axis] + box.length;
          if (
            newBox[axis] >= box[axis] &&
            newBox[axis] < endBox &&
            box[axis === 'x' ? 'y' : 'x'] <= newBox[axis === 'x' ? 'y' : 'x']
          ) {
            axis === 'x'
              ? box.length > box.width
                ? boxW++
                : boxL++
              : box.length > box.width
              ? boxL++
              : boxW++;
          }
        });

        // Sort to prioritize higher l and lower w
        solutions.sort((a, b) => b.a - a.a || a.b - b.b);

        if (boxL === solutions[0].a || boxW === solutions[0].b) {
          l = solutions[0].a;
          w = solutions[0].b;
        } else {
          l = solutions[1].a;
          w = solutions[1].b;
        }
      }
      return `${l}l+${w}w`;
    };

    // Collect coefficient solutions
    const solutionsX = this.findAllCoefficients(
      coordX,
      this.stackData.boxProp.length,
      this.stackData.boxProp.width
    );
    const solutionsY = this.findAllCoefficients(
      coordY,
      this.stackData.boxProp.length,
      this.stackData.boxProp.width
    );

    // Compute final formula
    const xCoord = calculateCoefficients(solutionsX, 'x');
    const yCoord = calculateCoefficients(solutionsY, 'y');
    return `${orientation[0]};${xCoord};${yCoord};`;
  }

  /**
   * Find a linear combinations of a number
   * @alias findAllCoefficients
   * @memberof Pallet
   * @param {number} target - Target number
   * @param {number} num1 - First number to be combined
   * @param {number} num2 - Second number to be combined
   * @returns {Array<Object>} - Array of solutions
   */
  findAllCoefficients(target, num1, num2) {
    let solutions = [];
    for (let a = 0; a <= target / num1; a++) {
      for (let b = 0; b <= target / num2; b++) {
        if (a * num1 + b * num2 === target) {
          solutions.push({ a, b });
        }
      }
    }
    return solutions;
  }

  /**
   * Check if there is free place for the box
   * @alias isPlaceFree
   * @memberof Pallet
   * @param {Box} newBox - New box to be placed
   */
  isPlaceFree(newBox) {
    return !this.getCalcBoxes().some((box) => this.boxOnBox(newBox, box));
  }

  /**
   * Remove the selected box and from calculated box array
   * @alias removeBox
   * @memberof Pallet
   * @returns {number} - Index of the removed box
   */
  removeBox() {
    this.boxSelected = null;
    this.calcBoxes.splice(this.selectedBoxIndex, 1);
    return this.selectedBoxIndex;
  }
}
