/**
 * @class StackHandler
 * @classdesc Class to handle the stack elements
 * @param {Object} stackData - Object containing the stack data
 */
export class StackHandler {
  constructor(stackData) {
    this.stackData = stackData;
    this.patterns = [];
  }

  /**
   * Add the pattern names to the stack
   * @alias init
   * @memberof StackHandler
   */
  init() {
    // Iterate through the patterns
    for (let i = 0; i < 3; i++) {
      // Add the pattern libraries and pattern name to the stackData
      if (this.patterns[i] !== undefined) {
        this.stackData.pNames[i] = this.stackData.libProp.getPatternLibName(
          this.patterns[i]
        );
      } else {
        this.stackData.pNames[i] = undefined;
      }
    }
  }

  /**
   * Count the boxes in the stack
   * @alias countBox
   * @memberof StackHandler
   * @returns {number} - Number of boxes in the stack
   */
  countBox() {
    let boxCnt = 0;

    this.stackData.stackProp.stackConfigData.forEach((layer) => {
      for (let i = 0; i < this.stackData.libProp.libPatternProp.length; i++) {
        if (layer === this.stackData.libProp.libPatternProp[i].name) {
          boxCnt += this.stackData.libProp.libPatternProp[i].count;
        }
      }
    });

    return boxCnt;
  }

  /**
   * Filling rate of the boxes in the stack/pattern
   * @alias fillingRate
   * @memberof StackHandler
   * @returns {number} - Filling rate of the boxes in the stack/pattern
   */
  fillingRate() {
    const palletSurface =
      this.stackData.palletProp.length * this.stackData.palletProp.width;
    const boxSurface =
      this.stackData.boxProp.length * this.stackData.boxProp.width;
    const fillingRate =
      (this.countBox() * boxSurface) /
      (palletSurface * this.stackData.stackProp.nrOfLayers);

    return fillingRate;
  }
}
