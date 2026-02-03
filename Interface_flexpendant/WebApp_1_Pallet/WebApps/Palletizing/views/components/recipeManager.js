import { imgEdit, imgCopy, imgDel } from '../../constants/images.js';
import { l } from '../../services/translation.js';

/**
 * @class RecipeManager
 * @classdesc This class is responsible for rendering the configuration subview
 * @extends TComponents.Component_A
 * @memberof RecipeManager
 * @param {HTMLElement} parent - The parent element to which the view will be rendered
 * @param {Object} props - The properties object to be passed to the view
 */
export default class RecipeManager extends TComponents.Component_A {
  constructor(parent, props = {}) {
    super(parent, props);
    this._elements = [];
  }

  /**
   * Returns an object with expected input properties together with their initial value.
   * Every child class shall have a {@link defaultProps} to register its corresponding input properties.
   * @alias defaultProps
   * @memberof RecipeManager
   * @protected
   * @returns {object}
   */
  defaultProps() {
    return {
      title: 'Recipe Manager',
      header1: 'Recipe Name',
      header2: 'Actions',
      content: null,
      directory: '$HOME/Recipes/',
      extension: 'rcp',
      onChange: null,
      onEdit: null,
      elements: [],
    };
  }

  onInit() {
    this._props.extension = this._props.extension.replace(/^\./, '');

    if (this._props.onChange) this.on('change', this._props.onChange);
    if (this._props.onEdit) this.on('edit', this._props.onEdit);
  }

  /**
   * Instantiation of RecipeManager sub-components that shall be initialized in a synchronous way.
   * All this components are then accessible within {@link onRender() onRender} method by using this.child.<component-instance>
   * Create a multi step container for Box, Pallet, Slipsheet, Pattern and Stack configuration.
   * @alias mapComponents
   * @memberof RecipeManager
   * @returns {object} Contains all child RecipeManager instances used within the component.
   */
  mapComponents() {
    const addBtn = new TComponents.Button_A(this.find('.add-button'), {
      text: l.trans('com.create'),
      onClick: () => this.cbOnAdd(),
    });

    const contentContainer = this.find('.config-content');
    if (contentContainer && this._props.content) {
      if (this._props.content instanceof TComponents.Component_A) {
        this._props.content.attachToElement(contentContainer);
      } else if (Component_A._isHTMLElement(this._props.content)) {
        if (!contentContainer.contains(this._props.content)) {
          contentContainer.innerHTML = '';
          contentContainer.appendChild(this._props.content);
        }
      }
    }

    return {
      addBtn,
      content: this._props.content,
    };
  }

  /**
   * Contains all synchronous operations/setups that may be required for any sub-component after its initialization and/or manipulation of the DOM.
   * This method is called internally during rendering process orchestrated by {@link render() render}.
   * Create a button for adding new product and a list of products with edit, copy and delete buttons.
   * @alias onRender
   * @memberof RecipeManager
   */
  async onRender() {
    this._elements = this._props.elements;

    try {
      // Render product list
      this.renderRecipeList();
    } catch (error) {
      TComponents.Popup_A.error(error);
    }
  }

  /**
   * Generates the HTML definition corresponding to the component.
   * html elements for different components in the layout
   * @alias markup
   * @memberof RecipeManager
   * @returns {string}
   */
  markup() {
    return /*html*/ ` 
          <div class="title my-4 pl-5">${this._props.title}
            <span class="title-recipe-name"></span>
          </div>
          <div class="manage-content">
            <div class="add-cont my-4">
              <div class="add-button"></div>
            </div>
            <div class="header-cont">
              <div>${this._props.header1.toUpperCase()}</div>
              <div>${this._props.header2.toUpperCase()}</div>
            </div>
            <div class="element-list"></div>
          </div>
          <div class="config-content"></div>
      `;
  }

  /**
   * Add button click method. Add a new product to the list of products
   * @alias cbOnAdd
   * @memberof RecipeManager
   */
  cbOnAdd() {
    this._action = 'add';
    fpComponentsKeyboardShow(
      (inputText) => {
        if (inputText != null) {
          this._elements.unshift(inputText);
          this._elementIndex = 0;
          this.renderContent();
          this.trigger('change', inputText, 'add');
        }
      },
      null,
      this._props.header1,
      null,
      null,
      (value) => {
        //Check if the recipe name already exists and not empty string
        return (
          this._elements.every((element) => element !== value) && value !== ''
        );
      }
    );
  }

  /**
   * Change the content of the view between manage and config
   * @alias changeContent
   * @memberof RecipeManager
   */
  changeContent(page) {
    const manageContent = this.find('.manage-content');
    const setupContent = this.find('.config-content');
    const isManagePage = page === 'manage';

    manageContent.style.display = isManagePage ? 'block' : 'none';
    setupContent.style.display = isManagePage ? 'none' : 'block';

    if (!isManagePage) this.trigger('edit', this._action);
  }

  /**
   * Render the configuration elements
   * @alias renderContent
   * @memberof RecipeManager
   */
  renderContent() {
    this.find('.title-recipe-name').innerText = `| ${
      this._elements[this._elementIndex]
    }`;
    // Change the content of the view
    this.changeContent('config');
  }

  /**
   * Render the list of products
   * @alias renderRecipeList
   * @memberof RecipeManager
   */
  renderRecipeList() {
    this.find('.title-recipe-name').innerText = '';
    this.changeContent('manage');
    const elementList = this.find('.element-list');
    // Fixed height and scroll for the list of products
    elementList.style.height = '416px';
    elementList.style.overflow = 'auto';
    // Clear the list of products and read it from elements
    elementList.innerHTML = '';

    const handleTitleChange = async (inputText, index) => {
      const oldName = this._elements[index];
      const fileName = `${oldName}.${this._props.extension}`;
      this._elements[index] = inputText;
      await RecipeManager.rename(
        this._props.directory,
        fileName,
        `${inputText}.${this._props.extension}`
      );

      this.trigger('change', inputText, 'rename', oldName);
    };

    const handleEditClick = (index) => {
      this._action = 'edit';
      this._elementIndex = index;
      this.renderContent();
    };

    const handleCopyClick = async (index) => {
      const baseName = this._elements[index];

      // Generate an unused copy name
      const getNextCopyName = (name) => {
        let count = 1;
        let newName = `${name}_Copy`;
        while (this._elements.includes(newName)) {
          count++;
          newName = `${name}_Copy_${count}`;
        }
        return newName;
      };
      const suggestedName = getNextCopyName(baseName);

      fpComponentsKeyboardShow(
        async (inputText) => {
          if (inputText != null) {
            try {
              await RecipeManager.copyToSameFolder(
                this._props.directory,
                `${this._elements[index]}.${this._props.extension}`,
                `${inputText}.${this._props.extension}`
              );
              this._elements.push(inputText);
              this.trigger('change', inputText, 'copy', baseName);
              this.renderRecipeList();
            } catch (e) {
              TComponents.Popup_A.warning(
                this._props.title,
                `${inputText} already exists. Please choose another name.`
              );
            }
          }
        },
        suggestedName,
        this._props.header1,
        null,
        null,
        (value) => {
          //Check if the recipe name already exists and not empty string
          return (
            this._elements.every((element) => element !== value) && value !== ''
          );
        }
      );
    };

    const handleDeleteClick = (index) => {
      TComponents.Popup_A.confirm(
        l.trans('com.del_popup')[0],
        [
          l.trans('com.del_popup', { var1: this._elements[index] })[1],
          l.trans('com.del_popup')[2],
        ],
        async (action) => {
          if (action !== 'ok') return;
          await this.removeElement(index);
        }
      );
    };

    this._elements.forEach((element, index) => {
      const contentDiv = document.createElement('div');
      contentDiv.classList.add('element-cont');
      contentDiv.innerHTML = `
          <div class="elem-title pl-4"></div>
          <div class="ctrl-buttons flex items-end">
            <div class="edit-button"></div>
            <div class="copy-button"></div>
            <div class="delete-button"></div>
          </div>
        `;
      elementList.appendChild(contentDiv);

      this.titleInp = new FPComponents.Input_A();
      this.titleInp.text = element;
      this.titleInp.onchange = (inputText) =>
        handleTitleChange(inputText, index);
      this.titleInp.validator = (value) => {
        const elements = this._elements.filter((el, i) => i !== index);
        return elements.every((element) => element !== value) && value !== '';
      };
      this.titleInp.attachToElement(this.all('.elem-title')[index]);
      this.editBtn = new FPComponents.Button_A();
      this.editBtn.icon = imgEdit;
      this.editBtn.onclick = () => handleEditClick(index);
      this.editBtn.attachToElement(this.all('.edit-button')[index]);
      this.copyBtn = new FPComponents.Button_A();
      this.copyBtn.icon = imgCopy;
      this.copyBtn.onclick = () => handleCopyClick(index);
      this.copyBtn.attachToElement(this.all('.copy-button')[index]);
      this.delBtn = new FPComponents.Button_A();
      this.delBtn.icon = imgDel;
      this.delBtn.onclick = () => handleDeleteClick(index);
      this.delBtn.attachToElement(this.all('.delete-button')[index]);
    });
  }

  /**
   * Content of the modal window
   * @memberof RecipeManager
   */
  get content() {
    return this._props.content;
  }

  set content(content) {
    this.setProps({ content });
  }

  get action() {
    return this._action;
  }

  get elementIndex() {
    return this._elementIndex;
  }

  get activeElement() {
    return this._elements[this._elementIndex];
  }

  get elements() {
    // create a copy of the elements array to return
    return [...this._elements];
  }

  set elements(elements) {
    this.setProps({ elements });
  }

  async removeElement(index) {
    const elements = this.elements;
    elements.splice(index, 1);

    //check if corresponding file is existing and delete it
    const elementName = this._elements[index];
    const fileName = `${elementName}.${this._props.extension}`;
    const exists = await RecipeManager.deleteIfExists(
      this._props.directory,
      fileName
    );
    if (exists) {
      this.trigger('change', elementName, 'delete');
    }

    this.setProps({ elements });
  }

  async removeActiveElement() {
    await this.removeElement(this._elementIndex);
  }

  /**
   * Rename the specified file.
   * @alias rename
   * @memberof RecipeManager
   * @static
   * @param {string} directoryPath - The path to the directory.
   * @param {string} fileName - The name of the file.
   * @param {string} newName - The new name of the file.
   * @returns {Promise<void>} - Returns a promise that resolves to void.
   */
  static async rename(directoryPath, fileName, newName) {
    const file = await RWS.FileSystem.getFile(`${directoryPath}/${fileName}`);
    return await file.rename(newName);
  }

  static async copyToSameFolder(
    directoryPath,
    sourceFile,
    destinationFile,
    overwrite = false
  ) {
    return await API.FILESYSTEM.copy(
      `${directoryPath}/${sourceFile}`,
      `${directoryPath}/${destinationFile}`,
      overwrite
    );
  }

  static async deleteIfExists(directoryPath, filename) {
    const files = await API.FILESYSTEM.getDirectoryContents(directoryPath);
    if (files.files.includes(filename)) {
      await API.FILESYSTEM.deleteFile(directoryPath, filename);
      return true;
    }
    return false;
  }
}

/**
 * Add css properties to the component
 * @alias loadCssClassFromString
 * @static
 * @param {string} css - The css string to be loaded into style tag
 * @memberof RecipeManager
 */
RecipeManager.loadCssClassFromString(/*css*/ `
  .add-cont {
    display: flex;
    justify-content: flex-end;
    padding-right:20px;
  }
  .add-button {
    width: 150px;
  }
  .manage-content {
    background-color: #fff;
    border-radius: 4px;
    padding: 0.5rem;
    margin: 0.5rem;
  }
  .config-content {
    display: none;
  }
  .header-cont {
    display: flex;
    justify-content: space-between;
    padding: 10px 50px 10px 20px;
    margin: 0 0.5rem;
    border: 1px solid #ccc;
    text-weight: bold;
    background-color: #fff;
  }
  .element-cont {
    display: flex;
    justify-content: space-between;
    padding: 0.25rem;
    border: 1px solid #ccc;
    margin-left: 0.5rem;
    margin-right: 0.5rem;
    background-color: #fff;
  }
  .element-cont .fp-components-input {
    border: none;
  }
  .element-cont .fp-components-button {
    min-width: 10px;
    margin-right: 0.5rem;
    padding: 0 0.75rem;
  }
  .element-cont .fp-components-button-icon {
    margin: 0;
    width: 16px;
    height: 16px;
  }
`);
