import fs, { FILES_DIRECTORY_LIB } from '../../services/fileManager.js';

/**
 * @class LibraryProperties
 * @classdesc Class for holding the pattern libraries datas
 */
export class LibraryProperties {
  constructor() {
    this.libPatternProp = [];
  }

  async onInit() {
    await this.init();
  }

  /**
   * Read the pattern formulas and names and store it
   * @memberof LibraryProperties
   * @alias init
   */
  async init() {
    const libDir = await fs.getFiles(FILES_DIRECTORY_LIB);

    for (const [fileIndex, file] of libDir.files.entries()) {
      // Get the filename without path and extension, to be used as pattern name
      const name = file.replace(/\.[^/.]+$/, '');

      const content = await this.readPatternLibFile(FILES_DIRECTORY_LIB, file);

      // Read the formulas from the pattern library (JSON format)
      const nodeList = [];
      content.PatternDefinition.forEach((bd) => {
        nodeList.push(
          `${bd.BoxOrient};${bd.BoxXFormula ? bd.BoxXFormula : ''};${
            bd.BoxYFormula ? bd.BoxYFormula : ''
          };${bd.BoxGroup ? bd.BoxGroup : ''}`
        );
      });

      this.libPatternProp[fileIndex] = {
        name: name,
        nodes: nodeList,
        count: nodeList.length,
        group: '',
      };
    }
  }

  /**
   * Read the specific file content and return in JSON form
   * @param {string} path - path of the file to read
   * @param {string} fileName - name of the file to read
   * @returns {object} - Object containing the formulas
   */
  async readPatternLibFile(path, fileName) {
    return JSON.parse(await fs.getFileContent(path, fileName));
  }

  /**
   * Get the pattern name from the specific index
   * @param {number} fileIndex - the desired file index
   * @returns {string} - the name of the file
   */
  getPatternLibName(fileIndex) {
    return this.libPatternProp[fileIndex].name;
  }

  /**
   * Get the formulas from the specific file
   * @param {number} fileIndex - the desired file index
   * @returns {object} - The formulas that part of the specific pattern
   */
  getPatternLibFormulas(fileIndex) {
    if (this.libPatternProp && this.libPatternProp[fileIndex]) {
      return this.libPatternProp[fileIndex].nodes;
    }
    return '';
  }

  /**
   * Get the file index from the specific name
   * @param {string} fileName - name of the files
   * @returns {number} - The index of the file in the library
   */
  getPatternIndex(fileName) {
    return this.libPatternProp.findIndex(
      (element) => element.name === fileName
    );
  }

  /**
   * Count the number of formulas(boxes) in the pattern
   * @param {number} fileIndex - the desired file index
   * @returns {number} - Number of formulas(boxes) in the pattern
   */
  getPatternItemCount(fileIndex) {
    return this.libPatternProp[fileIndex].length;
  }
}
