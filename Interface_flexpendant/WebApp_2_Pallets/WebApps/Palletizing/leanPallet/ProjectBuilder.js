import { layerTypes, gripperTypes } from '../constants/common.js';
import { findOuterBoxSides, parseFormula } from './SharedFunctions.js';
import fs, { FILES_DIRECTORY_RECIPES } from '../services/fileManager.js';
import { fetchData } from '../services/dataManager.js';

/**
 * @class ProjectBuilder
 * @classdesc This class is responsible for building the project file
 * @param {Object} stackData - Object containing the stack data
 */
export class ProjectBuilder {
  constructor(stackData) {
    this.stackData = stackData;
    this.lslCandidates = [];
    this.sslCandidates = [];
    this.output;
  }

  /**
   * Save the tuning file
   * @alias saveTuneData
   * @memberof ProjectBuilder
   * @param {Array} dataToSave - the data that needs to be saved into the tune file
   */
  async saveTuneData(dataToSave) {
    const content = [
      '# Palletizing template tune data file',
      '# Version 2.00.009',
      '',
      '# File creation date: ' + new Date().toISOString(),
      '',
      '# Pick offsets',
      `PickOffs:1 X:${dataToSave[0]}`,
      `PickOffs:1 Y:${dataToSave[1]}`,
      `PickOffs:1 Z:${dataToSave[2]}`,
      '',
      '# Box dimension offsets',
      `BoxOffs:1 Length:${dataToSave[3]}`,
      `BoxOffs:1 Width:${dataToSave[4]}`,
      `BoxOffs:1 Height:${dataToSave[5]}`,
      '',
      '# Speed data',
      `Speed:1 PickSpeed:${dataToSave[6]}`,
      `Speed:1 PalletSpeed:${dataToSave[7]}`,
      `Speed:1 PlaceSpeed:${dataToSave[8]}`,
      `Speed:1 ReturnSpeed:${dataToSave[9]}`,
      '',
      '# Acceleration',
      `Acceleration:1 Acc:${dataToSave[10]}`,
      '',
      '# Timing data',
      `Timing:1 PickTime:${dataToSave[11]}`,
      `Timing:1 PlaceTime:${dataToSave[12]}`,
      '',
      '# End of file',
    ].join('\n');

    const { value: name } = await fetchData('AppData', 'RecipeName');
    fs.createNewFile(FILES_DIRECTORY_RECIPES, name + '.lptune', content, true);
  }

  /**
   * Save the project file
   * @alias saveProject
   * @memberof ProjectBuilder
   * @param {string} name - Name of the project
   */
  async saveProject(name) {
    // Build the project content to be saved in the project file
    let content = this.buildProject();

    await fs.createNewFile(
      FILES_DIRECTORY_RECIPES,
      name + '.lpproj',
      content,
      true
    );
  }

  /**
   * Build the project file from calculated data
   * @alias buildProject
   * @memberof ProjectBuilder
   * @returns {string} - Project file content
   */
  buildProject() {
    // Create the file header
    this.createProject(this.stackData);

    for (let pRef = 0; pRef < 3; pRef++) {
      if (this.stackData.pNames[pRef] !== undefined)
        for (let startCorner = 1; startCorner <= 4; startCorner++) {
          // Calculate the patterns for each selected pattern, for each of the 4 start corners
          this.generateLayerConfig(pRef, startCorner);

          // Create the pattern configuration
          this.writeLayerConfig(pRef, startCorner);
        }
    }

    // Create the footer
    this.closeProject();

    return this.output;
  }

  /**
   * Create the project file line by line saving into class property output
   * @alias createProject
   * @memberof ProjectBuilder
   */
  createProject() {
    this.output = '';

    this.output += '# LeanPalletize project data file';
    this.output += '\n# Version 1.200';
    this.output += '\n';
    this.output += '\n# File creation date: ' + new Date().toISOString();

    this.output += '\n\n# Project data';
    this.output += '\nGripType:' + this.stackData.projectProp.gripperType;
    this.output += '\nGripWidth:' + this.stackData.projectProp.gripperWidth;
    this.stackData.projectProp.availablePickPos.forEach((propIndex, index) => {
      this.output += '\nAvailPickPos:' + index + ' Value:' + propIndex;
    });

    this.output += '\n\n# Box dimensions';
    this.output += '\nBoxDim:1 Length:' + this.stackData.boxProp.length;
    this.output += '\nBoxDim:1 Width:' + this.stackData.boxProp.width;
    this.output += '\nBoxDim:1 Height:' + this.stackData.boxProp.height;
    this.output += '\nBoxDim:1 Weight:' + this.stackData.boxProp.weight;
    this.output += '\nBoxDim:1 LongSideLead:' + this.stackData.boxProp.pickLSL;
    this.output += '\nBoxDim:1 ShortSideLead:' + this.stackData.boxProp.pickSSL;

    this.output += '\n\n# Pallet dimensions';
    this.output += '\nPalletDim:1 Length:' + this.stackData.palletProp.length;
    this.output += '\nPalletDim:1 Width:' + this.stackData.palletProp.width;
    this.output += '\nPalletDim:1 Height:' + this.stackData.palletProp.height;

    this.output += '\n\n# Label positions';
    this.stackData.boxProp.labelPos.forEach((labelPos, index) => {
      this.output += '\nLabelPos:' + index + ' Present:' + labelPos;
    });

    this.output += '\n\n# Stack data';
    this.output += '\nNumberOfLayers:' + this.stackData.stackProp.nrOfLayers;
    this.output += '\nMaxStackHeight:' + this.stackData.palletProp.fullHeight;

    this.output += '\n\n# Stack configuration';
    let patterns = this.stackData.stackProp.getAll(layerTypes.pattern);
    patterns.forEach((layerIndex, index) => {
      this.output += '\nLayerCfg:' + index + ' Name:' + layerIndex;
    });

    const slipSheets = this.stackData.stackProp.getAll(layerTypes.slipSheet);
    if (slipSheets.length > 0) {
      this.output += '\n\n# Slipsheet data';
      this.output +=
        '\nSlipSheetDim:1 Length:' + this.stackData.slipSheetProp.length;
      this.output +=
        '\nSlipSheetDim:1 Width:' + this.stackData.slipSheetProp.width;
      this.output +=
        '\nSlipSheetDim:1 Thickness:' + this.stackData.slipSheetProp.thickness;
      this.output +=
        '\nSlipSheetDim:1 StackHeight:' +
        this.stackData.slipSheetProp.stackHeight;

      slipSheets.forEach((layerIndex, index) => {
        this.output += '\nSlipSheet:' + index + ' Layer:' + layerIndex;
      });
    }
  }

  /**
   * Create the layer cfg line by line saving into class property output
   * @alias writeLayerConfig
   * @memberof ProjectBuilder
   * @param {number} patternRef - Reference of the pattern [0:odd,1:even,2:top,3:temp]
   * @param {number} startCorner - Start corner of the pallet
   */
  writeLayerConfig(patternRef, startCorner) {
    if (startCorner === 1) {
      this.output += '\n\n# Configuration for layer ' + patternRef;
      this.output +=
        '\nPRef:' +
        patternRef +
        ' Name:' +
        this.stackData.pNames[patternRef].replace(/\.[^/.]+$/, '') +
        '\n';
    } else {
      this.output += '\n';
    }

    for (let pid of this.stackData.pItems[patternRef]) {
      this.output += '\nPRef:' + patternRef;
      this.output += ' Cor:' + startCorner;
      this.output += ' F:' + pid.formula;
      this.output += ' PiO:' + (pid.pickGripperOrient + 1);
      this.output += ' PlO:' + (pid.placeGripperOrient + 1);
      this.output += ' LblO:' + pid.labelOrient;
      this.output += ' Appr:' + pid.approachDir;
      this.output += ' ID:' + pid.ID;
      this.output += ' Par:' + pid.parent;
      this.output += ' LT:' + pid.linkType;
    }
  }

  /**
   * Close the project file with ending string
   * @alias closeProject
   * @memberof ProjectBuilder
   */
  closeProject() {
    this.output += '\n';
    this.output += '\n# End of LeanPalletize project file';
  }

  /**
   * Generate the config for the layer
   * @alias generateLayerConfig
   * @memberof ProjectBuilder
   * @param {number} pRef - Reference of the pattern [0:odd,1:even,2:top,3:temp]
   * @param {number} startCorner - Start corner of the pallet
   * @returns
   */
  generateLayerConfig(pRef, startCorner) {
    if (
      this.stackData.boxProp.pickLSL <= 0 &&
      this.stackData.boxProp.pickSSL <= 0
    )
      return;

    // Find the linked boxes for multi box handling
    // Long side linked
    if (this.stackData.boxProp.pickLSL > 1) {
      this.findLSLLinkedCandidates(pRef);
      this.splitLSLRows(startCorner);
      this.updateLSLPatternItems(pRef);
    }
    // Short side linked
    if (this.stackData.boxProp.pickSSL > 1) {
      this.findSSLLinkedCandidates(pRef);
      this.splitSSLRows(startCorner);
      this.updateSSLPatternItems(pRef);
    }
    // Calculate the optimum stacking order
    this.calcItemOrder(pRef, startCorner);
    // Define the gripper orientation for the pick and place position
    switch (this.stackData.projectProp.gripperType) {
      case gripperTypes.grpVacuumCenter:
      case gripperTypes.grpVacuumCorner:
        // Long side linked
        if (this.stackData.boxProp.pickLSL > 0) {
          this.calcVacGripperOrientLSL(pRef);
        }
        // Short side linked
        if (this.stackData.boxProp.pickSSL > 0) {
          this.calcVacGripperOrientSSL(pRef);
        }
        break;
      case gripperTypes.grpMechTCPSideCenterBottom:
      case gripperTypes.grpMechTCPSideCornerBottom:
      case gripperTypes.grpMechOppSideCenterBottom:
      case gripperTypes.grpMechOppSideCornerBottom:
      case gripperTypes.grpMechTCPSideCenterTop:
      case gripperTypes.grpMechTCPSideCornerTop:
      case gripperTypes.grpMechOppSideCenterTop:
      case gripperTypes.grpMechOppSideCornerTop:
      case gripperTypes.grpMechCenterTop:
        // Long side linked
        if (this.stackData.boxProp.pickLSL > 0) {
          this.calcMechGripperOrientLSL(pRef, startCorner);
        }
        // Short side linked
        if (this.stackData.boxProp.pickSSL > 0) {
          this.calcMechGripperOrientSSL(pRef, startCorner);
        }
        break;
    }
    // Calculate the approach for placing boxes on the pallet
    this.calcApproachAngle(pRef, startCorner);
  }

  /**
   * Find the linked boxes for multibox handling, long side linked
   * @alias findLSLLinkedCandidates
   * @memberof ProjectBuilder
   * @param {number} pRef - Reference of the pattern [0:odd,1:even,2:top,3:temp]
   */
  findLSLLinkedCandidates(pRef) {
    this.lslCandidates = [];
    // For ease of use copy elements
    let pItems = this.stackData.pItems[pRef];

    for (let i = 0; i < pItems.length; i++) {
      // Initialise multibox linked related parameters
      pItems[i].lastLink = -1;
      pItems[i].parent = -1;
      pItems[i].used = true;

      // Break the formula in it's base components i.e. nr of length's and width's in both X and Y direction
      let candidate = parseFormula(pItems[i].formula);
      candidate.index = i;
      // Long side linked
      let lslcAdded = false;

      for (let i = 0; i < this.lslCandidates.length; i++) {
        switch (candidate.boxOrient) {
          case 'H':
            // H placed boxes form a long side linked row if only the width in Y direction is different from other boxes.
            // The width factor for multibox candidates must have a width interval between them of a multiple of 1
            if (
              this.lslCandidates[i][0].boxOrient === 'H' &&
              this.lslCandidates[i][0].lCntX === candidate.lCntX &&
              this.lslCandidates[i][0].wCntX === candidate.wCntX &&
              this.lslCandidates[i][0].lCntY === candidate.lCntY &&
              this.lslCandidates[i][0].wCntY - candidate.wCntY ===
                Math.round(this.lslCandidates[i][0].wCntY - candidate.wCntY)
            ) {
              this.lslCandidates[i].push(candidate);
              this.lslCandidates[i].sort((s1, s2) => s1.wCntY - s2.wCntY);
              lslcAdded = true;
            }
            break;
          case 'V':
            // V placed boxes form a long side linked row if only the width in X direction is different from other boxes.
            // The width factor for multibox candidates must have a width interval between them of a multiple of 1
            if (
              this.lslCandidates[i][0].boxOrient === 'V' &&
              this.lslCandidates[i][0].lCntX === candidate.lCntX &&
              this.lslCandidates[i][0].lCntY === candidate.lCntY &&
              this.lslCandidates[i][0].wCntY === candidate.wCntY &&
              this.lslCandidates[i][0].wCntX - candidate.wCntX ===
                Math.round(this.lslCandidates[i][0].wCntX - candidate.wCntX)
            ) {
              this.lslCandidates[i].push(candidate);
              this.lslCandidates[i].sort((s1, s2) => s1.wCntX - s2.wCntX);
              lslcAdded = true;
            }
            break;
        }
      }
      // If the box is not part of an existing row, a new row is created
      if (!lslcAdded) this.lslCandidates.push([candidate]);
    }
  }

  /**
   * Split the rows according to the amount of boxes to be handled at the same time.
   * @alias splitLSLRows
   * @memberof ProjectBuilder
   * @param {number} startCorner - Start corner of the pallet, long side linked
   */
  splitLSLRows(startCorner) {
    // Look for gaps in the rows and split the row at the gap. A gap means that one or more entire boxes between two boxes are missing
    let pickLSL = this.stackData.boxProp.pickLSL;
    // Long side linked
    for (let i = 0; i < this.lslCandidates.length; i++) {
      switch (this.lslCandidates[i][0].boxOrient) {
        case 'H':
          for (let j = 1; j < this.lslCandidates[i].length; j++) {
            if (
              this.lslCandidates[i][j].wCntY -
                this.lslCandidates[i][j - 1].wCntY !==
              1
            ) {
              this.lslCandidates.push(this.lslCandidates[i].slice(j));
              this.lslCandidates[i] = this.lslCandidates[i].slice(0, j);
            }
          }
          break;
        case 'V':
          for (let j = 1; j < this.lslCandidates[i].length; j++) {
            if (
              this.lslCandidates[i][j].wCntX -
                this.lslCandidates[i][j - 1].wCntX !==
              1
            ) {
              this.lslCandidates.push(this.lslCandidates[i].slice(j));
              this.lslCandidates[i] = this.lslCandidates[i].slice(0, j);
            }
          }
          break;
      }
    }
    // Split the rows according to the amount of boxes to be handled at the same time. Splitting the rows is started from the last item of
    // the row, so that the row is always ended with a maximum load in the gripper. This avoids the gripper from sticking out of the pallet if a
    // partially placed gripper load is placed last in the row
    let posDir = false;

    for (let i = 0; i < this.lslCandidates.length; i++) {
      switch (this.lslCandidates[i][0].boxOrient) {
        case 'H':
          posDir = startCorner === 3 || startCorner === 4;
          break;
        case 'V':
          posDir = startCorner === 2 || startCorner === 3;
          break;
      }

      if (posDir) {
        while (this.lslCandidates[i].length > pickLSL) {
          this.lslCandidates.push(this.lslCandidates[i].slice(0, pickLSL));
          this.lslCandidates[i] = this.lslCandidates[i].slice(pickLSL);
        }
      } else {
        while (this.lslCandidates[i].length > pickLSL) {
          this.lslCandidates.push(
            this.lslCandidates[i].slice(this.lslCandidates[i].length - pickLSL)
          );
          this.lslCandidates[i] = this.lslCandidates[i].slice(
            0,
            this.lslCandidates[i].length - pickLSL
          );
        }
      }
    }
  }

  /**
   * Update the patternItems, for long side linked boxes
   * @alias updateLSLPatternItems
   * @memberof ProjectBuilder
   * @param {number} pRef - Reference of the pattern [0:odd,1:even,2:top,3:temp]
   */
  updateLSLPatternItems(pRef) {
    // Update the patternItems. Set parent and lastlink. Last link is the item furthest away from the parent (physically)
    // The parent points to the first box of the row of boxes.

    // For ease of use copy elements
    let pItems = this.stackData.pItems[pRef];
    // Long side linked
    for (let i = 0; i < this.lslCandidates.length; i++)
      if (this.lslCandidates[i].length > 1) {
        let parent = this.lslCandidates[i][0].index;
        let lastUnit =
          this.lslCandidates[i][this.lslCandidates[i].length - 1].index;

        // Update the ID of the parent to the last unit of the row
        pItems[parent].lastLink = pItems[lastUnit].ID;

        // Update unit end coordinates
        pItems[parent].unitEndX = pItems[lastUnit].unitEndX;
        pItems[parent].unitEndY = pItems[lastUnit].unitEndY;

        for (let j = this.lslCandidates[i].length - 1; j > 0; j--) {
          pItems[this.lslCandidates[i][j].index].parent =
            pItems[this.lslCandidates[i][j - 1].index].ID;
          pItems[this.lslCandidates[i][j].index].used = false;
        }
      }
  }

  /**
   * Find the linked boxes for multibox handling, short side linked
   * @alias findSSLLinkedCandidates
   * @memberof ProjectBuilder
   * @param {number} pRef - Reference of the pattern [0:odd,1:even,2:top,3:temp]
   */
  findSSLLinkedCandidates(pRef) {
    this.sslCandidates = [];
    // For ease of use copy elements
    let pItems = this.stackData.pItems[pRef];

    for (let i = 0; i < pItems.length; i++) {
      // Initialise multibox linked related parameters
      pItems[i].lastLink = -1;
      pItems[i].parent = -1;
      pItems[i].used = true;

      // Break the formula in it's base components i.e. nr of length's and width's in both X and Y direction
      let candidate = parseFormula(pItems[i].formula);
      candidate.index = i;
      // Short side linked
      let sslcAdded = false;

      for (let i = 0; i < this.sslCandidates.length; i++) {
        switch (candidate.boxOrient) {
          case 'H':
            // H placed boxes form a short side linked row if only the length in X direction is different from other boxes.
            // The length factor for multibox candidates must have a length interval between them of a multiple of 1
            if (
              this.sslCandidates[i][0].boxOrient === 'H' &&
              this.sslCandidates[i][0].wCntX === candidate.wCntX &&
              this.sslCandidates[i][0].lCntY === candidate.lCntY &&
              this.sslCandidates[i][0].wCntY === candidate.wCntY &&
              this.sslCandidates[i][0].lCntX - candidate.lCntX ===
                Math.round(this.sslCandidates[i][0].lCntX - candidate.lCntX)
            ) {
              this.sslCandidates[i].push(candidate);
              this.sslCandidates[i].sort((s1, s2) => s1.lCntX - s2.lCntX);
              sslcAdded = true;
            }
            break;
          case 'V':
            // V placed boxes form a short side linked row if only the length in Y direction is different from other boxes.
            // The value group must also be identical i.e. 1, 2, 3 etc. is a value group. 1.1, 2.1, 3.1 etc. is a different value group
            if (
              this.sslCandidates[i][0].boxOrient === 'V' &&
              this.sslCandidates[i][0].lCntX === candidate.lCntX &&
              this.sslCandidates[i][0].wCntX === candidate.wCntX &&
              this.sslCandidates[i][0].wCntY === candidate.wCntY &&
              this.sslCandidates[i][0].lCntY - candidate.lCntY ===
                Math.round(this.sslCandidates[i][0].lCntY - candidate.lCntY)
            ) {
              this.sslCandidates[i].push(candidate);
              this.sslCandidates[i].sort((s1, s2) => s1.lCntY - s2.lCntY);
              sslcAdded = true;
            }
            break;
        }
      }
      // If the box is not part of an existing row, a new row is created
      if (!sslcAdded) this.sslCandidates.push([candidate]);
    }
  }

  /**
   * Split the rows according to the amount of boxes to be handled at the same time, short side linked
   * @alias splitSSLRows
   * @memberof ProjectBuilder
   * @param {number} startCorner - Start corner of the pallet
   */
  splitSSLRows(startCorner) {
    // Look for gaps in the rows and split the row at the gap. A gap means that one or more entire boxes between two boxes are missing
    let pickSSL = this.stackData.boxProp.pickSSL;
    // Short side linked
    for (let i = 0; i < this.sslCandidates.length; i++) {
      switch (this.sslCandidates[i][0].boxOrient) {
        case 'H':
          for (let j = 1; j < this.sslCandidates[i].length; j++) {
            if (
              this.sslCandidates[i][j].lCntX -
                this.sslCandidates[i][j - 1].lCntX !==
              1
            ) {
              this.sslCandidates.push(this.sslCandidates[i].slice(j));
              this.sslCandidates[i] = this.sslCandidates[i].slice(0, j);
            }
          }
          break;
        case 'V':
          for (let j = 1; j < this.sslCandidates[i].length; j++) {
            if (
              this.sslCandidates[i][j].lCntY -
                this.sslCandidates[i][j - 1].lCntY !==
              1
            ) {
              this.sslCandidates.push(this.sslCandidates[i].slice(j));
              this.sslCandidates[i] = this.sslCandidates[i].slice(0, j);
            }
          }
          break;
      }
    }
    // Split the rows according to the amount of boxes to be handled at the same time. Splitting the rows is started from the last item of
    // the row, so that the row is always ended with a maximum load in the gripper. This avoids the gripper from sticking out of the pallet if a
    // partially placed gripper load is placed last in the row
    let posDir = false;

    for (let i = 0; i < this.sslCandidates.length; i++) {
      switch (this.sslCandidates[i][0].boxOrient) {
        case 'H':
          posDir = startCorner === 1 || startCorner === 4;
          break;
        case 'V':
          posDir = startCorner === 3 || startCorner === 4;
          break;
      }

      if (posDir) {
        while (this.sslCandidates[i].length > pickSSL) {
          this.sslCandidates.push(this.sslCandidates[i].slice(0, pickSSL));
          this.sslCandidates[i] = this.sslCandidates[i].slice(pickSSL);
        }
      } else {
        while (this.sslCandidates[i].length > pickSSL) {
          this.sslCandidates.push(
            this.sslCandidates[i].slice(this.sslCandidates[i].length - pickSSL)
          );
          this.sslCandidates[i] = this.sslCandidates[i].slice(
            0,
            this.sslCandidates[i].length - pickSSL
          );
        }
      }
    }
  }

  /**
   * Update the patternItems, for short side linked boxes
   * @alias updateSSLPatternItems
   * @memberof ProjectBuilder
   * @param {number} pRef - Reference of the pattern [0:odd,1:even,2:top,3:temp]
   */
  updateSSLPatternItems(pRef) {
    // Update the patternItems. Set parent and lastlink. Last link is the item furthest away from the parent (physically)
    // The parent points to the first box of the row of boxes.

    // For ease of use
    let pItems = this.stackData.pItems[pRef];
    // Short side linked
    for (let i = 0; i < this.sslCandidates.length; i++)
      if (this.sslCandidates[i].length > 1) {
        let parent = this.sslCandidates[i][0].index;
        let lastUnit =
          this.sslCandidates[i][this.sslCandidates[i].length - 1].index;

        // Update the ID of the parent to the last unit of the row
        pItems[parent].lastLink = pItems[lastUnit].ID;

        // Update unit end coordinates
        pItems[parent].unitEndX = pItems[lastUnit].unitEndX;
        pItems[parent].unitEndY = pItems[lastUnit].unitEndY;

        for (let j = this.sslCandidates[i].length - 1; j > 0; j--) {
          pItems[this.sslCandidates[i][j].index].parent =
            pItems[this.sslCandidates[i][j - 1].index].ID;
          pItems[this.sslCandidates[i][j].index].used = false;
        }
      }
  }

  /** Calculate the optimum stacking order based on individual boxes
   * @alias calcItemOrder
   * @memberof ProjectBuilder
   * @param {number} pRef - Reference of the pattern [0:odd,1:even,2:top,3:temp]
   * @param {number} startCorner - Start corner of the pallet
   */
  calcItemOrder(pRef, startCorner) {
    let startCornerSizeX = 0;
    let startCornerSizeY = 0;

    // Set/Change the start corner for the pattern
    switch (startCorner) {
      case 1:
        break;
      case 2:
        startCornerSizeX = this.stackData.pSizes[pRef].patternSizeX;
        break;
      case 3:
        startCornerSizeX = this.stackData.pSizes[pRef].patternSizeX;
        startCornerSizeY = this.stackData.pSizes[pRef].patternSizeY;
        break;
      case 4:
        startCornerSizeY = this.stackData.pSizes[pRef].patternSizeY;
        break;
    }
    // For ease of use copy elements
    let pItems = this.stackData.pItems[pRef];
    // Sort boxes based on distance from the corner of the pattern to the center of the box
    for (let i = 0; i < pItems.length; i++) {
      if (pItems[i].used) {
        let xDist = Math.abs(
          startCornerSizeX - (pItems[i].unitStartX + pItems[i].unitEndX) / 2
        );
        let yDist = Math.abs(
          startCornerSizeY - (pItems[i].unitStartY + pItems[i].unitEndY) / 2
        );

        pItems[i].centerDist = Math.sqrt(
          Math.pow(xDist, 2) + Math.pow(yDist, 2)
        );

        for (let j = i; j > 0; j--)
          if (
            pItems[j].centerDist < pItems[j - 1].centerDist ||
            !pItems[j - 1].used
          )
            [pItems[j], pItems[j - 1]] = [pItems[j - 1], pItems[j]];
          else break;
      }
    }
    // Check if one box is an obstacle for a next box
    for (let i = 0; i < pItems.length - 1; i++) {
      if (pItems[i].used) {
        for (let j = i + 1; j < pItems.length; j++) {
          if (pItems[j].used) {
            switch (startCorner) {
              case 1:
                // Start corner 1
                if (
                  (pItems[i].unitEndX > pItems[j].unitStartX &&
                    pItems[i].unitStartY >= pItems[j].unitEndY) ||
                  (pItems[i].unitStartX >= pItems[j].unitEndX &&
                    pItems[i].unitEndY > pItems[j].unitStartY)
                )
                  [pItems[i], pItems[j]] = [pItems[j], pItems[i]];
                break;
              case 2:
                // Start corner 2
                if (
                  (pItems[i].unitStartX < pItems[j].unitEndX &&
                    pItems[i].unitStartY >= pItems[j].unitEndY) ||
                  (pItems[i].unitEndX <= pItems[j].unitStartX &&
                    pItems[i].unitEndY > pItems[j].unitStartY)
                )
                  [pItems[i], pItems[j]] = [pItems[j], pItems[i]];
                break;
              case 3:
                // Start corner 3
                if (
                  (pItems[i].unitStartX < pItems[j].unitEndX &&
                    pItems[i].unitEndY <= pItems[j].unitStartY) ||
                  (pItems[i].unitEndX <= pItems[j].unitStartX &&
                    pItems[i].unitStartY < pItems[j].unitEndY)
                )
                  [pItems[i], pItems[j]] = [pItems[j], pItems[i]];
                break;
              case 4:
                // Start corner 4
                if (
                  (pItems[i].unitEndX > pItems[j].unitStartX &&
                    pItems[i].unitEndY <= pItems[j].unitStartY) ||
                  (pItems[i].unitStartX >= pItems[j].unitEndX &&
                    pItems[i].unitStartY < pItems[j].unitEndY)
                )
                  [pItems[i], pItems[j]] = [pItems[j], pItems[i]];
                break;
            }
          }
        }
      }
    }
  }

  /** Calculate pick and place orientation for vacuum grippers, long side linked
   * @alias calcVacGripperOrientLSL
   * @memberof ProjectBuilder
   * @param {number} pRef - Reference of the pattern [0:odd,1:even,2:top,3:temp]
   */
  calcVacGripperOrientLSL(pRef) {
    // Calculate the gripper orientation for long side lead boxes
    let patternCenterX = Math.floor(
      this.stackData.pSizes[pRef].patternSizeX / 2
    );
    let patternCenterY = Math.floor(
      this.stackData.pSizes[pRef].patternSizeY / 2
    );

    // Pick - place orientation for long side linked box handling
    //
    //         Long side leading (SSL)
    //        |-------------------------
    //        |Side 2
    //      S |------| S
    //      i |      | i       Feed dir
    //      d |      | d       <-----
    //  Y   e |      | e
    //  |     |      |
    //  |   3 |------|-1----------------
    //  |      Side 0
    //  o -------- X
    //
    //                Pallet
    //        |---------------------|
    //        |                     |
    //        |          2          |
    //        |       -------       |
    //        |      |       |      |
    //        |    3 |       | 1    |
    //        |      |       |      |
    //  Y     |       -------       |
    //  |     |          0          |
    //  |     |                     |
    //  |     |---------------------|
    //  o -------- X
    //
    // For both pick and place the orientation is calculated as follows
    //   Tool X axis parallel to the pallet/feeder X axis = 0
    //   Tool X axis parallel to the pallet/feeder Y axis = 1
    //   Tool X axis parallel to the pallet/feeder -X axis = 2
    //   Tool X axis parallel to the pallet/feeder -Y axis = 3

    this.stackData.pItems[pRef].forEach((pItem) => {
      if (pItem.used) {
        // Get the orientation of the unit to handle that has the most labels on the outside.
        let unitLabelOri = this.getUnitLabelOrient(pRef, pItem);

        switch (this.stackData.projectProp.gripperType) {
          case gripperTypes.grpVacuumCenter:
            if (this.stackData.boxProp.pickLSL <= 1) {
              // Handling one box at the time, gripper is rotated 90° (This is an exception to rule mentioned above)
              // Vacuum gripper with the TCP in the center of the gripper. There are two pick orientations avaiable.
              switch (pItem.boxOrient) {
                case 'H':
                  pItem.placeGripperOrient =
                    (pItem.unitStartX + pItem.unitEndX) / 2 < patternCenterX
                      ? 0
                      : 2;
                  break;
                case 'V':
                  pItem.placeGripperOrient =
                    (pItem.unitStartY + pItem.unitEndY) / 2 < patternCenterY
                      ? 1
                      : 3;
                  break;
              }
              // Set the label position
              pItem.pickGripperOrient =
                this.stackData.boxProp.labelPos.includes(true) &&
                unitLabelOri === (pItem.placeGripperOrient + 1) % 4
                  ? 3
                  : 1;
            } else {
              // Handling multiple boxes at the time
              // Vacuum gripper with the TCP in the center of the gripper. There are two pick orientations avaiable.
              switch (pItem.boxOrient) {
                case 'H':
                  pItem.placeGripperOrient =
                    (pItem.unitStartY + pItem.unitEndY) / 2 < patternCenterY
                      ? 1
                      : 3;
                  break;
                case 'V':
                  pItem.placeGripperOrient =
                    (pItem.unitStartX + pItem.unitEndX) / 2 < patternCenterX
                      ? 0
                      : 2;
                  break;
              }

              // Set the label position
              pItem.pickGripperOrient =
                this.stackData.boxProp.labelPos.includes(true) &&
                unitLabelOri === pItem.placeGripperOrient
                  ? 0
                  : 2;
            }

            break;

          case gripperTypes.grpVacuumCorner:
            // There is only one pick orientation available
            pItem.pickGripperOrient = 0;

            // Vacuum gripper with the TCP in the corner of the gripper.
            if (this.stackData.boxProp.labelPos.includes(true)) {
              // With label orientation
              pItem.placeGripperOrient = unitLabelOri;
            } else {
              // No label orientation
              switch (pItem.boxOrient) {
                case 'H':
                  pItem.placeGripperOrient =
                    (pItem.unitStartY + pItem.unitEndY) / 2 < patternCenterY
                      ? 1
                      : 3;
                  break;
                case 'V':
                  pItem.placeGripperOrient =
                    (pItem.unitStartX + pItem.unitEndX) / 2 < patternCenterX
                      ? 0
                      : 2;
                  break;
              }
            }

            break;
        }
      } else {
        pItem.pickGripperOrient = -1;
        pItem.placeGripperOrient = -1;
      }
    });
  }

  /**
   * Calculate pick and place orientation for vacuum grippers, short side linked
   * @alias calcVacGripperOrientSSL
   * @memberof ProjectBuilder
   * @param {number} pRef - Reference of the pattern [0:odd,1:even,2:top,3:temp]
   */
  calcVacGripperOrientSSL(pRef) {
    // Calculate the gripper orientation for short side lead boxes
    let patternCenterX = Math.floor(
      this.stackData.pSizes[pRef].patternSizeX / 2
    );
    let patternCenterY = Math.floor(
      this.stackData.pSizes[pRef].patternSizeY / 2
    );

    // Pick - place orientation for short side linked box handling
    //
    //         Long side leading (SSL)
    //        |--------------------------------
    //        |
    //        |    Side 2
    //      S |-------------| S        Feed dir
    //      i |             | i         <-----
    //  Y   d |             | d
    //  |   e |             | e
    //  |   3 |-------------|-1----------------
    //  |          Side 0
    //  o -------- X
    //
    //                Pallet
    //        |--------------------|
    //        |                    |
    //        |          2         |
    //        |       ------       |
    //        |      |      |      |
    //        |    3 |      | 1    |
    //  Y     |       ------       |
    //  |     |          0         |
    //  |     |                    |
    //  |     |--------------------|
    //  o -------- X
    //
    // For both pick and place the orientation is calculated as follows
    //   Tool X axis parallel to the pallet/feeder X axis = 0
    //   Tool X axis parallel to the pallet/feeder Y axis = 1
    //   Tool X axis parallel to the pallet/feeder -X axis = 2
    //   Tool X axis parallel to the pallet/feeder -Y axis = 3

    this.stackData.pItems[pRef].forEach((pItem) => {
      if (pItem.used) {
        // Get the orientation of the unit to handle that has the most labels on the outside.

        switch (pItem.boxOrient) {
          case 'H':
            pItem.placeGripperOrient =
              (pItem.unitStartX + pItem.unitEndX) / 2 < patternCenterX ? 0 : 2;
            break;
          case 'V':
            pItem.placeGripperOrient =
              (pItem.unitStartY + pItem.unitEndY) / 2 < patternCenterY ? 1 : 3;
            break;
        }

        // Set the pick orientation according the label position (only applicable for vacuum grippers with the tcp at the center)
        pItem.pickGripperOrient =
          this.stackData.boxProp.labelPos.includes(true) &&
          pItem.labelOrient === pItem.placeGripperOrient
            ? 0
            : 2;
      } else {
        pItem.pickGripperOrient = -1;
        pItem.placeGripperOrient = -1;
      }
    });
  }

  /**
   * Calculate pick and place orientation for mechanical grippers, long side linked
   * @alias calcMechGripperOrientLSL
   * @memberof ProjectBuilder
   * @param {number} pRef - Reference of the pattern [0:odd,1:even,2:top,3:temp]
   * @param {number} startCorner - Start corner of the pallet
   */
  calcMechGripperOrientLSL(pRef, startCorner) {
    // Find the sides on the box that do not interfere with other boxes already present on the layer.
    // One side has two gripper locations, where the outer edge of the gripper is flush with the corner of the box
    // The freeSides array indicates which corner/side is free from collisions with already placed boxes
    //          5                          4
    //        |------------------------------|
    //      6 |           Side 2             |  3
    //        |                              |
    //        |                              |
    //        |                              |
    //        |  S                        S  |
    //        |  i                        i  |
    //        |  d                        d  |
    //        |  e           BOX          e  |
    //        |                              |
    //        |  3                        1  |
    //  Y     |                              |
    //  ^     |                              |
    //  |     |                              |
    //  |   7 |           Side 0             |  2
    //  |     |------------------------------|
    //  |       0                          1
    //  o----------> X
    //

    let pItemCnt = 0;

    this.stackData.pItems[pRef].forEach((pItem) => {
      if (pItem.used) {
        let availPlace = [
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
        ];

        pItem.freeSides = this.findFreeSidesNew(
          pRef,
          pItem,
          startCorner,
          pItemCnt++
        );

        // Build a list of possible place positions based on the available pick positions, independent of label orientation
        switch (pItem.boxOrient) {
          case 'H':
            if (
              this.stackData.projectProp.availablePickPos[0] === 1 ||
              this.stackData.projectProp.availablePickPos[4] === 1
            ) {
              availPlace[2] = true;
              availPlace[6] = true;
            }
            if (
              this.stackData.projectProp.availablePickPos[1] === 1 ||
              this.stackData.projectProp.availablePickPos[5] === 1
            ) {
              availPlace[3] = true;
              availPlace[7] = true;
            }
            if (
              this.stackData.projectProp.availablePickPos[2] === 1 ||
              this.stackData.projectProp.availablePickPos[6] === 1
            ) {
              availPlace[0] = true;
              availPlace[4] = true;
            }
            if (
              this.stackData.projectProp.availablePickPos[3] === 1 ||
              this.stackData.projectProp.availablePickPos[7] === 1
            ) {
              availPlace[1] = true;
              availPlace[5] = true;
            }

            // Remove the sides that can't be handled for multi box long side linked boxes
            if (this.stackData.boxProp.pickLSL > 1) {
              pItem.freeSides[0] = false;
              pItem.freeSides[1] = false;
              pItem.freeSides[4] = false;
              pItem.freeSides[5] = false;
            }

            break;
          case 'V':
            if (
              this.stackData.projectProp.availablePickPos[0] === 1 ||
              this.stackData.projectProp.availablePickPos[4] === 1
            ) {
              availPlace[0] = true;
              availPlace[4] = true;
            }
            if (
              this.stackData.projectProp.availablePickPos[1] === 1 ||
              this.stackData.projectProp.availablePickPos[5] === 1
            ) {
              availPlace[1] = true;
              availPlace[5] = true;
            }
            if (
              this.stackData.projectProp.availablePickPos[2] === 1 ||
              this.stackData.projectProp.availablePickPos[6] === 1
            ) {
              availPlace[2] = true;
              availPlace[6] = true;
            }
            if (
              this.stackData.projectProp.availablePickPos[3] === 1 ||
              this.stackData.projectProp.availablePickPos[7] === 1
            ) {
              availPlace[3] = true;
              availPlace[7] = true;
            }

            // Remove the sides that can't be handled for multi box long side linked boxes
            if (this.stackData.boxProp.pickLSL > 1) {
              pItem.freeSides[2] = false;
              pItem.freeSides[3] = false;
              pItem.freeSides[6] = false;
              pItem.freeSides[7] = false;
            }

            break;
        }

        // Check the available place position against actual place positions
        for (let i = 0; i < pItem.freeSides.length; i++) {
          availPlace[i] = pItem.freeSides[i] && availPlace[i];
        }

        pItem.pickGripperOrient = -2;
        pItem.placeGripperOrient = -2;

        // Exit if no available place position is found
        if (availPlace.filter((v) => v === true).length === 0) return false;

        // Look for pick and place positions for matching label orientation
        switch (pItem.labelOrient) {
          case 0:
            // Orient 'V'
            if (
              availPlace[0] &&
              this.stackData.projectProp.availablePickPos[0] === 1
            ) {
              pItem.pickGripperOrient = 0;
              pItem.placeGripperOrient = 0;
              break;
            }
            if (
              availPlace[1] &&
              this.stackData.projectProp.availablePickPos[1] === 1
            ) {
              pItem.pickGripperOrient = 1;
              pItem.placeGripperOrient = 1;
              break;
            }
            if (
              availPlace[4] &&
              this.stackData.projectProp.availablePickPos[4] === 1
            ) {
              pItem.pickGripperOrient = 4;
              pItem.placeGripperOrient = 4;
              break;
            }
            if (
              availPlace[5] &&
              this.stackData.projectProp.availablePickPos[5] === 1
            ) {
              pItem.pickGripperOrient = 5;
              pItem.placeGripperOrient = 5;
              break;
            }

            break;
          case 1:
            // Orient 'H'
            if (
              availPlace[2] &&
              this.stackData.projectProp.availablePickPos[0] === 1
            ) {
              pItem.pickGripperOrient = 0;
              pItem.placeGripperOrient = 2;
              break;
            }
            if (
              availPlace[3] &&
              this.stackData.projectProp.availablePickPos[1] === 1
            ) {
              pItem.pickGripperOrient = 1;
              pItem.placeGripperOrient = 3;
              break;
            }
            if (
              availPlace[6] &&
              this.stackData.projectProp.availablePickPos[4] === 1
            ) {
              pItem.pickGripperOrient = 4;
              pItem.placeGripperOrient = 6;
              break;
            }
            if (
              availPlace[7] &&
              this.stackData.projectProp.availablePickPos[5] === 1
            ) {
              pItem.pickGripperOrient = 5;
              pItem.placeGripperOrient = 7;
              break;
            }

            break;
          case 2:
            // Orient 'V'
            if (
              availPlace[4] &&
              this.stackData.projectProp.availablePickPos[0] === 1
            ) {
              pItem.pickGripperOrient = 0;
              pItem.placeGripperOrient = 4;
              break;
            }
            if (
              availPlace[5] &&
              this.stackData.projectProp.availablePickPos[1] === 1
            ) {
              pItem.pickGripperOrient = 1;
              pItem.placeGripperOrient = 5;
              break;
            }
            if (
              availPlace[0] &&
              this.stackData.projectProp.availablePickPos[4] === 1
            ) {
              pItem.pickGripperOrient = 4;
              pItem.placeGripperOrient = 0;
              break;
            }
            if (
              availPlace[1] &&
              this.stackData.projectProp.availablePickPos[5] === 1
            ) {
              pItem.pickGripperOrient = 5;
              pItem.placeGripperOrient = 1;
              break;
            }

            break;
          case 3:
            // Orient 'H'
            if (
              availPlace[6] &&
              this.stackData.projectProp.availablePickPos[0] === 1
            ) {
              pItem.pickGripperOrient = 0;
              pItem.placeGripperOrient = 6;
              break;
            }
            if (
              availPlace[7] &&
              this.stackData.projectProp.availablePickPos[1] === 1
            ) {
              pItem.pickGripperOrient = 1;
              pItem.placeGripperOrient = 7;
              break;
            }
            if (
              availPlace[2] &&
              this.stackData.projectProp.availablePickPos[4] === 1
            ) {
              pItem.pickGripperOrient = 4;
              pItem.placeGripperOrient = 2;
              break;
            }
            if (
              availPlace[3] &&
              this.stackData.projectProp.availablePickPos[5] === 1
            ) {
              pItem.pickGripperOrient = 5;
              pItem.placeGripperOrient = 3;
              break;
            }

            break;
        }

        if (pItem.pickGripperOrient < 0) {
          // If no match for the label is found, use the first available solution and add a pick position
          pItem.placeGripperOrient = availPlace.findIndex((v) => v === true);
          switch (pItem.placeGripperOrient) {
            case 0:
            case 4:
              if (this.stackData.projectProp.availablePickPos[0] === 1)
                pItem.pickGripperOrient = 0;
              if (this.stackData.projectProp.availablePickPos[4] === 1)
                pItem.pickGripperOrient = 4;
              break;
            case 1:
            case 5:
              if (this.stackData.projectProp.availablePickPos[1] === 1)
                pItem.pickGripperOrient = 1;
              if (this.stackData.projectProp.availablePickPos[5] === 1)
                pItem.pickGripperOrient = 5;
              break;
            case 2:
            case 6:
              if (this.stackData.projectProp.availablePickPos[0] === 1)
                pItem.pickGripperOrient = 0;
              if (this.stackData.projectProp.availablePickPos[4] === 1)
                pItem.pickGripperOrient = 4;
              break;
            case 3:
            case 7:
              if (this.stackData.projectProp.availablePickPos[1] === 1)
                pItem.pickGripperOrient = 1;
              if (this.stackData.projectProp.availablePickPos[5] === 1)
                pItem.pickGripperOrient = 5;
              break;
          }
        }

        // For multibox handling, boxes to be placed need to be swapped when the gripper orientation is located on the last box of the multipick.
        // Only the formula requires swapping.
        if (startCorner === 1 && startCorner === 4) {
          switch (pItem.boxOrient) {
            case 'H':
              if (
                pItem.lastLink >= 0 &&
                pItem.placeGripperOrient >= 3 &&
                pItem.placeGripperOrient <= 6
              ) {
                let index = this.stackData.pItems[pRef].findIndex(
                  (t) => t.ID === pItem.lastLink
                );

                // Swap formulas
                let tempStr = this.stackData.pItems[pRef][index].formula;
                this.stackData.pItems[pRef][index].formula = pItem.formula;
                pItem.formula = tempStr;
              }
              break;
            case 'V':
              if (
                pItem.lastLink >= 0 &&
                pItem.placeGripperOrient >= 1 &&
                pItem.placeGripperOrient <= 4
              ) {
                let index = this.stackData.pItems[pRef].findIndex(
                  (t) => t.ID === pItem.lastLink
                );

                // Swap formulas
                let tempStr = this.stackData.pItems[pRef][index].formula;
                this.stackData.pItems[pRef][index].formula = pItem.formula;
                pItem.formula = tempStr;
              }
              break;
          }
        }
      } else {
        pItem.pickGripperOrient = -2;
        pItem.placeGripperOrient = -2;
        pItem.approachDir = -1;
        pItem.linkType = -1;
      }
    });
    return true;
  }

  /**
   * Calculate pick and place orientation for mechanical grippers, short side linked
   * @alias calcMechGripperOrientSSL
   * @memberof ProjectBuilder
   * @param {number} pRef - Reference of the pattern [0:odd,1:even,2:top,3:temp]
   * @param {number} startCorner - Start corner of the pallet
   */
  calcMechGripperOrientSSL(pRef, startCorner) {
    // Find the sides on the box that do not interfere with other boxes already present on the layer.
    // One side has two gripper locations, where the outer edge of the gripper is flush with the corner of the box
    // The freeSides array indicates which corner/side is free from collisions with already placed boxes
    //          6                          5
    //        |------------------------------|
    //      7 |           Side 3             |  4
    //        |                              |
    //        |                              |
    //        |                              |
    //        |  S                        S  |
    //        |  i                        i  |
    //        |  d                        d  |
    //        |  e           BOX          e  |
    //        |                              |
    //        |  4                        2  |
    //  Y     |                              |
    //  ^     |                              |
    //  |     |                              |
    //  |   8 |           Side 1             |  3
    //  |     |------------------------------|
    //  |       1                          2
    //  o----------> X
    //

    let pItemCnt = 0;

    this.stackData.pItems[pRef].forEach((pItem) => {
      if (pItem.used) {
        let availPlace = [
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
        ];

        pItem.freeSides = this.findFreeSidesNew(
          pRef,
          pItem,
          startCorner,
          pItemCnt++
        );

        // Build a list of possible place positions based on the available pick positions, independent of label orientation
        switch (pItem.boxOrient) {
          case 'H':
            if (
              this.stackData.projectProp.availablePickPos[0] === 1 ||
              this.stackData.projectProp.availablePickPos[4] === 1
            ) {
              availPlace[0] = true;
              availPlace[4] = true;
            }
            if (
              this.stackData.projectProp.availablePickPos[1] === 1 ||
              this.stackData.projectProp.availablePickPos[5] === 1
            ) {
              availPlace[1] = true;
              availPlace[5] = true;
            }
            if (
              this.stackData.projectProp.availablePickPos[2] === 1 ||
              this.stackData.projectProp.availablePickPos[6] === 1
            ) {
              availPlace[2] = true;
              availPlace[6] = true;
            }
            if (
              this.stackData.projectProp.availablePickPos[3] === 1 ||
              this.stackData.projectProp.availablePickPos[7] === 1
            ) {
              availPlace[3] = true;
              availPlace[7] = true;
            }

            // Remove the sides that can't be handled for short side linked boxes
            if (this.stackData.boxProp.pickSSL > 1) {
              pItem.freeSides[2] = false;
              pItem.freeSides[3] = false;
              pItem.freeSides[6] = false;
              pItem.freeSides[7] = false;
            }

            break;
          case 'V':
            if (
              this.stackData.projectProp.availablePickPos[0] === 1 ||
              this.stackData.projectProp.availablePickPos[4] === 1
            ) {
              availPlace[2] = true;
              availPlace[6] = true;
            }
            if (
              this.stackData.projectProp.availablePickPos[1] === 1 ||
              this.stackData.projectProp.availablePickPos[5] === 1
            ) {
              availPlace[3] = true;
              availPlace[7] = true;
            }
            if (
              this.stackData.projectProp.availablePickPos[2] === 1 ||
              this.stackData.projectProp.availablePickPos[6] === 1
            ) {
              availPlace[0] = true;
              availPlace[4] = true;
            }
            if (
              this.stackData.projectProp.availablePickPos[3] === 1 ||
              this.stackData.projectProp.availablePickPos[7] === 1
            ) {
              availPlace[1] = true;
              availPlace[5] = true;
            }

            // Remove the sides that can't be handled for short side linked boxes
            if (this.stackData.boxProp.pickSSL > 1) {
              pItem.freeSides[0] = false;
              pItem.freeSides[1] = false;
              pItem.freeSides[4] = false;
              pItem.freeSides[5] = false;
            }

            break;
        }

        // Check the available place position against actual place positions
        for (let i = 0; i < pItem.freeSides.length; i++) {
          availPlace[i] = pItem.freeSides[i] && availPlace[i];
        }

        pItem.pickGripperOrient = -2;
        pItem.placeGripperOrient = -2;

        // Exit if no available place position is found
        if (availPlace.filter((v) => v === true).length === 0) return false;

        // Look for pick and place positions for matching label orientation
        switch (pItem.labelOrient) {
          case 0:
            // Orient 'H'
            if (
              availPlace[0] &&
              this.stackData.projectProp.availablePickPos[0] === 1
            ) {
              pItem.pickGripperOrient = 0;
              pItem.placeGripperOrient = 0;
              break;
            }
            if (
              availPlace[1] &&
              this.stackData.projectProp.availablePickPos[1] === 1
            ) {
              pItem.pickGripperOrient = 1;
              pItem.placeGripperOrient = 1;
              break;
            }
            if (
              availPlace[4] &&
              this.stackData.projectProp.availablePickPos[4] === 1
            ) {
              pItem.pickGripperOrient = 4;
              pItem.placeGripperOrient = 4;
              break;
            }
            if (
              availPlace[5] &&
              this.stackData.projectProp.availablePickPos[5] === 1
            ) {
              pItem.pickGripperOrient = 5;
              pItem.placeGripperOrient = 5;
              break;
            }
            break;
          case 1:
            // Orient 'H'
            if (
              availPlace[2] &&
              this.stackData.projectProp.availablePickPos[0] === 1
            ) {
              pItem.pickGripperOrient = 0;
              pItem.placeGripperOrient = 2;
              break;
            }
            if (
              availPlace[3] &&
              this.stackData.projectProp.availablePickPos[1] === 1
            ) {
              pItem.pickGripperOrient = 1;
              pItem.placeGripperOrient = 3;
              break;
            }
            if (
              availPlace[6] &&
              this.stackData.projectProp.availablePickPos[4] === 1
            ) {
              pItem.pickGripperOrient = 4;
              pItem.placeGripperOrient = 6;
              break;
            }
            if (
              availPlace[7] &&
              this.stackData.projectProp.availablePickPos[5] === 1
            ) {
              pItem.pickGripperOrient = 5;
              pItem.placeGripperOrient = 7;
              break;
            }
            break;
          case 2:
            // Orient 'V'
            if (
              availPlace[4] &&
              this.stackData.projectProp.availablePickPos[0] === 1
            ) {
              pItem.pickGripperOrient = 0;
              pItem.placeGripperOrient = 4;
              break;
            }
            if (
              availPlace[5] &&
              this.stackData.projectProp.availablePickPos[1] === 1
            ) {
              pItem.pickGripperOrient = 1;
              pItem.placeGripperOrient = 5;
              break;
            }
            if (
              availPlace[0] &&
              this.stackData.projectProp.availablePickPos[4] === 1
            ) {
              pItem.pickGripperOrient = 4;
              pItem.placeGripperOrient = 0;
              break;
            }
            if (
              availPlace[1] &&
              this.stackData.projectProp.availablePickPos[5] === 1
            ) {
              pItem.pickGripperOrient = 5;
              pItem.placeGripperOrient = 1;
              break;
            }
            break;
          case 3:
            // Orient 'H'
            if (
              availPlace[6] &&
              this.stackData.projectProp.availablePickPos[0] === 1
            ) {
              pItem.pickGripperOrient = 0;
              pItem.placeGripperOrient = 6;
              break;
            }
            if (
              availPlace[7] &&
              this.stackData.projectProp.availablePickPos[1] === 1
            ) {
              pItem.pickGripperOrient = 1;
              pItem.placeGripperOrient = 7;
              break;
            }
            if (
              availPlace[2] &&
              this.stackData.projectProp.availablePickPos[4] === 1
            ) {
              pItem.pickGripperOrient = 4;
              pItem.placeGripperOrient = 2;
              break;
            }
            if (
              availPlace[3] &&
              this.stackData.projectProp.availablePickPos[5] === 1
            ) {
              pItem.pickGripperOrient = 5;
              pItem.placeGripperOrient = 3;
              break;
            }
            break;
        }

        if (pItem.pickGripperOrient < 0) {
          // If no match for the label is found, use the first available solution and add a pick position
          pItem.placeGripperOrient = availPlace.findIndex((v) => v === true);
          switch (pItem.placeGripperOrient) {
            case 0:
            case 4:
              if (this.stackData.projectProp.availablePickPos[0] === 1)
                pItem.pickGripperOrient = 0;
              if (this.stackData.projectProp.availablePickPos[4] === 1)
                pItem.pickGripperOrient = 4;
              break;
            case 1:
            case 5:
              if (this.stackData.projectProp.availablePickPos[1] === 1)
                pItem.pickGripperOrient = 1;
              if (this.stackData.projectProp.availablePickPos[5] === 1)
                pItem.pickGripperOrient = 5;
              break;
            case 2:
            case 6:
              if (this.stackData.projectProp.availablePickPos[0] === 1)
                pItem.pickGripperOrient = 0;
              if (this.stackData.projectProp.availablePickPos[4] === 1)
                pItem.pickGripperOrient = 4;
              break;
            case 3:
            case 7:
              if (this.stackData.projectProp.availablePickPos[1] === 1)
                pItem.pickGripperOrient = 1;
              if (this.stackData.projectProp.availablePickPos[5] === 1)
                pItem.pickGripperOrient = 5;
              break;
          }
        }

        // For multibox handling, boxes to be placed need to be swapped when the gripper orientation is located on the last box of the multipick.
        // Only the formula requires swapping.
        if (startCorner === 1 && startCorner === 4) {
          switch (pItem.boxOrient) {
            case 'H':
              if (
                pItem.lastLink >= 0 &&
                pItem.placeGripperOrient >= 3 &&
                pItem.placeGripperOrient <= 6
              ) {
                let index = this.stackData.pItems[pRef].findIndex(
                  (t) => t.ID === pItem.lastLink
                );
                let tempStr = this.stackData.pItems[pRef][index].formula;
                this.stackData.pItems[pRef][index].formula = pItem.formula;
                pItem.formula = tempStr;
              }
              break;
            case 'V':
              if (
                pItem.lastLink >= 0 &&
                pItem.placeGripperOrient >= 1 &&
                pItem.placeGripperOrient <= 4
              ) {
                let index = this.stackData.pItems[pRef].findIndex(
                  (t) => t.ID === pItem.lastLink
                );
                let tempStr = this.stackData.pItems[pRef][index].formula;
                this.stackData.pItems[pRef][index].formula = pItem.formula;
                pItem.formula = tempStr;
              }
              break;
          }
        }
      } else {
        pItem.pickGripperOrient = -2;
        pItem.placeGripperOrient = -2;
        pItem.approachDir = -1;
        pItem.linkType = -1;
      }
    });
    return true;
  }

  /**
   * Find the free sides of each box in the pattern. The free side of a box is on the outside of the pattern.
   * @alias findFreeSidesNew
   * @memberof ProjectBuilder
   * @param {number} pRef - Reference of the pattern [0:odd,1:even,2:top,3:temp]
   * @param {patteritemdata} pItem - The properties of the item
   * @param {number} startCorner - Start corner of the pallet
   * @param {number} itemRef - The reference number of the item in the pattern
   */
  findFreeSidesNew(pRef, pItem, startCorner, itemRef) {
    pItem.freeSides = [true, true, true, true, true, true, true, true];

    let gripLowX = [0, 0, 0, 0, 0, 0, 0, 0];
    let gripHighX = [0, 0, 0, 0, 0, 0, 0, 0];
    let gripLowY = [0, 0, 0, 0, 0, 0, 0, 0];
    let gripHighY = [0, 0, 0, 0, 0, 0, 0, 0];

    let pickLength =
      this.stackData.boxProp.pickLSL * this.stackData.boxProp.width +
      this.stackData.boxProp.pickSSL * this.stackData.boxProp.length;

    // Calculate maximum and minimum X and Y coordinates for each place orientation
    switch (this.stackData.projectProp.gripperType) {
      case gripperTypes.grpMechOppSideCornerBottom:
      case gripperTypes.grpMechTCPSideCornerBottom:
      case gripperTypes.grpMechOppSideCornerTop:
      case gripperTypes.grpMechTCPSideCornerTop:
        // Min and max X for orient 0, 1, 4 and 5
        gripLowX[0] = pItem.unitStartX;
        gripHighX[0] =
          pItem.unitStartX + this.stackData.projectProp.gripperWidth;

        gripLowX[1] = pItem.unitEndX - this.stackData.projectProp.gripperWidth;
        gripHighX[1] = pItem.unitEndX;

        gripLowX[4] = pItem.unitEndX - this.stackData.projectProp.gripperWidth;
        gripHighX[4] = pItem.unitEndX;

        gripLowX[5] = pItem.unitStartX;
        gripHighX[5] =
          pItem.unitStartX + this.stackData.projectProp.gripperWidth;

        // Min and max Y for orient 2, 3, 6 and 7
        gripLowY[2] = pItem.unitEndY;
        gripHighY[2] =
          pItem.unitStartY + this.stackData.projectProp.gripperWidth;

        gripLowY[3] = pItem.unitEndY - this.stackData.projectProp.gripperWidth;
        gripHighY[3] = pItem.unitEndY;

        gripLowY[6] = pItem.unitEndY - this.stackData.projectProp.gripperWidth;
        gripHighY[6] = pItem.unitEndY;

        gripLowY[7] = pItem.unitStartY;
        gripHighY[7] =
          pItem.unitStartY + this.stackData.projectProp.gripperWidth;

        break;
      case gripperTypes.grpMechOppSideCenterBottom:
      case gripperTypes.grpMechTCPSideCenterBottom:
      case gripperTypes.grpMechOppSideCenterTop:
      case gripperTypes.grpMechTCPSideCenterTop:
      case gripperTypes.grpMechCenterTop:
        // Min and max X for orient 0, 1, 4 and 5
        let unitCenterX = (pItem.unitStartX + pItem.unitEndX) / 2;

        gripLowX[0] = unitCenterX - this.stackData.projectProp.gripperWidth / 2;
        gripHighX[0] =
          unitCenterX + this.stackData.projectProp.gripperWidth / 2;

        gripLowX[1] = gripLowX[4] = gripLowX[5] = gripLowX[0];
        gripHighX[1] = gripHighX[4] = gripHighX[5] = gripHighX[0];

        // Min and max Y for orient 2, 3, 6 and 7
        let unitCenterY = (pItem.unitStartY + pItem.unitEndY) / 2;

        gripLowY[2] = unitCenterY - this.stackData.projectProp.gripperWidth / 2;
        gripHighY[2] =
          unitCenterY + this.stackData.projectProp.gripperWidth / 2;

        gripLowY[3] = gripLowY[6] = gripLowY[7] = gripLowY[0];
        gripHighY[3] = gripHighY[6] = gripHighY[7] = gripHighY[0];

        break;
    }

    // Find the available sides of the box. Each box side is verified with the boxes already present on the layer
    switch (startCorner) {
      case 1:
        for (let i = 0; i < itemRef; i++) {
          // Check side 0, 1, 4 and 5
          if (gripLowX[0] < this.stackData.pItems[pRef][i].unitEndX)
            pItem.freeSides[0] = false;
          if (gripLowX[1] < this.stackData.pItems[pRef][i].unitEndX)
            pItem.freeSides[1] = false;
          if (
            gripLowX[4] < this.stackData.pItems[pRef][i].unitEndX &&
            pItem.unitStartY < this.stackData.pItems[pRef][i].unitEndY
          )
            pItem.freeSides[4] = false;
          if (
            gripLowX[5] < this.stackData.pItems[pRef][i].unitEndX &&
            pItem.unitStartY < this.stackData.pItems[pRef][i].unitEndY
          )
            pItem.freeSides[5] = false;

          // Check side 2, 3, 6 and 7
          if (
            gripLowY[2] < this.stackData.pItems[pRef][i].unitEndY &&
            pItem.unitStartX < this.stackData.pItems[pRef][i].unitEndX
          )
            pItem.freeSides[2] = false;
          if (
            gripLowY[3] < this.stackData.pItems[pRef][i].unitEndY &&
            pItem.unitStartX < this.stackData.pItems[pRef][i].unitEndX
          )
            pItem.freeSides[3] = false;
          if (gripLowY[6] < this.stackData.pItems[pRef][i].unitEndY)
            pItem.freeSides[6] = false;
          if (gripLowY[7] < this.stackData.pItems[pRef][i].unitEndY)
            pItem.freeSides[7] = false;
        }
        break;
      case 2:
        for (let i = 0; i < itemRef; i++) {
          // Check side 0, 1, 4 and 5
          if (gripHighX[0] > this.stackData.pItems[pRef][i].unitStartX)
            pItem.freeSides[0] = false;
          if (gripHighX[1] > this.stackData.pItems[pRef][i].unitStartX)
            pItem.freeSides[1] = false;
          if (
            gripHighX[4] > this.stackData.pItems[pRef][i].unitStartX &&
            pItem.unitStartY < this.stackData.pItems[pRef][i].unitEndY
          )
            pItem.freeSides[4] = false;
          if (
            gripHighX[5] > this.stackData.pItems[pRef][i].unitStartX &&
            pItem.unitStartY < this.stackData.pItems[pRef][i].unitEndY
          )
            pItem.freeSides[5] = false;

          // Check side 2, 3, 6 and 7
          if (gripLowY[2] < this.stackData.pItems[pRef][i].unitEndY)
            pItem.freeSides[2] = false;
          if (gripLowY[3] < this.stackData.pItems[pRef][i].unitEndY)
            pItem.freeSides[3] = false;
          if (
            gripLowY[6] < this.stackData.pItems[pRef][i].unitEndY &&
            pItem.unitEndX > this.stackData.pItems[pRef][i].unitStartX
          )
            pItem.freeSides[6] = false;
          if (
            gripLowY[7] < this.stackData.pItems[pRef][i].unitEndY &&
            pItem.unitEndX > this.stackData.pItems[pRef][i].unitStartX
          )
            pItem.freeSides[7] = false;
        }
        break;
      case 3:
        for (let i = 0; i < itemRef; i++) {
          // Check side 0, 1, 4 and 5
          if (
            gripHighX[0] > this.stackData.pItems[pRef][i].unitStartX &&
            pItem.unitEndY > this.stackData.pItems[pRef][i].unitStartY
          )
            pItem.freeSides[0] = false;
          if (
            gripHighX[1] > this.stackData.pItems[pRef][i].unitStartX &&
            pItem.unitEndY > this.stackData.pItems[pRef][i].unitStartY
          )
            pItem.freeSides[1] = false;
          if (gripHighX[4] > this.stackData.pItems[pRef][i].unitStartX)
            pItem.freeSides[4] = false;
          if (gripHighX[5] > this.stackData.pItems[pRef][i].unitStartX)
            pItem.freeSides[5] = false;

          // Check side 2, 3, 6 and 7
          if (gripHighY[2] > this.stackData.pItems[pRef][i].unitStartY)
            pItem.freeSides[2] = false;
          if (gripHighY[3] > this.stackData.pItems[pRef][i].unitStartY)
            pItem.freeSides[3] = false;
          if (
            gripHighY[6] > this.stackData.pItems[pRef][i].unitStartY &&
            pItem.unitEndX > this.stackData.pItems[pRef][i].unitStartX
          )
            pItem.freeSides[6] = false;
          if (
            gripHighY[7] > this.stackData.pItems[pRef][i].unitStartY &&
            pItem.unitEndX > this.stackData.pItems[pRef][i].unitStartX
          )
            pItem.freeSides[7] = false;
        }
        break;
      case 4:
        for (let i = 0; i < itemRef; i++) {
          // Check side 0, 1, 4 and 5
          if (
            gripLowX[0] < this.stackData.pItems[pRef][i].unitEndX &&
            pItem.boxEndY > this.stackData.pItems[pRef][i].BoxStartY
          )
            pItem.freeSides[0] = false;
          if (
            gripLowX[1] < this.stackData.pItems[pRef][i].unitEndX &&
            pItem.boxEndY > this.stackData.pItems[pRef][i].BoxStartY
          )
            pItem.freeSides[1] = false;
          if (gripLowX[4] < this.stackData.pItems[pRef][i].unitEndX)
            pItem.freeSides[4] = false;
          if (gripLowX[5] < this.stackData.pItems[pRef][i].unitEndX)
            pItem.freeSides[5] = false;

          // Check side 2, 3, 6 and 7
          if (
            gripHighY[2] > this.stackData.pItems[pRef][i].unitStartY &&
            pItem.unitStartX < this.stackData.pItems[pRef][i].unitEndX
          )
            pItem.freeSides[2] = false;
          if (
            gripHighY[3] > this.stackData.pItems[pRef][i].unitStartY &&
            pItem.unitStartX < this.stackData.pItems[pRef][i].unitEndX
          )
            pItem.freeSides[3] = false;
          if (gripHighY[6] > this.stackData.pItems[pRef][i].unitStartY)
            pItem.freeSides[6] = false;
          if (gripHighY[7] > this.stackData.pItems[pRef][i].unitStartY)
            pItem.freeSides[7] = false;
        }
        break;
    }

    return pItem.freeSides;
  }

  /**
   * Calculate the label orientation of the unit to place.
   * @alias getUnitLabelOrient
   * @memberof ProjectBuilder
   * @param {number} pRef - Reference of the pattern [0:odd,1:even,2:top,3:temp]
   * @param {object} pItem - Pattern item to handle
   */
  getUnitLabelOrient(pRef, pItem) {
    // If the unit has one box the predefined label orientation is used
    if (pItem.lastLink <= -1) return pItem.labelOrient;
    // For ease of use copy elements
    let pItems = this.stackData.pItems[pRef];

    let labelMatchLongSide = [0, 0];
    let labelMatchShortSide = [0, 0];

    let linkPtr = pItem.lastLink;
    do {
      for (let j = 0; j < pItems.length; j++) {
        if (pItems[j].ID === linkPtr) {
          // Get the outer sides of unit to handle
          let outerBoxSides = findOuterBoxSides(j, pItems);

          // Check if a label is present on the outside of box for the given label orientation. Then count these labels
          // for the long and short side of the box.
          switch (pItems[j].boxOrient) {
            case 'H':
              switch (pItems[j].labelOrient) {
                case 0:
                  // For SSL boxes
                  if (this.stackData.boxProp.labelPos[0] && outerBoxSides[0])
                    labelMatchLongSide[0]++;
                  if (this.stackData.boxProp.labelPos[1] && outerBoxSides[1])
                    labelMatchShortSide[0]++;
                  if (this.stackData.boxProp.labelPos[2] && outerBoxSides[2])
                    labelMatchLongSide[0]++;
                  if (this.stackData.boxProp.labelPos[3] && outerBoxSides[3])
                    labelMatchShortSide[0]++;
                  break;
                case 1:
                  // For LSL boxes
                  if (this.stackData.boxProp.labelPos[0] && outerBoxSides[1])
                    labelMatchShortSide[0]++;
                  if (this.stackData.boxProp.labelPos[1] && outerBoxSides[2])
                    labelMatchLongSide[0]++;
                  if (this.stackData.boxProp.labelPos[2] && outerBoxSides[3])
                    labelMatchShortSide[0]++;
                  if (this.stackData.boxProp.labelPos[3] && outerBoxSides[0])
                    labelMatchLongSide[0]++;
                  break;
                case 2:
                  // For SSL boxes
                  if (this.stackData.boxProp.labelPos[0] && outerBoxSides[2])
                    labelMatchLongSide[1]++;
                  if (this.stackData.boxProp.labelPos[1] && outerBoxSides[3])
                    labelMatchShortSide[1]++;
                  if (this.stackData.boxProp.labelPos[2] && outerBoxSides[0])
                    labelMatchLongSide[1]++;
                  if (this.stackData.boxProp.labelPos[3] && outerBoxSides[1])
                    labelMatchShortSide[1]++;
                  break;
                case 3:
                  // For LSL boxes
                  if (this.stackData.boxProp.labelPos[0] && outerBoxSides[3])
                    labelMatchShortSide[1]++;
                  if (this.stackData.boxProp.labelPos[1] && outerBoxSides[0])
                    labelMatchLongSide[1]++;
                  if (this.stackData.boxProp.labelPos[2] && outerBoxSides[1])
                    labelMatchShortSide[1]++;
                  if (this.stackData.boxProp.labelPos[3] && outerBoxSides[2])
                    labelMatchLongSide[1]++;
                  break;
              }
              break;
            case 'V':
              switch (pItems[j].labelOrient) {
                case 0:
                  // For LSL boxes
                  if (this.stackData.boxProp.labelPos[0] && outerBoxSides[0])
                    labelMatchShortSide[0]++;
                  if (this.stackData.boxProp.labelPos[1] && outerBoxSides[1])
                    labelMatchLongSide[0]++;
                  if (this.stackData.boxProp.labelPos[2] && outerBoxSides[2])
                    labelMatchShortSide[0]++;
                  if (this.stackData.boxProp.labelPos[3] && outerBoxSides[3])
                    labelMatchLongSide[0]++;
                  break;
                case 1:
                  // For SSL boxes
                  if (this.stackData.boxProp.labelPos[0] && outerBoxSides[1])
                    labelMatchLongSide[0]++;
                  if (this.stackData.boxProp.labelPos[1] && outerBoxSides[2])
                    labelMatchShortSide[0]++;
                  if (this.stackData.boxProp.labelPos[2] && outerBoxSides[3])
                    labelMatchLongSide[0]++;
                  if (this.stackData.boxProp.labelPos[3] && outerBoxSides[0])
                    labelMatchShortSide[0]++;
                  break;
                case 2:
                  // For LSL boxes
                  if (this.stackData.boxProp.labelPos[0] && outerBoxSides[2])
                    labelMatchShortSide[1]++;
                  if (this.stackData.boxProp.labelPos[1] && outerBoxSides[3])
                    labelMatchLongSide[1]++;
                  if (this.stackData.boxProp.labelPos[2] && outerBoxSides[0])
                    labelMatchShortSide[1]++;
                  if (this.stackData.boxProp.labelPos[3] && outerBoxSides[1])
                    labelMatchLongSide[1]++;
                  break;
                case 3:
                  // For SSL boxes
                  if (this.stackData.boxProp.labelPos[0] && outerBoxSides[3])
                    labelMatchLongSide[1]++;
                  if (this.stackData.boxProp.labelPos[1] && outerBoxSides[0])
                    labelMatchShortSide[1]++;
                  if (this.stackData.boxProp.labelPos[2] && outerBoxSides[1])
                    labelMatchLongSide[1]++;
                  if (this.stackData.boxProp.labelPos[3] && outerBoxSides[2])
                    labelMatchShortSide[1]++;
                  break;
              }
              break;
          }

          linkPtr = pItems[j].parent;
        }
      }
    } while (linkPtr > -1);

    // Get the orientation that has most labels on the outside. If the orientations have the same amount of labels on the outside
    // preference is given to the long side labels
    let unitLabelOri = 0;

    if (
      labelMatchLongSide[0] + labelMatchShortSide[0] >
      labelMatchLongSide[1] + labelMatchShortSide[1]
    )
      unitLabelOri = 0;
    else if (
      labelMatchLongSide[0] + labelMatchShortSide[0] <
      labelMatchLongSide[1] + labelMatchShortSide[1]
    )
      unitLabelOri = 2;
    else {
      if (labelMatchLongSide[0] >= labelMatchLongSide[1]) unitLabelOri = 0;
      else if (labelMatchLongSide[0] < labelMatchLongSide[1]) unitLabelOri = 2;
    }
    // Correct for horizontal placed boxes. These use orientation 1 and 3 in stead of 0 and 2
    if (this.stackData.boxProp.pickLSL > 0 && pItem.boxOrient === 'H')
      unitLabelOri++;
    if (this.stackData.boxProp.pickSSL > 0 && pItem.boxOrient === 'V')
      unitLabelOri++;

    return unitLabelOri;
  }

  /** Perform approach angle calculations
   * @alias calcApproachAngle
   * @memberof ProjectBuilder
   * @param {number} pRef - Reference of the pattern [0:odd,1:even,2:top,3:temp]
   */
  calcApproachAngle(pRef, startCorner) {
    // Approach angles. Direction of motion from the number to the center of the box.
    //
    //        4       3       2
    //          \     |     /
    //             -------
    //            |       |
    //        5 - |       | - 1
    //  Y         |       |
    //  ^          -------
    //  |        /    |    \
    //  |     6       7      8
    //  |
    //  o------> X
    // Pallet origin

    // For ease of use copy elements
    let pItems = this.stackData.pItems[pRef];

    // The first box will always be placed straight down
    pItems[0].approachDir = 0;

    for (let i = 1; i < pItems.length; i++) {
      let xDir = 0;
      let yDir = 0;

      if (pItems[i].used) {
        for (let j = 0; j < i; j++) {
          // Check if an approach in X dir is required
          //   2  - Approach target is located in positive X direction
          //   -2 - Approach target is located in negative X direction
          if (xDir === 0) {
            switch (startCorner) {
              case 1:
                if (pItems[i].unitStartY < pItems[j].unitEndY) xDir = 2;
                break;
              case 2:
                if (pItems[i].unitStartY < pItems[j].unitEndY) xDir = -2;
                break;
              case 3:
                if (pItems[i].unitEndY > pItems[j].unitStartY) xDir = -2;
                break;
              case 4:
                if (pItems[i].unitEndY > pItems[j].unitStartY) xDir = 2;
                break;
            }
          }

          // Check if an approach in Y dir is required
          //   3  - Approach target is located in positive Y direction
          //   -3 - Approach target is located in negative Y direction
          if (yDir === 0) {
            switch (startCorner) {
              case 1:
                if (pItems[i].unitStartX < pItems[j].unitEndX) yDir = 3;
                break;
              case 2:
                if (pItems[i].unitEndX > pItems[j].unitStartX) yDir = 3;
                break;
              case 3:
                if (pItems[i].unitEndX > pItems[j].unitStartX) yDir = -3;
                break;
              case 4:
                if (pItems[i].unitStartX < pItems[j].unitEndX) yDir = -3;
                break;
            }
          }
        }

        // Convert X and Y approach direction indicators to an approach direction value
        switch (xDir + yDir) {
          case 2:
            pItems[i].approachDir = 1;
            break;
          case 5:
            pItems[i].approachDir = 2;
            break;
          case 3:
            pItems[i].approachDir = 3;
            break;
          case 1:
            pItems[i].approachDir = 4;
            break;
          case -2:
            pItems[i].approachDir = 5;
            break;
          case -5:
            pItems[i].approachDir = 6;
            break;
          case -3:
            pItems[i].approachDir = 7;
            break;
          case -1:
            pItems[i].approachDir = 8;
            break;
          default:
            pItems[i].approachDir = 0;
            break;
        }
      }
    }
  }
}
