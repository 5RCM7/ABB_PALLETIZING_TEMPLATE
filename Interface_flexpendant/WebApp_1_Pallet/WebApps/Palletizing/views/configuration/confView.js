import {
  imgLabelPosSSL,
  imgLabelPosLSL,
  setIcon,
  notSetIcon,
} from '../../constants/images.js';
import { palletTypes, checkInputRange } from '../../constants/common.js';
import BoxConfig from './boxConfig.js';
import PalletConfig from './palletConfig.js';
import SlSheetConfig from './slipSheetConfig.js';
import PatternConfig from './patternConfig.js';
import StackConfig from './stackConfig.js';
import Summary from './summary.js';
import MultiStep from '../components/multiStepWizard.js';
import { stackData } from '../../leanPallet/StackData.js';
import {
  FILES_DIRECTORY,
  FILES_DIRECTORY_RECIPES,
} from '../../services/fileManager.js';
import { l } from '../../services/translation.js';
import RecipeManager from '../components/recipeManager.js';

/**
 * @class ConfView
 * @classdesc This class is responsible for rendering the configuration subview
 * @extends TComponents.Component_A
 * @memberof App
 * @param {HTMLElement} parent - The parent element to which the view will be rendered
 * @param {Object} props - The properties object to be passed to the view
 */
export default class ConfView extends TComponents.Component_A {
  constructor(parent, props = {}) {
    super(parent, props);
    this.elements = [];
    this.directory = `${FILES_DIRECTORY}${FILES_DIRECTORY_RECIPES}`;
  }

  /**
   * Returns an object with expected input properties together with their initial value.
   * Every child class shall have a {@link defaultProps} to register its corresponding input properties.
   * @alias defaultProps
   * @memberof ConfView
   * @protected
   * @returns {object}
   */
  defaultProps() {
    return {
      changeHamView: () => {},
    };
  }

  async onInit() {
    await stackData.projectProp.loadProject();
    this.elements = stackData.projectProp.recipeElements;
  }

  /**
   * Instantiation of ConfView sub-components that shall be initialized in a synchronous way.
   * All this components are then accessible within {@link onRender() onRender} method by using this.child.<component-instance>
   * Create a multi step container for Box, Pallet, Slipsheet, Pattern and Stack configuration.
   * @alias mapComponents
   * @memberof ConfView
   * @returns {object} Contains all child ConfView instances used within the component.
   */
  mapComponents() {
    const stepContainer = new MultiStep(this.find('.config-content'), {
      views: [
        {
          name: l.trans('boxconf.title'),
          content: new BoxConfig(null),
          onNext: () => this.handleBoxPage(),
        },
        {
          name: l.trans('pallconf.title'),
          content: new PalletConfig(null),
          onNext: () => this.handlePalletPage(),
          onBack: () => {
            this.oldLabelStatus = this.getLabelStatus();
          },
        },
        {
          name: l.trans('slipconf.title'),
          content: new SlSheetConfig(null),
          onNext: () => this.handleSlipSheetpage(),
        },
        {
          name: l.trans('patternconf.title'),
          content: new PatternConfig(null, {
            changeHamView: this.props.changeHamView,
          }),
          onNext: () => this.handlePatternPage(),
        },
        {
          name: l.trans('stackconf.title'),
          content: new StackConfig(null),
          onNext: () => this.handleStackPage(),
        },
        {
          name: l.trans('summary.title'),
          content: new Summary(null),
          onNext: () => this.handleLastPage(),
        },
      ],
    });

    const recipeMng = new RecipeManager(this.find('.config-view'), {
      title: `Palletizing | ${l.trans('com.conf')}`,
      header1: l.trans('com.prod'),
      header2: l.trans('com.act'),
      content: stepContainer,
      directory: this.directory,
      extension: 'lpproj',
      onChange: this.cbOnChange.bind(this),
      onEdit: this.cbOnEdit.bind(this),
      elements: this.elements.map((element) => element.name),
    });

    return {
      stepContainer,
      recipeMng,
    };
  }

  /**
   * Contains all synchronous operations/setups that may be required for any sub-component after its initialization and/or manipulation of the DOM.
   * This method is called internally during rendering process orchestrated by {@link render() render}.
   * Create a button for adding new product and a list of products with edit, copy and delete buttons.
   * @alias onRender
   * @memberof ConfView
   */
  async onRender() {
    try {
      // Event for close button in multi step container
      this.child.stepContainer.child.closeBtn.onClick(() => this.cbOnClose());
    } catch (error) {
      TComponents.Popup_A.error(error);
    }
  }

  /**
   * Generates the HTML definition corresponding to the component.
   * html elements for different components in the layout
   * @alias markup
   * @memberof ConfView
   * @returns {string}
   */
  markup() {
    return /*html*/ ` 
        <div class="config-view"></div>
    `;
  }

  /**
   * Events when leaving the 1.(Box) and loading 2.(Pallet) page
   * @alias handleBoxPage
   * @memberof ConfView
   */
  handleBoxPage() {
    const boxPage = this.child.stepContainer.views[0].content;
    // Save the box properties
    stackData.boxProp.length = parseFloat(boxPage.child.lengthInput.text);
    stackData.boxProp.width = parseFloat(boxPage.child.widthInput.text);
    stackData.boxProp.height = parseFloat(boxPage.child.heightInput.text);
    stackData.boxProp.weight = parseFloat(boxPage.child.weightInput.text);
    stackData.boxProp.pickLSL = boxPage.lslead.checked
      ? parseInt(boxPage.child.boxCountInput.text)
      : 0;
    stackData.boxProp.pickSSL = boxPage.sslead.checked
      ? parseInt(boxPage.child.boxCountInput.text)
      : 0;
    stackData.boxProp.labelPos = [
      boxPage.frontL.checked,
      boxPage.leftL.checked,
      boxPage.backL.checked,
      boxPage.rightL.checked,
    ];
    //Check if the label status is changed
    if (this.oldLabelStatus !== this.getLabelStatus()) {
      this.resetLabel = true;
    } else {
      this.resetLabel = false;
    }
  }

  /**
   * Events when leaving the 2.(Pallet) and loading 3.(SlipSheet) page
   * @alias handlePalletPage
   * @memberof MultiStep
   */
  handlePalletPage() {
    const palletPage = this.child.stepContainer.views[1].content.child;
    const slipSheetPage = this.child.stepContainer.views[2].content;

    slipSheetPage.nextBtnEnable = this.child.stepContainer.nextBtnEnable.bind(
      this.child.stepContainer
    );
    this.child.stepContainer.nextBtnEnable(slipSheetPage.checkSlParam());
    // Save the pallet properties
    stackData.palletProp.length = parseFloat(palletPage.lengthInput.text);
    stackData.palletProp.width = parseFloat(palletPage.widthInput.text);
    stackData.palletProp.height = parseFloat(palletPage.heightInput.text);
  }

  /**
   * Events when leaving the 3.(SlipSheet) and loading 4.(Pattern) page
   * @alias handleSlipSheetpage
   * @memberof MultiStep
   */
  async handleSlipSheetpage() {
    const slipSheetPage = this.child.stepContainer.views[2].content.child;

    // Save the pallet properties
    stackData.slipSheetProp.length = parseFloat(slipSheetPage.lengthInput.text);
    stackData.slipSheetProp.width = parseFloat(slipSheetPage.widthInput.text);
    stackData.slipSheetProp.thickness = parseFloat(
      slipSheetPage.thicknessInput.text
    );
    stackData.slipSheetProp.stackHeight = parseFloat(
      slipSheetPage.stackHeightInput.text
    );

    this.preparePatternPage();
  }

  preparePatternPage() {
    const patternPage = this.child.stepContainer.views[3].content;

    patternPage.nextBtnEnable = this.child.stepContainer.nextBtnEnable.bind(
      this.child.stepContainer
    );

    //Calculate the box coordinates and render the pattern
    if (stackData.pItems.length != 0) {
      for (let i = 0; i < 3; i++) {
        if (stackData.pItems[i] != undefined) {
          stackData.patternCreation.calcPattern(i);
        }
      }
    }

    if (stackData.stack.patterns[0] != undefined) {
      patternPage.targetIndex = stackData.stack.patterns[0];
      patternPage.renderPatternList(0);
    } else {
      patternPage.targetIndex = 0;
      patternPage.renderPatternList();
    }

    // Enable or disable the delete button depending on the pattern is set or not
    for (let i = 0; i < 3; i++) {
      if (stackData.stack.patterns[i] != undefined) {
        patternPage.child.delBtn[i].enabled = true;
        patternPage.child.setBtn[i].icon = setIcon;
      } else {
        patternPage.child.delBtn[i].enabled = false;
        patternPage.child.setBtn[i].icon = notSetIcon;
      }
    }
    patternPage.checkPatternsValidity()
      ? this.child.stepContainer.nextBtnEnable(true)
      : this.child.stepContainer.nextBtnEnable(false);
    // Save the patterns array
    this.oldPatterns = [...stackData.stack.patterns];
    // Load the pattern list into the dropdown
    patternPage.child.patternDropdown.setProps({
      itemList: stackData.libProp.libPatternProp.map((item) => item.name),
    });
    // Call default label orientation if label config changed
    if (this.resetLabel) {
      for (let i = 0; i < 3; i++) {
        if (stackData.pItems[i] != undefined) {
          stackData.patternCreation.calcDefaultLabelOrient(i);
        }
      }
    }
  }

  /**
   * Events when leaving the 4.(Pattern) and loading 5.(Stack) page
   * @alias handlePatternPage
   * @memberof MultiStep
   */
  handlePatternPage() {
    const slipSheetPage = this.child.stepContainer.views[2].content;
    const patternPage = this.child.stepContainer.views[3].content;
    const stackPage = this.child.stepContainer.views[4].content;
    stackPage.nextBtnEnable = this.child.stepContainer.nextBtnEnable.bind(
      this.child.stepContainer
    );
    // Save if top pattern is defined
    stackPage.topPattern = patternPage.child.delBtn[2].enabled;
    // Set full height according to the layers
    stackData.palletProp.fullHeight =
      stackData.palletProp.height +
      stackData.boxProp.height * stackData.stackProp.nrOfLayers;
    // Initialize the stack and create the stack,pattern list
    stackData.stack.init();
    stackPage.createPatternList();
    // Set default config if pattern list changed
    for (let i = 0; i < this.oldPatterns.length; i++) {
      if (
        stackData.stack.patterns[i] !== this.oldPatterns[i] ||
        stackData.stack.patterns.length != this.oldPatterns.length
      ) {
        stackData.stackProp.calcDefaultStackConfig(
          stackData.boxProp,
          stackData.palletProp,
          stackData.pNames
        );
      }
    }
    // Show the add slip sheet button if the slip sheet is used
    stackPage.find('.addss-button').style.display = slipSheetPage.slSheetUsed
      .checked
      ? 'block'
      : 'none';
    // Save the patterns array and render the stack
    this.oldPatterns = [...stackData.stack.patterns];
    stackPage.createStack(0);
  }

  /**
   * Events when leaving the 5.(Stack) and loading 6.(Summary) page
   * @alias handleStackPage
   * @memberof MultiStep
   */
  handleStackPage() {
    const summaryPage = this.child.stepContainer.views[5].content;
    // Render the summary list
    summaryPage.createSummaryList();
  }

  /**
   * Events when leaving the 6.(Summary) and loading 1.(Box) page
   * @alias handleLastPage
   * @memberof MultiStep
   */
  handleLastPage() {
    // Save the configuration elements
    this.saveElements();
  }

  /**
   * Get the label status as a number representation
   * @alias getLabelStatus
   * @memberof ConfView
   * @returns {number}
   */
  getLabelStatus() {
    const boolToInt = (value) => {
      return value ? 1 : 0;
    };
    const boxPage = this.child.stepContainer.views[0].content;

    return (
      1 * boolToInt(boxPage.sslead.checked) +
      2 * boolToInt(boxPage.lslead.checked) +
      4 * boolToInt(boxPage.frontL.checked) +
      8 * boolToInt(boxPage.leftL.checked) +
      16 * boolToInt(boxPage.backL.checked) +
      32 * boolToInt(boxPage.rightL.checked)
    );
  }

  /**
   * Close multi step container.
   * @alias cbOnClose
   * @memberof ConfView
   */
  cbOnClose() {
    TComponents.Popup_A.confirm(
      l.trans('com.close_popup')[0],
      l.trans('com.close_popup').slice(1, 3),
      (action) => {
        if (action !== 'ok') return;
        this.confirmCloseConfig();
      }
    );
  }

  /**
   * Close the configuration page in case of confirmation
   * @alias confirmCloseConfig
   * @memberof ConfView
   */
  confirmCloseConfig() {
    // In case of adding new product, delete the elements from the list
    this.child.recipeMng.action === 'add'
      ? this.child.recipeMng.removeActiveElement()
      : this.child.recipeMng.renderRecipeList();
    // Set the config page back to default
    this.child.stepContainer.resetDefault();
  }

  /**
   * Save the configuration values of the product
   * @alias saveElements
   * @memberof ConfView
   */
  async saveElements() {
    const element = this.child.recipeMng.activeElement;

    // Save the project into .lpproj file
    await stackData.pBuilder.saveProject(element);

    await stackData.projectProp.loadProject();
    this.elements = stackData.projectProp.recipeElements;
    this.child.recipeMng.elements = this.elements.map(
      (element) => element.name
    );
  }

  /**
   * Get the label orientation of the patterns
   * @alias getLabelPositions
   * @memberof ConfView
   * @returns {array} labelPos - The label orientation of the patterns [[odd],[even],[top]]
   */
  getLabelPositions() {
    let labelPos = [];
    for (let i = 0; i < 3; i++) {
      if (stackData.pItems[i] !== undefined) {
        labelPos[i] = [];
        for (let j = 0; j < stackData.pItems[i].length; j++) {
          labelPos[i][j] = stackData.pItems[i][j].labelOrient;
        }
      }
    }
    return labelPos;
  }

  async cbOnChange(elementName, action, oldName) {
    await stackData.projectProp.loadProject();
    this.elements = stackData.projectProp.recipeElements;

    const files = await API.FILESYSTEM.getDirectoryContents(this.directory);
    const fileName = `${oldName}.lptune`;

    switch (action) {
      case 'copy':
        if (files.files.includes(fileName)) {
          await RecipeManager.copyToSameFolder(
            this.directory,
            fileName,
            `${elementName}.lptune`
          );
        }
        break;
      case 'delete':
        const deleteFileName = `${elementName}.lptune`;
        if (files.files.includes(deleteFileName)) {
          await API.FILESYSTEM.deleteFile(this.directory, deleteFileName);
        }
        break;
      case 'rename':
        if (files.files.includes(fileName)) {
          await RecipeManager.rename(
            this.directory,
            fileName,
            `${elementName}.lptune`
          );
        }
        break;
      default:
        break;
    }
  }

  /**
   * Render the configuration elements
   * @alias cbOnEdit
   * @memberof ConfView
   */
  async cbOnEdit(action) {
    await stackData.projectProp.loadProject();
    this.elements = stackData.projectProp.recipeElements;

    const views = this.child.stepContainer.views;

    // Get the configuration elements from stepcontainer
    this.box = views[0].content;
    this.pallet = views[1].content.child;
    this.slsheet = views[2].content;
    this.stack = views[4].content.child;
    // Initialize the values of the configuration elements or edit the values in case of edit
    if (action === 'add') {
      this.initializeValues();
    } else if (action === 'edit') {
      this.updateValues();
    }
  }

  /**
   * Set the default values of the configuration elements
   * @alias initializeValues
   * @memberof ConfView
   */
  initializeValues() {
    const { child, sslead, lslead, frontL, leftL, backL, rightL } = this.box;
    const { lengthInput, widthInput, heightInput, weightInput, boxCountInput } =
      child;
    const {
      typeDropdown,
      lengthInput: pLength,
      widthInput: pWidth,
      heightInput: pHeight,
    } = this.pallet;

    lengthInput.text = 300;
    widthInput.text = 200;
    heightInput.text = 175;
    weightInput.text = 5;
    sslead.checked = true;
    lslead.checked = false;
    if (stackData.projectProp.maxPickSSL === 0) {
      lslead.checked = true;
      sslead.checked = false;
    }
    boxCountInput.text = 1;
    stackData.projectProp.maxPickSSL === 1
      ? (this.box.find('.boxes-pick').style.display = 'none')
      : (this.box.find('.boxes-pick').style.display = 'flex');
    boxCountInput.validator = (value) =>
      checkInputRange(
        value,
        1,
        sslead.checked
          ? stackData.projectProp.maxPickSSL
          : stackData.projectProp.maxPickLSL
      );
    boxCountInput.description = l.trans('com.val_ch', {
      var1: 1,
      var2: sslead.checked
        ? stackData.projectProp.maxPickSSL
        : stackData.projectProp.maxPickLSL,
    });
    this.box.find('.labelpos-img').src = sslead.checked
      ? imgLabelPosSSL
      : imgLabelPosLSL;
    frontL.checked = false;
    leftL.checked = false;
    backL.checked = false;
    rightL.checked = false;
    this.oldLabelStatus = this.getLabelStatus();
    typeDropdown.selected = 'EUR1';
    pLength.text = 1200;
    pWidth.text = 800;
    pHeight.text = 170;
    this.slsheet.find('.slsheet-dim').style.display = 'none';
    this.slsheet.slSheetUsed.checked = false;
    stackData.palletProp.fullHeight = 0;
    stackData.pItems = [];
    stackData.stack.patterns = [];
    stackData.stackProp.clear();
  }

  /**
   * Set the desired product values from elements in case of edit
   * @alias updateValues
   * @memberof ConfView
   */
  updateValues() {
    const { box, pallet, slsheet, stack } =
      this.elements[this.child.recipeMng.elementIndex];

    const { child, sslead, lslead, frontL, leftL, backL, rightL } = this.box;
    const { lengthInput, widthInput, heightInput, weightInput, boxCountInput } =
      child;

    lengthInput.text = box.length;
    widthInput.text = box.width;
    heightInput.text = box.height;
    weightInput.text = box.weight;
    boxCountInput.text = box.sslCnt ? box.sslCnt : box.lslCnt;
    boxCountInput.validator = (value) =>
      checkInputRange(
        value,
        1,
        box.sslCnt
          ? stackData.projectProp.maxPickSSL
          : stackData.projectProp.maxPickLSL
      );
    boxCountInput.description = l.trans('com.val_ch', {
      var1: 1,
      var2: box.sslCnt
        ? stackData.projectProp.maxPickSSL
        : stackData.projectProp.maxPickLSL,
    });
    sslead.checked = box.sslCnt ? true : false;
    lslead.checked = box.lslCnt ? true : false;
    this.box.find('.labelpos-img').src = box.sslCnt
      ? imgLabelPosSSL
      : imgLabelPosLSL;
    [frontL.checked, leftL.checked, backL.checked, rightL.checked] = box.label;
    this.oldLabelStatus = this.getLabelStatus();

    this.pallet.lengthInput.text = pallet.length;
    this.pallet.widthInput.text = pallet.width;
    this.pallet.heightInput.text = pallet.height;
    for (let palletType of palletTypes) {
      if (
        parseInt(pallet.length) === palletType.length &&
        parseInt(pallet.width) === palletType.width
      ) {
        this.pallet.typeDropdown.selected = palletType.name;
        break;
      }
    }
    if (stack.slipSheet.length !== 0) {
      this.slsheet.find('.slsheet-dim').style.display = 'block';
      this.slsheet.child.lengthInput.text = slsheet.length;
      this.slsheet.child.widthInput.text = slsheet.width;
      this.slsheet.child.thicknessInput.text = slsheet.thickness;
      this.slsheet.child.stackHeightInput.text = slsheet.stackHeight;
      this.slsheet.slSheetUsed.checked = true;
    } else {
      this.slsheet.find('.slsheet-dim').style.display = 'none';
      this.slsheet.slSheetUsed.checked = false;
    }

    stackData.stackProp.stackConfigData = stack.layers.slice();
    stackData.palletProp.fullHeight = parseFloat(stack.maxHeight);
    stackData.stackProp.nrOfLayers = parseInt(stack.layerNr);
    stackData.stackProp.slipSheetData = stack.slipSheet.slice();
    stackData.boxProp.pickLSL = box.lslCnt;
    stackData.boxProp.pickSSL = box.sslCnt;

    this.updatePatternValues();
  }

  updatePatternValues() {
    const element = this.elements[this.child.recipeMng.elementIndex];
    if (!element || !element.pattern) return;

    const { pattern } = this.elements[this.child.recipeMng.elementIndex];

    stackData.stack.patterns = pattern.indexes.slice();
    for (let i = 0; i < pattern.indexes.length; i++) {
      if (pattern.indexes[i] !== undefined) {
        if (pattern.indexes[i] === -1) {
          stackData.stack.patterns[i] = undefined;
          stackData.pItems[i] = undefined;
        } else {
          stackData.patternCreation.setPatternFormula(i, pattern.indexes[i]);
          for (let j = 0; j < stackData.pItems[i].length; j++) {
            stackData.pItems[i][j].labelOrient = pattern.labelPos[i][j];
          }
        }
      }
    }
  }
}
