import Pallet from '../configuration/canvasPallet.js';
import Box from '../configuration/canvasBox.js';

/**
 * Draw a pallet with boxes on the canvas
 * @param {HTMLElement} canvasParent - the parent element of the canvas
 * @param {number} stackIndex - the index of the stack
 * @param {number} palletLength - the length of the pallet
 * @param {number} palletWidth - the width of the pallet
 * @param {Array} boxStatuses - the status of each box
 * @param {boolean} drawIndex - whether to draw the index of the boxes
 * @param {Array} boxParents - the parent of each box
 * @return {Pallet} - the pallet object
 */
export function drawPalletWithBoxes(
  canvasParent,
  stackIndex,
  stackData,
  palletLength = stackData.palletProp.length,
  palletWidth = stackData.palletProp.width,
  boxStatuses,
  drawIndex = false,
  boxParents = null
) {
  const { boxProp } = stackData;

  const patternSize = stackData.pSizes[stackIndex];
  const pattern = getPatternWithBoxes(
    stackData.pItems[stackIndex],
    boxProp.labelPos
  );

  canvasParent.innerHTML = '';
  const pallet = new Pallet(
    'pallet-elem',
    canvasParent,
    stackData,
    palletLength,
    palletWidth,
    pattern,
    patternSize
  );
  pallet.draw();
  pallet.drawBoxes(true, boxStatuses, drawIndex, boxParents);

  return pallet;
}

/**
 * get the pattern with boxes
 * @param {number} stackIndex - the index of the stack
 * @param {Array} labelpos - the position of the labels
 * @return {Object} - the pattern
 */
export function getPatternWithBoxes(
  boxesArray,
  labelpos = [false, false, false, false]
) {
  const pattern = boxesArray.map(
    (box) =>
      new Box(
        box.boxStartX,
        box.boxStartY,
        box.boxEndX,
        box.boxEndY,
        box.labelOrient,
        labelpos
      )
  );

  return pattern;
}
