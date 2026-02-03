/** Find the sides of the box that are exposed at the outside of the pattern.
 * @param {number} itemRef - Reference to the item (box) in the pattern
 * @param {Array} pItems - Array containing the properties of the items (boxes) in the pattern
 */
export function findOuterBoxSides(itemRef, pItems) {
  let outerBoxSides = [true, true, true, true];

  // Remove sides that are not free (so not on the outside of the pattern)
  for (let j = 0; j < pItems.length; j++) {
    if (
      pItems[j].boxEndX > pItems[itemRef].boxStartX &&
      pItems[j].boxStartX < pItems[itemRef].boxEndX
    ) {
      if (pItems[j].boxStartY >= pItems[itemRef].boxEndY)
        outerBoxSides[2] = false;
      if (pItems[j].boxEndY <= pItems[itemRef].boxStartY)
        outerBoxSides[0] = false;
    }

    if (
      pItems[j].boxEndY > pItems[itemRef].boxStartY &&
      pItems[j].boxStartY < pItems[itemRef].boxEndY
    ) {
      if (pItems[j].boxStartX >= pItems[itemRef].boxEndX)
        outerBoxSides[1] = false;
      if (pItems[j].boxEndX <= pItems[itemRef].boxStartX)
        outerBoxSides[3] = false;
    }
  }
  return outerBoxSides;
}

/**
 * Parse the formula for the box
 * @param {string} formula - Formula for the box
 * @returns {Object} - Object containing the parsed formula
 */
export function parseFormula(formula) {
  let boxFormula = {
    index: null,
    boxOrient: null,
    lCntX: null,
    lCntY: null,
    wCntX: null,
    wCntY: null,
  };

  let formulas = formula.toUpperCase().split(';');

  boxFormula.boxOrient = formulas[0].charAt(0);

  for (let i = 1; i <= 2; i++) {
    let fParts = formulas[i].split(/[-+]/);

    if (fParts.length > 1)
      fParts[1] = formulas[i].charAt(formulas[i].search(/[-+]/)) + fParts[1];

    let result1 = parseSubFormula(fParts[0]);
    let result2 = parseSubFormula(fParts[1]);

    switch (i) {
      case 1:
        boxFormula.lCntX = result1.lCnt + result2.lCnt;
        boxFormula.wCntX = result1.wCnt + result2.wCnt;
        break;
      case 2:
        boxFormula.lCntY = result1.lCnt + result2.lCnt;
        boxFormula.wCntY = result1.wCnt + result2.wCnt;
        break;
    }
  }

  return boxFormula;
}

/**
 * Parse the subformula for the box
 * @param {string} formula - formula for the box
 * @returns {Object} - Object containing the parsed subformula
 */
function parseSubFormula(formula) {

  if (!formula) return { lCnt: 0, wCnt: 0 };

  switch (formula) {
    case 'L':
    case '+L':
      return { lCnt: 1, wCnt: 0 };
    case 'W':
    case '+W':
      return { lCnt: 0, wCnt: 1 };
    case '-L':
      return { lCnt: -1, wCnt: 0 };
    case '-W':
      return { lCnt: 0, wCnt: -1 };
  }

  let value = parseFloat(formula.substring(0, formula.length - 1));

  switch (formula.charAt(formula.length - 1)) {
    case 'L':
      return { lCnt: value, wCnt: 0 };
    case 'W':
      return { lCnt: 0, wCnt: value };
  }

}
