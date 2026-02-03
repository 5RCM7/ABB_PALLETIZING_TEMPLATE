import { patternItemProperties } from './DataType classes/PatternItemProperties.js';
import { patternSizeProperties } from './DataType classes/PatternSizeProperties.js';
import { findOuterBoxSides } from './SharedFunctions.js';

/**
 * @class PatternCreation
 * @classdesc This class is responsible for calculating the pattern properties
 * @param {Object} stackData - Object containing the stack data
 */
export class PatternCreation {
  constructor(stackData) {
    this.stackData = stackData;
  }

  /**
   * Add a pattern formula to the project
   * @alias setPatternFormula
   * @memberof PatternCreation
   * @param {number} pRef - Reference of the pattern [0:odd,1:even,2:top,3:temp]
   * @param {number} libraryIndex - Index of the pattern in the library
   */
  setPatternFormula(pRef, libraryIndex) {
    // Initialize the patternItems array with the formula's retrieved from the chosen library files
    const itemsArray = [];
    // Read the formulas from the chosen library
    let libPattern = this.stackData.libProp.getPatternLibFormulas(libraryIndex);

    for (let i = 0; i < libPattern.length; i++) {
      itemsArray.push(
        new patternItemProperties(
          i,
          libPattern[i],
          this.stackData.boxProp.pickLSL,
          this.stackData.boxProp.pickSSL
        )
      );
    }

    this.stackData.pItems[pRef] = itemsArray;
  }

  /**
   * Calculate/build the pattern
   * @alias calcPattern
   * @memberof PatternCreation
   * @param {number} pRef - Reference of the pattern [0:odd,1:even,2:top,3:temp]
   */
  calcPattern(pRef) {
    while (pRef >= this.stackData.pSizes.length)
      this.stackData.pSizes.push(new patternSizeProperties());
    // Reset the pattern size ranges
    this.stackData.pSizes[pRef].resetRanges();
    // For ease of use copy element
    let pItems = this.stackData.pItems[pRef];
    // Calculate pattern based on physical dimensions
    for (let i = 0; i < pItems.length; i++) {
      // Retrieve the boix orientation (H or V)
      let formula = pItems[i].formula.split(';');
      pItems[i].boxOrient = formula[0];
      // Set the coordinates of the box and unit origin based on the box formulas (lower left corner)
      let boxOrigin = this.calcBoxOrigin(
        pItems[i].formula,
        this.stackData.boxProp
      );
      pItems[i].boxStartX = boxOrigin.X;
      pItems[i].unitStartX = boxOrigin.X;
      pItems[i].boxStartY = boxOrigin.Y;
      pItems[i].unitStartY = boxOrigin.Y;

      switch (pItems[i].boxOrient) {
        case 'H':
          // Update the size of the entire pattern
          this.stackData.pSizes[pRef].setX(
            pItems[i].boxStartX,
            this.stackData.boxProp.length
          );
          this.stackData.pSizes[pRef].setY(
            pItems[i].boxStartY,
            this.stackData.boxProp.width
          );
          // Define the coordinates of the box and unit end corner (upper right corner)
          pItems[i].boxEndX =
            pItems[i].boxStartX + this.stackData.boxProp.length;
          pItems[i].unitEndX =
            pItems[i].boxStartX + this.stackData.boxProp.length;
          pItems[i].boxEndY =
            pItems[i].boxStartY + this.stackData.boxProp.width;
          pItems[i].unitEndY =
            pItems[i].boxStartY + this.stackData.boxProp.width;

          break;
        case 'V':
          // Update the size of the entire pattern
          this.stackData.pSizes[pRef].setX(
            pItems[i].boxStartX,
            this.stackData.boxProp.width
          );
          this.stackData.pSizes[pRef].setY(
            pItems[i].boxStartY,
            this.stackData.boxProp.length
          );
          // Define the coordinates of the box and unit end corner (upper right corner)
          pItems[i].boxEndX =
            pItems[i].boxStartX + this.stackData.boxProp.width;
          pItems[i].unitEndX =
            pItems[i].boxStartX + this.stackData.boxProp.width;
          pItems[i].boxEndY =
            pItems[i].boxStartY + this.stackData.boxProp.length;
          pItems[i].unitEndY =
            pItems[i].boxStartY + this.stackData.boxProp.length;

          break;
      }
    }
    // Calculate pattern based on drawing dimensions
    var clusters = [];
    // Update unit end position for the multi pick application.
    for (let i = 0; i < pItems.length; i++) {
      // Get the parent of the current box. -1 if the box is the parent
      parent = pItems[i].parent;
      if (parent > -1) {
        // Update the unit end coordinates of the actual box to the parent
        pItems[parent].unitEndX = Math.max(
          pItems[i].unitEndX,
          pItems[parent].unitEndX
        );
        pItems[parent].unitEndY = Math.max(
          pItems[i].unitEndY,
          pItems[parent].unitEndY
        );
      }

      // Create clusters. Boxes in a cluster have the same cluster reference
      let formula = pItems[i].formula.split(';');

      // Create a list with clusternumbers
      if (formula[3] != '') {
        let clusterData = {
          Ref: i,
          BoxOrient: pItems[i].boxOrient,
          XMin: pItems[i].boxStartX,
          YMin: pItems[i].boxStartY,
        };

        while (clusters.length <= parseInt(formula[3])) clusters.push([]);
        clusters[parseInt(formula[3])].push(clusterData);
      }
    }

    // Sort the clusters
    for (let i = 1; i < clusters.length; i++) {
      if (clusters[i].length > 2) {
        // Sort the cluster by X or Y coordinates. As clusters are either along the X axis or the Y axis of the pallet,
        // their resp. Y and  X coordinates will be the same. Due to this, sorting can be done in both directions as the
        // same X or Y coordinates do not change the sorting order.
        clusters[i].sort((s1, s2) => s1.XMin - s2.XMin);
        clusters[i].sort((s1, s2) => s1.YMin - s2.YMin);
      }
    }
  }

  /**
   * Calculate the box coordinates on the pallet from formulas
   * @alias calcFormulaCoordinates
   * @memberof PatternCreation
   * @param {number} stackIndex - The index of the stack [0:odd,1:even,2:top,3:temp]
   * @param {number} patternIndex - The index of the pattern
   */
  calcFormulaCoordinates(stackIndex, patternIndex) {
    this.setPatternFormula(stackIndex, patternIndex);
    this.calcPattern(stackIndex);
  }

  /**
   * Calculate the origon of the box (start corner)
   * @alias calcBoxOrigin
   * @memberof PatternCreation
   * @param {Object} formula - Formula of the box
   * @param {class} boxProp  - Box properties
   * @returns {object} - Origin of the box
   */
  calcBoxOrigin(formula, boxProp) {
    let boxOrigin = {
      X: 0,
      Y: 0,
    };
    // Split the formula into its components
    let formulas = formula.split(';');
    // Calculate the origin of the box based on the formula
    boxOrigin.X = this.formulaCalc(boxProp.length, boxProp.width, formulas[1]);
    boxOrigin.Y = this.formulaCalc(boxProp.length, boxProp.width, formulas[2]);

    return boxOrigin;
  }

  /**
   * Calculate the box coordinates depending on the formula
   * @alias formulaCalc
   * @memberof PatternCreation
   * @param {number} length - Length of the box
   * @param {number} width - Width of the box
   * @param {string} formula - Formula of the box
   * @returns {number} - Result of the formula
   */
  formulaCalc(length, width, formula) {
    const parameters = { l: length, w: width };
    // No formula is specified. Return 0
    if (formula === '') {
      return 0;
    }
    // Replace the variables in the formula with the actual values
    formula = formula
      .replace(/(\d+)\s*([lwLW])/g, '$1 * $2')
      .replace(/[LW]/g, (match) => {
        return match.toLowerCase();
      });
    // Create a function of the formula
    const evalFunction = new Function(
      ...Object.keys(parameters),
      `return ${formula};`
    );
    // Calculate the result of the formula
    const result = evalFunction(...Object.values(parameters));
    return result;
  }

  /**
   * Calculate the default label orientation for a pattern
   * @alias calcDefaultLabelOrient
   * @memberof PatternCreation
   * @param {number} pRef - Reference of the pattern [0:odd,1:even,2:top,3:temp]
   */
  calcDefaultLabelOrient(pRef) {
    if (this.stackData.boxProp.pickLSL > 0)
      this.calcDefaultLabelOrientLSL(pRef);
    if (this.stackData.boxProp.pickSSL > 0)
      this.calcDefaultLabelOrientSSL(pRef);
  }

  // Description for label orientation calculation (methodes CalcLabelOrientSSL and CalcLabelOrientLSL)
  //
  // Calculates the default label positions. Based on the location of the labels on the box, the box label orientation
  // is calculated. This routine places the labels in such way that they are a much a possible on the outside of the pallet.
  // Depending on 'H' or 'V' placement a rotation of 90° is required
  // If the placement of the box(es) matches with the pick position
  //
  // Label orientation (LabelOrient) is defined as following: (Example based)
  //
  // On the infeeder: this.LabelPos: True, False, False, True (Side 0 and 3 have a label)
  //
  //         Long side leading (LSL)              Short side leading (SSL)
  //        |-------------------------            |-------------------------------------
  //        |Side 2                               |
  //      S |------| S                            |    Side 2
  //      i |  --  | i       Feed dir           S |---------------| S       Feed dir
  //      d |    | | d       <-----             i |             | | i       <-----
  //  Y   e |    | | e                       Y  d |             | | d
  //  |     |      |                         |  e |  -----------| | e
  //  |   3 |------|-1----------------       |  3 |---------------|-1-------------------
  //  |      Side 0                          |         Side 0
  //  o -------- X                           o -------- X
  //
  // In the examples below the sides are counted from the wortkobject point of view for both feeder and pallet. Side 0 is
  // allways the side along the X axis of the workobject. The other sides are counted counter clockwise.
  //
  // Assume side 0 and 1 are on the outside of the pallet. Both labels match with the infeed. The LabelOrient will be 0
  // for short side lead infeed. For long side lead infeed this will be 3 (rotated 270°)
  //             Side 2
  //      S |---------------| S
  //      i |             | | i
  //   Y  d |             | | d
  //   |  e |  -----------| | e
  //   |  3 |**************** 1
  //   |         Side 0
  //   o -------- X
  //
  // Assume side 2 and 3 are on the outside of the pallet. Both labels match with the infeed however 180° rotated.
  // The LabelOrient will be 2 for  short side lead infeed. For long side lead infeed this will be 1 (rotated +90°)
  //             Side 2
  //      S ****************| S
  //      i | |-----------  | i
  //   Y  d | |             | d
  //   |  e | |             | e
  //   |  3 |---------------| 1
  //   |         Side 0
  //   o -------- X
  //
  // Assume side 0 and 3 are on the outside of the pallet. One label for the long and one label for the short side do
  // match but not both. The long side matching label (side 3) has preference. The LabelOrient will be 0 for short
  // side lead infeed. For long side lead infeed this will be 3 (rotated 270°)
  //             Side 2                                          Side 2
  //      S |---------------| S                           S |---------------| S
  //      i | |             | i                           i |             | | i
  //   Y  d | |             | d       Results in ------>  d |             | | i
  //   |  e | |-----------  | e                           e |  -----------| | e
  //   |  3 ****************| 1                           3 |---------------| 1
  //   |         Side 0                                          Side 0
  //   o -------- X
  //
  // Assume side 1 and 2 are on the outside of the pallet. Both labels match with the infeed. The LabelOrient will be
  // 1 (rotated +90°) for short side lead infeed. For long side lead infeed this will be 0 (no rotation)
  //         Side 2
  //        |*******
  //      S |  --  | S
  //      i |    | | i
  //   Y  d |    | | d
  //   |  e |      | e
  //   |  3 |------| 1
  //   |     Side 0
  //   o -------- X

  /**
   * Calculate the default label orientation for Long Side Lead boxes
   * @alias calcDefaultLabelOrientLSL
   * @memberof PatternCreation
   * @param {number} pRef - Reference of the pattern [0:odd,1:even,2:top,3:temp]
   */
  calcDefaultLabelOrientLSL(pRef) {
    // For ease of use copy element
    let pItems = this.stackData.pItems[pRef];

    pItems.forEach((pItem) => (pItem.labelOrient = -1));

    for (let i = 0; i < pItems.length; i++) {
      // Get the outer sides of the boxes on the pallet
      let outerBoxSides = findOuterBoxSides(i, pItems);

      // Find best match for the label position (long side match is preferred).
      let matchingSides1 = 0;
      let matchingSides2 = 0;
      let longSide1 = false;
      let longSide2 = false;

      switch (pItems[i].boxOrient) {
        case 'H':
          if (this.stackData.boxProp.labelPos[0] && outerBoxSides[1])
            matchingSides1++;
          if (this.stackData.boxProp.labelPos[1] && outerBoxSides[2]) {
            matchingSides1++;
            longSide1 = true;
          }
          if (this.stackData.boxProp.labelPos[2] && outerBoxSides[3])
            matchingSides1++;
          if (this.stackData.boxProp.labelPos[3] && outerBoxSides[0]) {
            matchingSides1++;
            longSide1 = true;
          }

          if (this.stackData.boxProp.labelPos[0] && outerBoxSides[3])
            matchingSides2++;
          if (this.stackData.boxProp.labelPos[1] && outerBoxSides[0]) {
            matchingSides2++;
            longSide2 = true;
          }
          if (this.stackData.boxProp.labelPos[2] && outerBoxSides[1])
            matchingSides2++;
          if (this.stackData.boxProp.labelPos[3] && outerBoxSides[2]) {
            matchingSides2++;
            longSide2 = true;
          }

          pItems[i].labelOrient = 3;

          if (
            matchingSides1 > matchingSides2 ||
            (matchingSides1 === matchingSides2 && (longSide1 || !longSide2))
          )
            pItems[i].labelOrient = 1;

          break;
        case 'V':
          if (this.stackData.boxProp.labelPos[0] && outerBoxSides[0])
            matchingSides1++;
          if (this.stackData.boxProp.labelPos[1] && outerBoxSides[1]) {
            matchingSides1++;
            longSide1 = true;
          }
          if (this.stackData.boxProp.labelPos[2] && outerBoxSides[2])
            matchingSides1++;
          if (this.stackData.boxProp.labelPos[3] && outerBoxSides[3]) {
            matchingSides1++;
            longSide1 = true;
          }

          if (this.stackData.boxProp.labelPos[0] && outerBoxSides[2])
            matchingSides2++;
          if (this.stackData.boxProp.labelPos[1] && outerBoxSides[3]) {
            matchingSides2++;
            longSide2 = true;
          }
          if (this.stackData.boxProp.labelPos[2] && outerBoxSides[0])
            matchingSides2++;
          if (this.stackData.boxProp.labelPos[3] && outerBoxSides[1]) {
            matchingSides2++;
            longSide2 = true;
          }

          pItems[i].labelOrient = 2;

          if (
            matchingSides1 > matchingSides2 ||
            (matchingSides1 === matchingSides2 && (longSide1 || !longSide2))
          )
            pItems[i].labelOrient = 0;

          break;
      }
    }
  }

  /**
   * Calculate the default label orientation for Short Side Lead boxes
   * @alias calcDefaultLabelOrientSSL
   * @memberof PatternCreation
   * @param {number} pRef - Reference of the pattern [0:odd,1:even,2:top,3:temp]
   */
  calcDefaultLabelOrientSSL(pRef) {
    // For ease of use copy element
    let pItems = this.stackData.pItems[pRef];

    pItems.forEach((pItem) => (pItem.labelOrient = -1));

    for (let i = 0; i < pItems.length; i++) {
      // Get the outer sides of the boxes on the pallet
      let outerBoxSides = findOuterBoxSides(i, pItems);

      // Find best match for the label position (long side match is preferred).
      let matchingSides1 = 0;
      let matchingSides2 = 0;
      let longSide1 = false;
      let longSide2 = false;

      switch (pItems[i].boxOrient) {
        case 'H':
          if (this.stackData.boxProp.labelPos[0] && outerBoxSides[0]) {
            matchingSides1++;
            longSide1 = true;
          }
          if (this.stackData.boxProp.labelPos[1] && outerBoxSides[1])
            matchingSides1++;
          if (this.stackData.boxProp.labelPos[2] && outerBoxSides[2]) {
            matchingSides1++;
            longSide1 = true;
          }
          if (this.stackData.boxProp.labelPos[3] && outerBoxSides[3])
            matchingSides1++;

          if (this.stackData.boxProp.labelPos[0] && outerBoxSides[2]) {
            matchingSides2++;
            longSide2 = true;
          }
          if (this.stackData.boxProp.labelPos[1] && outerBoxSides[3])
            matchingSides2++;
          if (this.stackData.boxProp.labelPos[2] && outerBoxSides[0]) {
            matchingSides2++;
            longSide2 = true;
          }
          if (this.stackData.boxProp.labelPos[3] && outerBoxSides[1])
            matchingSides2++;

          pItems[i].labelOrient = 0;

          if (
            matchingSides1 < matchingSides2 ||
            (matchingSides1 === matchingSides2 && !longSide1 && longSide2)
          )
            pItems[i].labelOrient = 2;

          break;
        case 'V':
          if (this.stackData.boxProp.labelPos[0] && outerBoxSides[1]) {
            matchingSides1++;
            longSide1 = true;
          }
          if (this.stackData.boxProp.labelPos[1] && outerBoxSides[2])
            matchingSides1++;
          if (this.stackData.boxProp.labelPos[2] && outerBoxSides[3]) {
            matchingSides1++;
            longSide1 = true;
          }
          if (this.stackData.boxProp.labelPos[3] && outerBoxSides[0])
            matchingSides1++;

          if (this.stackData.boxProp.labelPos[0] && outerBoxSides[3]) {
            matchingSides2++;
            longSide2 = true;
          }
          if (this.stackData.boxProp.labelPos[1] && outerBoxSides[0])
            matchingSides2++;
          if (this.stackData.boxProp.labelPos[2] && outerBoxSides[1]) {
            matchingSides2++;
            longSide2 = true;
          }
          if (this.stackData.boxProp.labelPos[3] && outerBoxSides[2])
            matchingSides2++;

          pItems[i].labelOrient = 1;

          if (
            matchingSides1 < matchingSides2 ||
            (matchingSides1 === matchingSides2 && !longSide1 && longSide2)
          )
            pItems[i].labelOrient = 3;

          break;
      }
    }
  }

  /**
   * Copy label orientation from one pattern to another if they are the same
   * @alias copyLabelOrient
   * @memberof PatternCreation
   */
  copyLabelOrient() {
    for (let j = 0; j < 3; j++) {
      for (let k = j + 1; k < 3; k++) {
        if (
          this.stackData.stack.patterns &&
          this.stackData.stack.patterns[j] !== undefined &&
          this.stackData.stack.patterns[j] ===
            (this.stackData.stack.patterns && this.stackData.stack.patterns[k])
        ) {
          this.assignPItemLabels(k, j);
        }
      }
    }
  }

  /**
   * Assign the pattern items from one pattern to another
   * @alias assignPItemLabels
   * @memberof PatternCreation
   * @param {number} source - Source pattern
   * @param {number} target - Target pattern
   */
  assignPItemLabels(source, target) {
    for (let i = 0; i < this.stackData.pItems[source].length; i++) {
      this.stackData.pItems[target][i].labelOrient =
        this.stackData.pItems[source][i].labelOrient;
    }
  }
}
