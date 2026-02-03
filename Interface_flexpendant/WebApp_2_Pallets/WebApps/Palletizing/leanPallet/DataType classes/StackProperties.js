import { layerTypes } from '../../constants/common.js';

/**
 * @class StackProperties
 * @classdesc Storing the stack related data
 */
export class StackProperties {
  // Setup references to the outer class
  constructor() {
    this.stackConfigData = [];
    this.slipSheetData = [];
    this.nrOfLayers = 0;
  }

  /**
   * Clears the stack and slipsheet configuration
   * @alias clear
   * @memberof StackProperties
   */
  clear() {
    // Clear all data
    this.stackConfigData = [];
    this.slipSheetData = [];
    this.nrOfLayers = 0;
  }

  /**
   * Set/add a stack or slipsheet to the configuration
   * @alias set
   * @memberof StackProperties
   * @param {string} layerType - Type of layer
   * @param {number} layerRef - Reference to the layer
   * @param {string} layerName - Name of the layer
   */
  set(layerType, layerRef, layerName) {
    switch (layerType) {
      case layerTypes.pattern:
        this.stackConfigData[layerRef - 1] = layerName;
        this.nrOfLayers = this.count();
        break;

      // Slipsheets
      case layerTypes.slipSheet:
        if (this.slipSheetData.indexOf(layerRef) < 0)
          this.slipSheetData.push(layerRef);
        this.slipSheetData.sort((a, b) => {
          return a - b;
        });
        break;

      default:
        console.log('set: incorrect layer type selection ');
    }
  }

  /**
   * Get a stack or slipsheet configuration
   * @alias get
   * @memberof StackProperties
   * @param {string} layerType - Type of layer
   * @param {number} layerRef - Reference to the layer
   * @returns {string|boolean} - Name of the layer or true/false for slipsheets
   */
  get(layerType, layerRef) {
    switch (layerType) {
      // Patterns
      case layerTypes.pattern:
        return this.stackConfigData[layerRef];
      // Slipsheets
      case layerTypes.slipSheet:
        return this.slipSheetData.indexOf(layerRef) >= 0;
      default:
        console.log('get: incorrect layer type selection ');
    }
  }

  /**
   * Get all stack or slipsheet configurations
   * @alias getAll
   * @memberof StackProperties
   * @param {string} layerType - Type of layer
   * @returns {string[]|number[]} - Array with all layer names or slipsheet indexes
   */
  getAll(layerType) {
    switch (layerType) {
      // Patterns
      case layerTypes.pattern:
        return this.stackConfigData;
      // Slipsheets
      case layerTypes.slipSheet:
        return this.slipSheetData;
      default:
        console.log('getAll: incorrect layer type selection ');
    }
    return null;
  }

  /**
   * Update the slipsheet configuration
   * @alias update
   * @memberof StackProperties
   */
  update() {
    // Update the list with slipsheets. Slipsheets with a higher layer number then the top layer + 1 will be removed
    let i = 0;
    while (i < this.slipSheetData.length) {
      if (this.slipSheetData[i] > this.stackConfigData.length)
        this.slipSheetData.splice(i, 1);
      else i++;
    }
  }

  /**
   * Removes a pattern or slipsheet configuration from the stack
   * @param {string} layerType - Type of layer
   * @param {number} layerRef  - Reference to the layer
   * @returns
   */
  remove(layerType, layerRef) {
    switch (layerType) {
      // Patterns
      case layerTypes.pattern:
        if (this.count() === 1) {
          this.clear();
          return;
        }

        this.stackConfigData.splice(layerRef - 1, 1);
        this.nrOfLayers = this.count();
        this.update();
        break;
      // Slipsheets
      case layerTypes.slipSheet:
        if (
          this.slipSheetData[0] === layerRef &&
          this.slipSheetData.length === 1
        ) {
          this.slipSheetData = [];
          return;
        }

        let index = this.slipSheetData.indexOf(layerRef);
        if (index >= 0) this.slipSheetData.splice(index, 1);
        break;

      default:
        console.log('remove: incorrect layer type selection ');
    }
  }

  /**
   * Insert a stack configuration
   * @param {string} layerType - Type of layer
   * @param {number} layerRef - Reference to the layer
   * @param {string} layerName - Name of the layer
   */
  insert(layerType, layerRef, layerName) {
    switch (layerType) {
      // Patterns
      case layerTypes.pattern:
        if (this.count() <= 0) this.stackConfigData[layerRef] = layerName;
        else this.stackConfigData.splice(layerRef, 0, layerName);

        this.nrOfLayers = this.count();
        break;
      // Slipsheets
      case layerTypes.slipSheet:
        this.set(layerTypes.slipSheet, layerRef);
        break;
      default:
        console.log('insert: incorrect layer type selection ');
    }
  }

  /**
   * Swap two pattern / slipsheet configurations
   * @param {string} layerType - Type of layer
   * @param {number} layerRef - Reference to the layer
   * @param {number} withLayerRef - Reference to the layer to swap with
   */
  swap(layerType, layerRef, withLayerRef) {
    switch (layerType) {
      // Patterns
      case layerTypes.pattern:
        layerRef--;
        withLayerRef--;
        if (
          layerRef < 0 ||
          withLayerRef < 0 ||
          layerRef >= this.count() ||
          withLayerRef >= this.count()
        )
          return;

        [this.stackConfigData[layerRef], this.stackConfigData[withLayerRef]] = [
          this.stackConfigData[withLayerRef],
          this.stackConfigData[layerRef],
        ];
        break;
      // Slipsheets
      case layerTypes.slipSheet:
        if (
          layerRef < 0 ||
          withLayerRef < 0 ||
          layerRef > this.count() ||
          withLayerRef > this.count() ||
          this.slipSheetData.indexOf(layerRef) < 0
        )
          return;

        if (this.slipSheetData.indexOf(withLayerRef) >= 0)
          this.remove(layerTypes.slipSheet, layerRef);
        else
          this.slipSheetData[this.slipSheetData.indexOf(layerRef)] =
            withLayerRef;
        break;
      default:
        console.log('swap: incorrect layer type selection ');
    }
  }

  /**
   * Get the number of layers in the stack
   * @returns {number} - Number of layers in the stack
   */
  count() {
    return this.stackConfigData.length;
  }

  /**
   * Calculate the default layer configuration
   * @param {class} boxProperties - Box properties
   * @param {class} palletProperties - Pallet properties
   * @param {string[]} patternNames - Pattern names
   */
  calcDefaultStackConfig(boxProperties, palletProperties, patternNames) {
    this.stackConfigData = [];

    // Calculate the amount of layers for the project
    this.nrOfLayers = Math.floor(
      (palletProperties.fullHeight - palletProperties.height) /
        boxProperties.height
    );

    for (let i = 0; i < this.nrOfLayers; i++) {
      // A top layer will only be used for the last layer on the stack. If there is no pattern name set for
      // odd and even layers the entire stack will be filled with top pattern names
      if (
        (i === this.nrOfLayers - 1 ||
          (patternNames[0] === '' && patternNames[1] === '')) &&
        patternNames[2] !== undefined
      ) {
        this.stackConfigData.push(patternNames[2]);
      } else {
        // The stack will be filled with alternating odd and even layers. If only a pattern name for an odd or even layer is
        // specified the stack is filled with the specified pattern name.
        if ((i % 2 === 0 && patternNames[0] !== '') || patternNames[1] === '') {
          this.stackConfigData.push(patternNames[0]);
        } else {
          this.stackConfigData.push(patternNames[1]);
        }
      }
    }
  }
}
