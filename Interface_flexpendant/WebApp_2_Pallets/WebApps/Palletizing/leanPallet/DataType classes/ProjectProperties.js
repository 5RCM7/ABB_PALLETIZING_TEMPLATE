import fs, { FILES_DIRECTORY_RECIPES } from '../../services/fileManager.js';
import { fetchData } from '../../services/dataManager.js';

/**
 * @class ProjectProperties
 * @classdesc Storing the project related data
 * @param {Object} stackData - Object containing the stack data
 */
export class ProjectProperties {
  constructor(stackData) {
    this.stackData = stackData;
    this.gripperName = null;
    this.gripperType = null;
    this.gripperWidth = null;
    //this.pickObjLoc = null;
    this.availablePickPos = null;
    this.maxPickLSL = null;
    this.maxPickSSL = null;
    this.recipeElements = [];
  }

  /**
   * Get gripper related data from the RAPID variables
   * @alias GetRAPIDdata
   * @memberof ProjectProperties
   */
  async GetRAPIDdata() {
    // Type of gripper
    const { value: gripType } = await fetchData('Settings', 'GripperType');
    this.gripperType = gripType;
    // Max pick long side linked
    const { value: maxLSL } = await fetchData('Settings', 'MaxLongSideLead');
    this.maxPickLSL = maxLSL;
    // Max pick short side linked
    const { value: maxSSL } = await fetchData('Settings', 'MaxShortSideLead');
    this.maxPickSSL = maxSSL;
    // Avaialable pick positions
    const { value: pickPos } = await fetchData('Settings', 'AvailablePickPos');
    this.availablePickPos = pickPos;
    // Gripper width
    const { value: gripperWidth } = await fetchData('Settings', 'GripperWidth');
    this.gripperWidth = gripperWidth;
  }

  /**
   * Get the project data and save it into the elements array
   * @alias loadProject
   * @memberof ProjectProperties
   */
  async loadProject() {
    // Get the avalaible patterns
    await this.stackData.libProp.init();
    // Get the list of files in the recipes directory
    const libDir = await fs.getFiles(FILES_DIRECTORY_RECIPES);
    let fileIndex = -1;
    this.recipeElements = [];
    for (const file of libDir.files) {
      // Get the filename without path and extension
      const fileName = file.replace(/\.[^/.]+$/, '');
      const extension = file.split('.').pop();

      // Check if the file is a project file
      if (extension == 'lpproj') {
        fileIndex++;
        // Add the file name to the list of elements
        this.recipeElements.push({ name: fileName });
        // Read the file content
        const fileContent = await fs.getFileContent(
          FILES_DIRECTORY_RECIPES,
          file
        );
        // Split the content into lines
        const lines = fileContent.split('\n');

        let bLength,
          bWidth,
          bHeight,
          bWeight,
          bLabel = [];
        let sslcnt, lslcnt;
        let pLength, pWidth, pHeight;
        let numberOfLayers, maxStackHeight;
        let sLength, sWidth, sThickness, sStackHeight;
        let stack = [];
        let slipSheet = [];
        let patternNames = [];
        let labelPos = [[], [], []];
        let formulas = {};
        let boxParents = {};
        for (const [lineIndex, line] of lines.entries()) {
          if (line.includes('PickLSL')) {
            lslcnt = parseInt(line.split(':')[1]);
          }
          if (line.includes('PickSSL')) {
            sslcnt = parseInt(line.split(':')[1]);
          }
          if (line.includes('BoxDim')) {
            if (line.includes('Length')) {
              bLength = line.split(':')[2];
            }
            if (line.includes('Width')) {
              bWidth = line.split(':')[2];
            }
            if (line.includes('Height')) {
              bHeight = line.split(':')[2];
            }
            if (line.includes('Weight')) {
              bWeight = line.split(':')[2];
            }
            if (line.includes('LongSideLead')) {
              lslcnt = parseInt(line.split(':')[2]);
            }
            if (line.includes('ShortSideLead')) {
              sslcnt = parseInt(line.split(':')[2]);
            }
          }
          if (line.includes('PalletDim')) {
            if (line.includes('Length')) {
              pLength = line.split(':')[2];
            }
            if (line.includes('Width')) {
              pWidth = line.split(':')[2];
            }
            if (line.includes('Height')) {
              pHeight = line.split(':')[2];
            }
          }
          if (line.includes('LabelPos')) {
            if (line.split(':')[2] === 'true') {
              bLabel.push(true);
            } else {
              bLabel.push(false);
            }
          }
          if (line.includes('NumberOfLayers')) {
            numberOfLayers = line.split(':')[1];
          }
          if (line.includes('MaxStackHeight')) {
            maxStackHeight = line.split(':')[1];
          }
          for (let i = 0; i < parseInt(numberOfLayers); i++) {
            if (line.includes(`LayerCfg:${i} `)) {
              stack.push(line.split(':')[2].trim());
            }
          }
          if (line.includes('SlipSheetDim')) {
            if (line.includes('Length')) {
              sLength = line.split(':')[2];
            }
            if (line.includes('Width')) {
              sWidth = line.split(':')[2];
            }
            if (line.includes('Thickness')) {
              sThickness = line.split(':')[2];
            }
            if (line.includes('StackHeight')) {
              sStackHeight = line.split(':')[2];
            }
          }
          if (line.includes('SlipSheet:')) {
            const ID = parseInt(line.split(':')[1][0]);
            slipSheet[ID] = parseInt(line.split(':')[2]);
          }
          for (let i = 0; i < 3; i++) {
            if (line.includes(`PRef:${i}`)) {
              if (line.includes('Name')) {
                patternNames.push(line.split(':')[2].trim());
              }
            }
          }
          if (line.includes('PRef:0')) {
            if (line.includes('Cor:1')) {
              const ID = parseInt(line.split(':')[8].trim().split(' ')[0]);
              labelPos[0][ID] = parseInt(line.split(':')[6][0]);
            }
          }
          if (line.includes('PRef:1')) {
            if (line.includes('Cor:1')) {
              const ID = parseInt(line.split(':')[8].trim().split(' ')[0]);
              labelPos[1][ID] = parseInt(line.split(':')[6][0]);
            }
          }
          if (line.includes('PRef:2')) {
            if (line.includes('Cor:1')) {
              const ID = parseInt(line.split(':')[8].trim().split(' ')[0]);
              labelPos[2][ID] = parseInt(line.split(':')[6][0]);
            }
          }
          if (
            line.includes('PRef:') &&
            line.includes('Cor:') &&
            line.includes('F:')
          ) {
            const pref = line.match(/PRef:(\d+)/)[1];
            const cor = line.match(/Cor:(\d+)/)[1];
            const formula = line.split('F:')[1].trim().split(' ')[0];
            let parent = parseInt(line.split('Par:')[1].trim().split(' ')[0]);

            if (!formulas[pref]) {
              formulas[pref] = {};
              boxParents[pref] = {};
            }
            if (!formulas[pref][cor]) {
              formulas[pref][cor] = [];
              boxParents[pref][cor] = [];
            }

            formulas[pref][cor].push(formula);

            // Find the pattern object with the matching name.
            const pattern = this.stackData.libProp.libPatternProp.find(
              (p) => p.name === patternNames[pref]
            );

            if (parent !== -1 && pattern) {
              const patternForm = pattern.nodes[parent];
              parent = formulas[pref][cor].indexOf(patternForm);
            }
            boxParents[pref][cor].push(parent + 1);
          }
        }
        // Set the odd,even,top layer patterns
        let patternIndexes = [];
        const allPatternNames = this.stackData.libProp.libPatternProp.map(
          (e) => e.name
        );
        const odd = allPatternNames.indexOf(patternNames[0]);
        const even = allPatternNames.indexOf(patternNames[1]);
        const top = allPatternNames.indexOf(patternNames[2]);
        patternIndexes = top !== -1 ? [odd, even, top] : [odd, even];

        const layerBoxCnt = stack.map((layer) => {
          const pattern = this.stackData.libProp.libPatternProp.find(
            (pattern) => pattern.name === layer
          );
          return pattern ? pattern.count : 0;
        });

        // Save the parsed data into elements array
        this.recipeElements[fileIndex].box = {
          length: bLength,
          width: bWidth,
          height: bHeight,
          weight: bWeight,
          lslCnt: lslcnt,
          sslCnt: sslcnt,
          label: bLabel,
        };
        this.recipeElements[fileIndex].pallet = {
          type: '',
          length: pLength,
          width: pWidth,
          height: pHeight,
        };
        this.recipeElements[fileIndex].slsheet = {
          length: sLength,
          width: sWidth,
          thickness: sThickness,
          stackHeight: sStackHeight,
        };
        this.recipeElements[fileIndex].pattern = {
          indexes: patternIndexes,
          labelPos: labelPos,
        };
        this.recipeElements[fileIndex].stack = {
          layers: stack,
          layerBoxCnt: layerBoxCnt,
          maxHeight: maxStackHeight,
          layerNr: numberOfLayers,
          slipSheet: slipSheet,
          formulas: formulas,
          boxParents: boxParents,
        };
      }
    }
  }
}
