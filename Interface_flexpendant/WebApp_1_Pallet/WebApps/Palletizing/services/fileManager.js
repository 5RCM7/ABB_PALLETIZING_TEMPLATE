import { palletizingFilesPath } from '../constants/common.js';

const FILES_DIRECTORY = palletizingFilesPath + `/`;
const FILES_DIRECTORY_LIB = 'Patterns';
const FILES_DIRECTORY_RECIPES = 'Recipes';
const FILES_DIRECTORY_TRANS = 'Languages';

export {
  FILES_DIRECTORY,
  FILES_DIRECTORY_LIB,
  FILES_DIRECTORY_RECIPES,
  FILES_DIRECTORY_TRANS,
};

const destPath = FILES_DIRECTORY;
/**
 * @class FileSystem
 * @classdesc File System Service contains static methods to interact with the file system.
 */
export default class FileSystem {
  /**
   * Get the content of a file.
   * @alias getFile
   * @memberof FileSystem
   * @static
   * @param {string} directoryPath - The path to the directory.
   * @param {string} fileName - The name of the file.
   * @returns {Promise<File>} - Returns a promise that resolves to a File object.
   */
  static async getFileContent(directoryPath, fileName) {
    return await API.FILESYSTEM.getFile(
      `${destPath}${directoryPath}`,
      fileName
    );
  }

  /**
   * Get the files from the directory.
   * @alias getFiles
   * @memberof FileSystem
   * @static
   * @param {string} directoryPath - The path to the directory.
   * @returns {Promise<DirectoryContents>} - Returns a promise that resolves to a DirectoryContents object.
   */
  static async getFiles(directoryPath) {
    return await API.FILESYSTEM.getDirectoryContents(
      `${destPath}${directoryPath}`
    );
  }

  /**
   * Delete the specified file.
   * @alias deleteFile
   * @memberof FileSystem
   * @static
   * @param {string} directoryPath - The path to the directory.
   * @param {string} fileName - The name of the file.
   * @returns {Promise<void>} - Returns a promise that resolves to void.
   */
  static async deleteFile(directoryPath, fileName) {
    return await API.FILESYSTEM.deleteFile(
      `${destPath}${directoryPath}`,
      fileName
    );
  }

  /**
   * Create a new file.
   * @alias createNewFile
   * @memberof FileSystem
   * @static
   * @param {string} directoryPath - The path to the directory.
   * @param {string} fileName - The name of the file.
   * @param {string} data - The data to write to the file.
   * @param {boolean} [overwrite=false] - Overwrite the file if it already exists.
   * @returns {Promise<void>} - Returns a promise that resolves to void.
   */
  static async createNewFile(directoryPath, fileName, data, overwrite = false) {
    return await API.FILESYSTEM.createNewFile(
      `${destPath}${directoryPath}`,
      fileName,
      data,
      overwrite
    );
  }

  /**
   * Copy file with the same folder with different name.
   * @alias copyToSameFolder
   * @memberof FileSystem
   * @static
   * @param {string} directoryPath - The path to the directory.
   * @param {string} sourceFile - The name of the source file.
   * @param {string} destinationFile - The name of the destination file.
   * @param {boolean} [overwrite=false] - Overwrite the file if it already exists.
   * @returns {Promise<void>} - Returns a promise that resolves to void.
   */
  static async copyToSameFolder(
    directoryPath,
    sourceFile,
    destinationFile,
    overwrite = false
  ) {
    return await API.FILESYSTEM.copy(
      `${destPath}${directoryPath}/${sourceFile}`,
      `${destPath}${directoryPath}/${destinationFile}`,
      overwrite
    );
  }

  /**
   * Rename the specified file.
   * @alias rename
   * @memberof FileSystem
   * @static
   * @param {string} directoryPath - The path to the directory.
   * @param {string} fileName - The name of the file.
   * @param {string} newName - The new name of the file.
   * @returns {Promise<void>} - Returns a promise that resolves to void.
   */
  static async rename(directoryPath, fileName, newName) {
    const file = await RWS.FileSystem.getFile(
      `${destPath}${directoryPath}/${fileName}`
    );
    return await file.rename(newName);
  }
}
