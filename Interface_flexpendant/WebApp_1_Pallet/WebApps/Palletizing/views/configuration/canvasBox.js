import {
  DPI,
  boxColor,
  boxBorder,
  labelColor,
  labelBorder,
  boxCollColor,
  boxCollBorder,
  boxSelColor,
  boxSelnCollColor,
  boxSelBorder,
  boxPlacedColor,
  boxPlacedBorder,
  boxPlacingColor,
  boxPlacingBorder,
  boxLostColor,
  boxLostBorder,
} from '../../constants/common.js';

/**
 * @class Box
 * @classdesc This class is responsible for rendering the box on the canvas
 * @param {number} boxposStartX - The x coordinate of the box's starting position
 * @param {number} boxposStartY - The y coordinate of the box's starting position
 * @param {number} boxposEndX - The x coordinate of the box's ending position
 * @param {number} boxposEndY - The y coordinate of the box's ending position
 * @param {number} labelOrient - The orientation of the box label
 * @param {Array.<boolean>} labelPos - The positions of the label on the box
 */
export default class Box {
  // Change canvas X,Y directions
  constructor(
    boxposStartX,
    boxposStartY,
    boxposEndX,
    boxposEndY,
    labelOrient,
    labelPos
  ) {
    this.x = boxposStartY;
    this.y = boxposStartX;
    this.length = boxposEndY - boxposStartY;
    this.width = boxposEndX - boxposStartX;
    this.labelOrient = labelOrient;
    this.labelPos = labelPos;
    this.collide = false;
    this.selected = false;
  }

  /**
   * Update the box position
   * @alias update
   * @memberof Box
   * @param {number} boxposStartX - The x coordinate of the box's starting position
   * @param {number} boxposStartY - The y coordinate of the box's starting position
   * @param {number} boxposEndX - The x coordinate of the box's ending position
   * @param {number} boxposEndY - The y coordinate of the box's ending position
   */
  update(boxposStartX, boxposStartY, boxposEndX, boxposEndY) {
    this.x = boxposStartY;
    this.y = boxposStartX;
    this.length = boxposEndY - boxposStartY;
    this.width = boxposEndX - boxposStartX;
  }

  /**
   * Draw the box on the canvas
   * @alias draw
   * @param {Object} ctx - canvas context
   * @param {number} boxState - The state of the box
   * @memberof Box
   */
  draw(ctx, boxState = 1) {
    ctx.lineWidth = 3;
    this.drawBoxWithBorder(
      ctx,
      this.fillStyle(boxState),
      this.strokeStyle(boxState),
      this
    );
  }

  /**
   * Draw the box/label with borders on the canvas
   * @alias drawBoxWithBorder
   * @param {Object} ctx - canvas context
   * @param {string} fillStyle - fill style of the box
   * @param {string} strokeStyle - stroke style of the box
   * @memberof Box
   */
  drawBoxWithBorder(ctx, fillStyle, strokeStyle, box) {
    ctx.fillStyle = fillStyle;
    ctx.strokeStyle = strokeStyle;
    ctx.fillRect(box.x, box.y, box.length, box.width);
    ctx.strokeRect(box.x, box.y, box.length, box.width);
  }

  /**
   * Draw the label on the box
   * @alias drawLabel
   * @param {Object} ctx - canvas context
   * @memberof Box
   */
  drawLabel(ctx) {
    const labelLength =
      this.length > this.width ? this.length / 15 : this.width / 15;
    const labelWidthLong = this.width * 0.7;
    const labelWidthShort = this.length * 0.7;
    const fillStyle = labelColor;
    const strokeStyle = labelBorder;
    ctx.lineJoin = 'round';
    ctx.lineWidth = 4;

    // Use calculated label positions to draw labels
    const createLabel = (x, y, length, width) => ({ x, y, length, width });
    const labels = [
      createLabel(
        this.x,
        this.y +
          this.width / 5 -
          (this.length > this.width ? labelLength / 2 : labelLength),
        labelLength,
        labelWidthLong
      ),
      createLabel(
        this.x + (this.length * 0.3) / 2,
        this.y + this.width - labelLength,
        labelWidthShort,
        labelLength
      ),
      createLabel(
        this.x + this.length - labelLength,
        this.y +
          this.width / 5 -
          (this.length > this.width ? labelLength / 2 : labelLength),
        labelLength,
        labelWidthLong
      ),
      createLabel(
        this.x + (this.length * 0.3) / 2,
        this.y,
        labelWidthShort,
        labelLength
      ),
    ];

    // Change label orientation based on the labelOrient
    const orientedLabels = labels
      .slice(this.labelOrient)
      .concat(labels.slice(0, this.labelOrient));

    // Draw the labels where it is defined
    this.labelPos.forEach((value, i) => {
      if (value) {
        this.drawBoxWithBorder(ctx, fillStyle, strokeStyle, orientedLabels[i]);
      }
    });

    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.lineWidth = DPI;
    ctx.lineJoin = 'bevel';
  }

  /**
   * Select the fill style of the box
   * @alias fillStyle
   * @memberof Box
   * @param {number} boxState - The state of the box
   * @returns {string} - fill style of the box
   */
  fillStyle(boxState) {
    switch (boxState) {
      case 1:
        return this.collide
          ? this.selected
            ? boxSelnCollColor
            : boxCollColor
          : this.selected
          ? boxSelColor
          : boxColor;
      case 2:
        return boxPlacingColor;
      case 3:
        return boxPlacedColor;
      case 4:
        return boxLostColor;
      default:
        return undefined;
    }
  }

  /**
   * Select the stroke style of the box
   * @alias strokeStyle
   * @memberof Box
   * @returns {string} - stroke style of the box
   */
  strokeStyle(boxState) {
    switch (boxState) {
      case 1:
        return this.selected
          ? boxSelBorder
          : this.collide
          ? boxCollBorder
          : boxBorder;
      case 2:
        return boxPlacingBorder;
      case 3:
        return boxPlacedBorder;
      case 4:
        return boxLostBorder;
      default:
        return undefined;
    }
  }

  /**
   * Center the boxes on the pallet
   * @alias centerBoxes
   * @memberof Box
   * @param {number} xOffs - The x offset of the box
   * @param {number} yOffs - The y offset of the box
   */
  centerBoxes(xOffs, yOffs) {
    this.x += xOffs;
    this.y += yOffs;
  }

  /**
   * Check if the point is on the box
   * @alias pointOnBox
   * @memberof Box
   * @param {Object} coordinate - The coordinate of the point
   * @returns {boolean} - True if the point is on the box, false otherwise
   */
  pointOnBox(coordinate) {
    return (
      this.x <= coordinate.x &&
      this.x + this.length >= coordinate.x &&
      this.y <= coordinate.y &&
      this.y + this.width >= coordinate.y
    );
  }
}
