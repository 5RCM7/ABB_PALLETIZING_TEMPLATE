import PatternBuilder from './patternBuilder.js';
import { stackData } from '../../leanPallet/StackData.js';
import {
  FILES_DIRECTORY,
  FILES_DIRECTORY_LIB,
} from '../../services/fileManager.js';
import { l } from '../../services/translation.js';
import RecipeManager from '../components/recipeManager.js';

/**
 * @class PatternBuilderView
 * @classdesc This class is responsible for rendering the pattern builder subview
 * @extends TComponents.Component_A
 * @memberof App
 * @param {HTMLElement} parent - The parent element to which the view will be rendered
 * @param {Object} props - The properties object to be passed to the view
 */
export default class PatternBuilderView extends TComponents.Component_A {
  constructor(parent, props = {}) {
    super(parent, props);

    this.directory = `${FILES_DIRECTORY}${FILES_DIRECTORY_LIB}`;
  }

  /**
   * Returns an object with expected input properties together with their initial value.
   * Every child class shall have a {@link defaultProps} to register its corresponding input properties.
   * @alias defaultProps
   * @memberof PatternBuilderView
   * @protected
   * @returns {object}
   */
  defaultProps() {
    return {
      changeHamView: () => {},
    };
  }

  async onInit() {
    // Load the existing projects from the folder
    await stackData.libProp.init();
  }

  /**
   * Contains all synchronous operations/setups that may be required for any sub-component after its initialization and/or manipulation of the DOM.
   * This method is called internally during rendering process orchestrated by {@link render() render}.
   * Create a list of patterns with edit, copy and delete buttons.
   * @alias onRender
   * @memberof PatternBuilderView
   */
  async onRender() {
    try {
      // Load the existing projects from the folder
      await stackData.libProp.init();
      // Event for close button
      this.child.patternBuilder.child.closeBtn.onClick(() => this.cbOnClose());
    } catch (error) {
      TComponents.Popup_A.error(error);
    }
  }

  /**
   * Instantiation of PatternBuilderView sub-components that shall be initialized in a synchronous way.
   * All this components are then accessible within {@link onRender() onRender} method by using this.child.<component-instance>
   * Pattern builder manager and add button to create new pattern
   * @alias mapComponents
   * @memberof PatternBuilderView
   * @returns {object} Contains all child PatternBuilderView instances used within the component.
   */
  mapComponents() {
    const patternBuilder = new PatternBuilder(this.find('.config-content'), {
      onSave: this.cbOnSave.bind(this),
    });

    const recipeMng = new RecipeManager(this.find('.pattern-builder-view'), {
      title: `Palletizing | ${l.trans('com.design')}`,
      header1: l.trans('com.patt'),
      header2: l.trans('com.act'),
      content: patternBuilder,
      directory: this.directory,
      extension: 'json',
      onChange: this.cbOnChange.bind(this),
      onEdit: this.cbOnEdit.bind(this),
      elements: stackData.libProp.libPatternProp.map((element) => element.name),
    });

    return {
      patternBuilder,
      recipeMng,
    };
  }

  /**
   * Generates the HTML definition corresponding to the component.
   * html elements for different components in the layout
   * @alias markup
   * @memberof PatternBuilderView
   * @returns {string}
   */
  markup() {
    return /*html*/ ` 
          <div class="pattern-builder-view"></div>
      `;
  }

  async cbOnSave() {
    await stackData.libProp.init();
    this.child.recipeMng.elements = stackData.libProp.libPatternProp.map(
      (element) => element.name
    );

    this.props.changeHamView(l.trans('com.conf'));
  }

  /**
   * Handles changes to elements based on the specified action.
   *
   * @param {string} elementName - The name of the element to be processed.
   * @param {string} action - The action to be performed. Can be 'add', 'copy', or 'delete'.
   * @param {string} oldName - The old name of the element to be processed (not used yet).
   * @returns {Promise<void>} A promise that resolves when the action is complete.
   */
  async cbOnChange(elementName, action) {
    switch (action) {
      case 'add':
        this.child.patternBuilder.patternName = elementName;
        break;
      case 'rename':
      case 'copy':
        await stackData.libProp.init();
        this.child.recipeMng.elements = stackData.libProp.libPatternProp.map(
          (element) => element.name
        );
        break;
      case 'delete':
        // find in stackData and delete
        const index = stackData.libProp.libPatternProp.findIndex(
          (element) => element.name === elementName
        );
        stackData.libProp.libPatternProp.splice(index, 1);
      default:
        break;
    }
    this.child.patternBuilder.patternName = elementName;
  }

  /**
   * Render the configuration elements
   * @alias cbOnEdit
   * @memberof PatternBuilderView
   */
  cbOnEdit(action) {
    // Save the pattern name in the patternBuilder
    this.child.patternBuilder.patternName = stackData.libProp.libPatternProp[
      this.child.recipeMng.elementIndex
    ]
      ? stackData.libProp.libPatternProp[this.child.recipeMng.elementIndex].name
      : '';

    // Initialize the values of the configuration elements or edit the values in case of edit
    if (action === 'add') {
      this.initializeValues();
    } else if (action === 'edit') {
      this.updateValues();
    }
  }

  cbOnClose() {
    TComponents.Popup_A.confirm(
      l.trans('com.close_popup')[0],
      l.trans('com.close_popup').slice(1, 3),
      async (action) => {
        if (action !== 'ok') return;
        await this.confirmCloseConfig();
      }
    );
  }

  /**
   * Close the configuration page in case of confirmation
   * @alias confirmCloseConfig
   * @memberof PatternBuilderView
   */
  async confirmCloseConfig() {
    // In case of adding new pattern, delete the elements from the list
    if (this.child.recipeMng.action === 'add') {
      stackData.libProp.libPatternProp.splice(
        this.child.recipeMng.elementIndex,
        1
      );

      await this.child.recipeMng.removeActiveElement();
    } else {
      // just rerender the manager view
      this.child.recipeMng.renderRecipeList();
    }
  }

  /**
   * Set the default values of the configuration elements
   * @alias initializeValues
   * @memberof PatternBuilderView
   */
  initializeValues() {
    stackData.pItems[3] = [];
    this.child.patternBuilder.updateStackData(stackData);
  }

  /**
   * Set the desired values in case of edit
   * @alias updateValues
   * @memberof PatternBuilderView
   */
  updateValues() {
    this.child.patternBuilder.updateStackData(stackData);
    this.child.patternBuilder.renderLoadedPattern(
      this.child.recipeMng.elementIndex
    );
  }
}
