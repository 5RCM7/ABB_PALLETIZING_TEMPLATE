import { palletizingFilesPath, setupFile } from '../constants/common.js';

export class Utils {
  static async getSetup() {
    const path = palletizingFilesPath;
    const files = await API.FILESYSTEM.getDirectoryContents(path);
    let setupCont = {};

    if (files.files.length > 0 && files.files.includes(setupFile)) {
      setupCont = JSON.parse(await API.FILESYSTEM.getFile(path, setupFile));
    }
    return setupCont;
  }

  static async setSetup(setupContent = {}) {
    const path = palletizingFilesPath;

    if (Object.keys(setupContent).length === 0) {
      return;
    }

    const setupCont = JSON.stringify(setupContent);
    await API.FILESYSTEM.createNewFile(path, setupFile, setupCont, true);
  }
}
