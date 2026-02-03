import { PatternCreation } from './PatternCreation.js';
import { LibraryProperties } from './DataType classes/LibrayProperties.js';
import { BoxProperties } from './DataType classes/BoxProperties.js';
import { PalletProperties } from './DataType classes/PalletProperties.js';
import { slSheetProperties } from './DataType classes/SlSheetProperties.js';
import { ProjectProperties } from './DataType classes/ProjectProperties.js';
import { StackProperties } from './DataType classes/StackProperties.js';
import { ProjectBuilder } from './ProjectBuilder.js';
import { StackHandler } from './StackHandler.js';

/**
 * @class StackData
 * @classdesc Class to handle all the stack Data
 */
export class StackData {
  constructor() {
    this.libProp = new LibraryProperties();
    this.boxProp = new BoxProperties();
    this.palletProp = new PalletProperties();
    this.stackProp = new StackProperties();
    this.slipSheetProp = new slSheetProperties();

    // Global variables

    // pSizes contains the size of the pattern in mm. This is a single dimension array.
    // Array element 0 = odd layers, 1 = even layers and 2 = top layer
    // Array element 3 is used for temporary patterns i.e. the patterns tos visualize in the UI
    this.pSizes = [];
    // pItems is a two dimensional array containg the properties for all items (boxes) in a pattern
    // The first dimension specifies the layer where 0 = odd layers, 1 = even layers and 2 = top layer
    // Array element 3 is used for temporary patterns i.e. the patterns tos visualize in the UI
    //
    // The second dimension contains the item properties for the specific layer
    this.pItems = [];
    // pName contains the names of the selected patterns
    // Array element 0 = odd layers, 1 = even layers and 2 = top layer
    // Array element 3 is used for temporary patterns i.e. the patterns tos visualize in the UI (not required for temp patterns)
    this.pNames = [];
  }
}
// Export stackData instance and do dependency injection
export const stackData = new StackData();
stackData.projectProp = new ProjectProperties(stackData);
stackData.patternCreation = new PatternCreation(stackData);
stackData.pBuilder = new ProjectBuilder(stackData);
stackData.stack = new StackHandler(stackData);
