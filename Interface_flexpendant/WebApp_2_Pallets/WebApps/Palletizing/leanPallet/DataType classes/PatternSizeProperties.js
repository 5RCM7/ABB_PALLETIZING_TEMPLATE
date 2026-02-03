/**
 * @class PalletProperties
 * @classdesc Class for storing the pattern size
 */
export class patternSizeProperties {
  constructor() {
    // private properties
    this._patternSizeX = 0;
    this._patternSizeY = 0;

    this._minX = 0;
    this._minY = 0;

    this._maxX = 0;
    this._maxY = 0;
  }

  /**
   * Get the X dimension of the pattern size
   * @returns {number} - pattern length in X direction
   */
  get patternSizeX() {
    return this._patternSizeX;
  }

  /**
   * Get the Y dimension of the pattern size
   * @returns {number} - pattern length in Y direction
   */
  get patternSizeY() {
    return this._patternSizeY;
  }

  /**
   * Get the smallest X coordinate
   * @returns {number} - smallest X coordinate
   */
  get minX() {
    return this._minX;
  }

  /**
   * Get the smallest Y coordinate
   * @returns {number} - smallest Y coordinate
   */
  get minY() {
    return this._minY;
  }

  /**
   * Calculate the pattern size in x direction
   * @param {number} x - x coordinates of box corner
   * @param {number} boxX - box dimension in x direction
   */
  setX(x, boxX) {
    if (x + boxX > this._maxX) this._maxX = x + boxX;
    if (x < this._minX) this._minX = x;
    this._patternSizeX = this._maxX - this._minX;
  }

  /**
   * Calculate the pattern size in y direction
   * @param {number} y - y coordinates of box corner
   * @param {number} boxY - box dimension in y direction
   */
  setY(y, boxY) {
    if (y + boxY > this._maxY) this._maxY = y + boxY;
    if (y < this._minY) this._minY = y;
    this._patternSizeY = this._maxY - this._minY;
  }

  /**
   * Reset the pattern size
   */
  resetRanges() {
    this._minX = 9e9;
    this._minY = 9e9;

    this._maxX = -9e9;
    this._maxY = -9e9;
  }

  /**
   * Clone the current instance of patternSizeProperties
   * @returns {patternSizeProperties} - A new instance with the same properties
   */
  clone() {
    const clone = new patternSizeProperties();
    clone._patternSizeX = this._patternSizeX;
    clone._patternSizeY = this._patternSizeY;
    clone._minX = this._minX;
    clone._minY = this._minY;
    clone._maxX = this._maxX;
    clone._maxY = this._maxY;
    return clone;
  }
}
