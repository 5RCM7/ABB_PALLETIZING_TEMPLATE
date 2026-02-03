import { linkTypes } from '../../constants/common.js';

/**
 * @class patternItemProperties
 * @classdesc Class for storing items on the pattern
 * @param {number} ID - ID the ID of the specific item
 * @param {Object} formula - Formula for the item/box
 * @param {number} maxLSL - maximum items long side lead
 * @param {number} maxSSL - maximum items shor side lead
 */
export class patternItemProperties {
  constructor(ID, formula, maxLSL, maxSSL) {
    this.formula = formula;
    this.ID = ID;
    this.parent = -1;
    this.lastLink = -1;
    this.linkType = linkTypes.noLink;
    this.used = true;
    this.labelOrient = 0;
    this.pickGripperOrient = 0;
    this.placeGripperOrient = 0;
    this.approachDir = 0;

    this.boxOrient = '';
    this.boxStartX = 0;
    this.boxStartY = 0;
    this.boxEndX = 0;
    this.boxEndY = 0;
    this.unitStartX = 0;
    this.unitStartY = 0;
    this.unitEndX = 0;
    this.unitEndY = 0;
    this.centerDist = 0;

    this.freeSides = [false, false, false, false, false, false, false, false];

    if (maxLSL >= 1 && maxSSL === 0) this.linkType = linkTypes.longSideLink;
    if (maxLSL === 0 && maxSSL >= 1) this.linkType = linkTypes.shortSideLink;
  }

  /**
   * Clone the current instance of patternItemProperties
   * @returns {patternItemProperties} - A new instance with the same properties
   */
  clone() {
    const clone = new patternItemProperties(this.ID, this.formula, 0, 0);
    clone.parent = this.parent;
    clone.lastLink = this.lastLink;
    clone.linkType = this.linkType;
    clone.used = this.used;
    clone.labelOrient = this.labelOrient;
    clone.pickGripperOrient = this.pickGripperOrient;
    clone.placeGripperOrient = this.placeGripperOrient;
    clone.approachDir = this.approachDir;
    clone.boxOrient = this.boxOrient;
    clone.boxStartX = this.boxStartX;
    clone.boxStartY = this.boxStartY;
    clone.boxEndX = this.boxEndX;
    clone.boxEndY = this.boxEndY;
    clone.unitStartX = this.unitStartX;
    clone.unitStartY = this.unitStartY;
    clone.unitEndX = this.unitEndX;
    clone.unitEndY = this.unitEndY;
    clone.centerDist = this.centerDist;
    clone.freeSides = this.freeSides;
    return clone;
  }
}
