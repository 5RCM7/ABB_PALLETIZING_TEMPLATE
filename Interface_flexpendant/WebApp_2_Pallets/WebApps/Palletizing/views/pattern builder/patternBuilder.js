import Pallet from '../configuration/canvasPallet.js';
import { getPatternWithBoxes, drawPalletWithBoxes } from './patternHelper.js';
import { StackData } from '../../leanPallet/StackData.js';
import { patternItemProperties } from '../../leanPallet/DataType classes/PatternItemProperties.js';
import {
  palletTypes,
  floatRegex,
  checkInputRange,
  argRange,
} from '../../constants/common.js';
import fs, { FILES_DIRECTORY_LIB } from '../../services/fileManager.js';
import {
  closeIcon,
  imgDel,
  plusIcon,
  resetIcon,
  upIcon,
  downIcon,
  leftIcon,
  righIcon,
  infoIconB,
} from '../../constants/images.js';
import { l } from '../../services/translation.js';
import { PatternCreation } from '../../leanPallet/PatternCreation.js';
import { BoxProperties } from '../../leanPallet/DataType classes/BoxProperties.js';
import { PalletProperties } from '../../leanPallet/DataType classes/PalletProperties.js';
import { StackProperties } from '../../leanPallet/DataType classes/StackProperties.js';
import { slSheetProperties } from '../../leanPallet/DataType classes/SlSheetProperties.js';
import DropDownButton from '../components/dropDownButton.js';

/**
 * @class PatternBuilder
 * @classdesc This class is responsible for rendering the pattern builder subview
 * @extends TComponents.Component_A
 * @memberof App
 * @param {HTMLElement} parent - The parent element to which the view will be rendered
 * @param {Object} props - The properties object to be passed to the view
 */
export default class PatternBuilder extends TComponents.Component_A {
  constructor(parent, props = {}) {
    super(parent, props);

    this.hBox = new FPComponents.Radio_A();
    this.vBox = new FPComponents.Radio_A();

    this.increment = 1;

    this.patternName = '';
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
      onSave: null,
    };
  }

  async onInit() {
    if (this._props.onSave) this.on('save', this._props.onSave);
    this.localStackData = new StackData();
    this.patternCreation = new PatternCreation(this.localStackData);
  }

  async updateStackData(stackData) {
    this.clearPattern();

    // the libProp is copied by reference, since it is managed by globla stackdata, and we want to keep the changes
    // updated inside the patternbuilder
    this.localStackData.libProp = stackData.libProp;

    this.localStackData.boxProp = Object.assign(
      new BoxProperties(),
      JSON.parse(JSON.stringify(stackData.boxProp))
    );
    this.localStackData.palletProp = Object.assign(
      new PalletProperties(),
      JSON.parse(JSON.stringify(stackData.palletProp))
    );
    this.localStackData.stackProp = Object.assign(
      new StackProperties(),
      JSON.parse(JSON.stringify(stackData.stackProp))
    );
    this.localStackData.slipSheetProp = Object.assign(
      new slSheetProperties(),
      JSON.parse(JSON.stringify(stackData.slipSheetProp))
    );
    this.localStackData.pSizes = stackData.pSizes.map((size) => size.clone());
    this.localStackData.pItems = stackData.pItems.map((layer) =>
      layer === undefined ? undefined : layer.map((item) => item.clone())
    );
    this.localStackData.pNames = JSON.parse(JSON.stringify(stackData.pNames));

    this.updatePalletDimensions();
  }

  updatePalletDimensions() {
    const { length: boxL, width: boxW } = this.localStackData.boxProp;
    const { length: pallL, width: pallW } = this.localStackData.palletProp;

    if (boxL !== null) this.child.boxLengthInput.text = boxL;
    if (boxW !== null) this.child.boxWidthInput.text = boxW;
    if (pallL !== null) this.child.pallLengthInput.text = pallL;
    if (pallW !== null) this.child.pallWidthInput.text = pallW;
    for (let palletType of palletTypes) {
      if (pallL === palletType.length && pallW === palletType.width) {
        this.child.palltypeDropdown.selected = palletType.name;
        if (this.localStackData.pItems[3] === undefined) return;
        this.setPallDim();
        break;
      }
    }
  }

  /**
   * Contains all synchronous operations/setups that may be required for any sub-component after its initialization and/or manipulation of the DOM.
   * This method is called internally during rendering process orchestrated by {@link render() render}.
   * Create an empty pallet and draw it.
   * @alias onRender
   * @memberof PatternBuilder
   */
  onRender() {
    const canvasParent = this.find('#canvasParent');
    const pattern = [];
    const patternSize = [];

    this.pallet = new Pallet(
      'pallet-elem',
      canvasParent,
      this.localStackData,
      parseInt(this.child.pallLengthInput.text),
      parseInt(this.child.pallWidthInput.text),
      pattern,
      patternSize
    );
    this.pallet.draw();
    this.pallet.canvas.canvasElem.addEventListener(
      'mousedown',
      this.pallet.onMouseDown.bind(this.pallet, -1)
    );

    this.hBox.desc = l.trans('pattbuild.h');
    this.vBox.desc = l.trans('pattbuild.v');
    this.hBox.attachToElement(this.find('.hbox-radio'));
    this.vBox.attachToElement(this.find('.vbox-radio'));
    this.hBox.onclick = () => {
      this.vBox.checked = false;
    };
    this.vBox.onclick = () => {
      this.hBox.checked = false;
    };
    this.hBox.checked = true;
  }

  /**
   * Instantiation of PatternBuilder sub-components that shall be initialized in a synchronous way.
   * All this components are then accessible within {@link onRender() onRender} method by using this.child.<component-instance>
   * @alias mapComponents
   * @memberof PatternBuilder
   * @returns {object} Contains all child PatternBuilder instances used within the component.
   */
  mapComponents() {
    // Create elements for box dimension setup
    const boxSizeInfobox = new TComponents.LayoutInfobox_A(
      this.find('.box-size'),
      {
        title: l.trans('pattbuild.bDim'),
        content: { children: this.find('.box-size-content') },
      }
    );
    const { boxLength, boxWidth } = argRange;
    const boxLengthInput = new TComponents.Input_A(this.find('.box-length'), {
      text: '300',
      description: l.trans('com.val_ch', {
        var1: boxLength.min,
        var2: boxLength.max,
      }),
      onChange: function (maxVal) {
        this.child.boxWidthInput.validator = (value) =>
          checkInputRange(value, boxWidth.min, maxVal);
        this.child.boxWidthInput.description = l.trans('com.val_ch', {
          var1: boxWidth.min,
          var2: maxVal,
        });
      }.bind(this),
    });
    boxLengthInput.regex = floatRegex;
    boxLengthInput.validator = (value) =>
      checkInputRange(value, boxLength.min, boxLength.max);
    const boxWidthInput = new TComponents.Input_A(this.find('.box-width'), {
      text: '200',
      description: l.trans('com.val_ch', {
        var1: boxWidth.min,
        var2: boxLengthInput.text,
      }),
    });
    boxWidthInput.regex = floatRegex;
    boxWidthInput.validator = (value) =>
      checkInputRange(value, boxWidth.min, boxLengthInput.text);
    const setBoxBtn = new TComponents.Button_A(this.find('.setbox-button'), {
      text: l.trans('pattbuild.bSet'),
      onClick: () => this.setboxSize(),
    });
    // Create elements for pallet dimension setup
    const palletSizeInfobox = new TComponents.LayoutInfobox_A(
      this.find('.pallet-size'),
      {
        title: l.trans('pattbuild.pDim'),
        content: { children: [this.find('.pallet-size-content')] },
      }
    );
    const palltypeDropdown = new TComponents.Dropdown_A(
      this.find('.pallet-selector'),
      {
        itemList: palletTypes.map((pallet) => pallet.name),
      }
    );
    palltypeDropdown.onSelection(this.typeOnSelection.bind(this));
    const { palletLength, palletWidth } = argRange;
    const pallLengthInput = new TComponents.Input_A(
      this.find('.pallet-length'),
      {
        text: '1200',
        description: l.trans('com.val_ch', {
          var1: palletLength.min,
          var2: palletLength.max,
        }),
        onChange: function (maxVal) {
          this.child.pallWidthInput.validator = (value) =>
            checkInputRange(value, palletWidth.min, maxVal);
          this.child.pallWidthInput.description = l.trans('com.val_ch', {
            var1: palletWidth.min,
            var2: maxVal,
          });
        }.bind(this),
      }
    );
    pallLengthInput.regex = floatRegex;
    pallLengthInput.validator = (value) =>
      checkInputRange(value, palletLength.min, palletLength.max);
    const pallWidthInput = new TComponents.Input_A(this.find('.pallet-width'), {
      text: '800',
      description: l.trans('com.val_ch', {
        var1: palletWidth.min,
        var2: pallLengthInput.text,
      }),
    });
    pallWidthInput.regex = floatRegex;
    pallWidthInput.validator = (value) =>
      checkInputRange(value, palletWidth.min, pallLengthInput.text);
    const setPallBtn = new TComponents.Button_A(this.find('.setpall-button'), {
      text: l.trans('pattbuild.pSet'),
      onClick: () => this.setPallDim(),
    });
    // Create control buttons for pattern builder
    const clearPatternBtn = new TComponents.Button_A(
      this.find('.clear-button'),
      {
        text: l.trans('pattbuild.cl'),
        icon: resetIcon,
        onClick: () => this.clearPattern(),
      }
    );
    const remBtn = new TComponents.Button_A(this.find('.rem-button'), {
      text: l.trans('com.rem'),
      icon: imgDel,
      onClick: () => this.removeSelectedBox(),
    });
    const itemList = ['Add box on X', 'Add box on Y'];
    const addButtonXY = new DropDownButton(this.find('.add-button'), {
      itemList: itemList,
      selected: itemList[0],
      // icon: plusIcon,
      onClick: (direction) =>
        this.addBox(this.vBox.checked ? 'V' : 'H', direction),
    });
    const rightBtn = new TComponents.Button_A(this.find('.right-button'), {
      text: '',
      icon: righIcon,
      onClick: () => this.moveBox(1),
    });
    const centerBtn = new TComponents.Button_A(this.find('.center-button'), {
      text: '100%',
      onClick: () => this.changeIncrement(),
    });
    const centerBtnLW = new TComponents.Button_A(this.find('.center-button'), {
      text: 'L',
      onClick: () => this.changeDimension(),
    });
    this.increment = 1;

    const leftBtn = new TComponents.Button_A(this.find('.left-button'), {
      text: '',
      icon: leftIcon,
      onClick: () => this.moveBox(2),
    });
    const upBtn = new TComponents.Button_A(this.find('.up-button'), {
      text: '',
      icon: upIcon,
      onClick: () => this.moveBox(3),
    });
    const downBtn = new TComponents.Button_A(this.find('.down-button'), {
      text: '',
      icon: downIcon,
      onClick: () => this.moveBox(4),
    });
    // Create save button
    const saveBtn = new TComponents.Button_A(this.find('.save-button'), {
      text: l.trans('com.save'),
      onClick: () => this.savePattern(),
    });
    // Create a close button
    const closeBtn = new TComponents.Button_A(this.find('.x-close-button'), {
      text: '',
      icon: closeIcon,
    });
    return {
      boxSizeInfobox,
      boxLengthInput,
      boxWidthInput,
      setBoxBtn,
      palletSizeInfobox,
      palltypeDropdown,
      pallLengthInput,
      pallWidthInput,
      setPallBtn,
      clearPatternBtn,
      addButtonXY,
      remBtn,
      rightBtn,
      centerBtn,
      centerBtnLW,
      leftBtn,
      upBtn,
      downBtn,
      saveBtn,
      closeBtn,
    };
  }

  /**
   * Callback function for the dropdown menu. Change pallet dimensions according to the selected pallet type.
   * @alias typeOnSelection
   * @memberof PatternBuilder
   */
  typeOnSelection() {
    const selectedIndex = this.child.palltypeDropdown.items.indexOf(
      this.child.palltypeDropdown.selected
    );

    this.child.pallLengthInput.text = palletTypes[selectedIndex].length;
    this.child.pallWidthInput.text = palletTypes[selectedIndex].width;
  }

  /**
   * Show the pattern with the specific index.
   * @alias renderLoadedPattern
   * @memberof PatternBuilder
   * @param {number} index - The index of the pattern to be shown
   */
  renderLoadedPattern(index) {
    this.pallet.deselectBox();
    this.updateBoxProperties();
    this.patternCreation.setPatternFormula(3, index);

    this.updatePattern();
  }

  /**
   * Update the box properties from the input fields.
   * @alias updateBoxProperties
   * @memberof PatternBuilder
   */
  updateBoxProperties() {
    this.localStackData.boxProp.length = parseInt(
      this.child.boxLengthInput.text
    );
    this.localStackData.boxProp.width = parseInt(this.child.boxWidthInput.text);
  }

  /**
   * Add a box to the pallet and draw it.
   * @alias addBox
   * @memberof PatternBuilder
   * @param {string} orientation - The orientation of the box to be added
   */
  addBox(orientation, direction = '') {
    const dir = direction.replace('Add box on ', '').toLowerCase();

    this.updateBoxProperties();

    const newFormula = this.pallet.findNewPlaceForBox(orientation, dir);
    if (newFormula) {
      this.localStackData.pItems[3].push(
        new patternItemProperties(
          this.localStackData.pItems[3].length,
          newFormula,
          0,
          0
        )
      );
    }
    this.pallet.deselectBox();
    this.updatePattern();
  }

  /**
   * Set the box dimensions and show the modified pattern.
   * @alias setboxSize
   * @memberof PatternBuilder
   */
  setboxSize() {
    this.updateBoxProperties();
    this.updatePattern();
  }

  /**
   * Set the pallet dimensions and show the modified pallet.
   * @alias setPallDim
   * @memberof PatternBuilder
   */
  setPallDim() {
    const palletLength = parseInt(this.child.pallLengthInput.text);
    const palletWidth = parseInt(this.child.pallWidthInput.text);

    this.pallet = drawPalletWithBoxes(
      this.find('#canvasParent'),
      3,
      this.localStackData,
      palletLength,
      palletWidth
    );
    this.pallet.canvas.canvasElem.addEventListener(
      'mousedown',
      this.pallet.onMouseDown.bind(this.pallet, -1)
    );
  }

  /**
   * Update the pattern with the specified pattern and pattern size.
   * @alias updatePattern
   * @memberof PatternBuilder
   */
  updatePattern() {
    this.patternCreation.calcPattern(3);
    const pattern = getPatternWithBoxes(this.localStackData.pItems[3]);
    this.pallet.pattern = pattern;
    this.pallet.patternDim = this.localStackData.pSizes[3];
    this.pallet.drawBoxes();
  }

  /**
   * Remove the selected box from the pallet and the pattern.
   * @alias removeSelectedBox
   * @memberof PatternBuilder
   */
  removeSelectedBox() {
    const boxIndex = this.pallet.removeBox();
    if (boxIndex >= 0) {
      this.localStackData.pItems[3].splice(boxIndex, 1);
    }
    this.pallet.selectedBoxIndex = -1;
    this.updatePattern();
  }

  /**
   * Clear the pattern and the pallet.
   * @alias clearPattern
   * @memberof PatternBuilder
   */
  clearPattern() {
    this.localStackData.pItems[3] = [];
    this.pallet.calcBoxes = [];
    this.pallet.boxSelected = null;
    this.pallet.clearBoxes();
  }

  /**
   * Save the pattern to a file.
   * @alias savePattern
   * @memberof PatternBuilder
   */
  async savePattern() {
    if (!this.patternName) {
      console.error('Pattern name is not set');
      return;
    }

    const formulaObject = {
      PatternDefinition: this.localStackData.pItems[3].map((item) => {
        let xFormula = item.formula.split(';')[1];
        let yFormula = item.formula.split(';')[2];
        if (xFormula !== '') {
          xFormula = this.processFormula(xFormula);
        }
        if (yFormula !== '') {
          yFormula = this.processFormula(yFormula);
        }

        return {
          Id: item.ID + 1,
          BoxOrient: item.boxOrient,
          BoxXFormula: xFormula,
          BoxYFormula: yFormula,
          BoxGroup: '',
        };
      }),
    };
    const content = JSON.stringify(formulaObject);

    await fs.createNewFile(
      FILES_DIRECTORY_LIB,
      this.patternName + '.json',
      content,
      true
    );

    // some cleaning
    this.clearPattern();

    // trigger save event
    this.trigger('save');
  }

  /**
   * Process the formula of the box.
   * @alias processFormula
   * @memberof PatternBuilder
   * @param {string} str - The formula to be processed
   * @returns {string} The processed formula
   */
  processFormula(str) {
    // Split the string by non-digit characters
    let parts = str.split(/([^\d\.]|[\+\-])/);

    // Process each part
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === '') continue;
      if ((parts[i] === '+' || parts[i] === '-') && parts[i + 1] === '0') {
        parts[i] = '';
      }
      let num = parseFloat(parts[i]);

      // Check if the part is a number
      if (!isNaN(num)) {
        // Check if the number is zero
        if (Math.abs(num) < 0.0001) {
          [parts[i], parts[i + 1]] = ['', ''];
        }
        // Check if the number is a float
        if (num % 1 !== 0) {
          // Round the number to 2 decimal points
          parts[i] = parseFloat(num.toFixed(2)).toString();
        }
      }
    }

    // Join the parts back together
    return parts.join('');
  }

  changeIncrement() {
    const btn = this.child.centerBtn;
    if (btn) {
      const value = Number(btn.text.replace('%', ''));
      switch (value) {
        case 10:
          btn.text = '1%';
          this.increment = 0.01;
          break;
        case 50:
          btn.text = '10%';
          this.increment = 0.1;
          break;
        case 100:
          btn.text = '50%';
          this.increment = 0.5;
          break;
        default:
          btn.text = '100%';
          this.increment = 1;
          break;
      }
    }
  }

  changeDimension() {
    const btn = this.child.centerBtnLW;
    if (btn) {
      const value = btn.text;
      switch (value) {
        case 'L':
          btn.text = 'W';
          break;
        default:
          btn.text = 'L';
          break;
      }
    }
  }

  /**
   * Move the selected box in the specified direction.
   * @alias moveBox
   * @memberof PatternBuilder
   * @param {number} direction - The direction in which the box will be moved
   * 1 - right, 2 - left, 3 - up, 4 - down
   */
  moveBox(direction) {
    this.updateBoxProperties();
    const boxIndex = this.pallet.selectedBoxIndex;

    if (this.pallet.boxSelected) {
      const box = this.localStackData.pItems[3][boxIndex];
      var tempBox = Object.assign({}, this.localStackData.pItems[3][boxIndex]);
      // Moving the box is not allowed when the pattern consists of one box
      if (this.localStackData.pItems[3].length <= 1) return;
      const { length, width } = this.getBoxDimensions(box.boxOrient);
      const xCoef = this.increment;
      const yCoef = this.increment;

      switch (direction) {
        case 1:
        case 2:
          this.updateFormulaX(
            box,
            direction,
            xCoef,
            this.child.centerBtnLW.text.toLowerCase()
          );
          break;
        case 3:
        case 4:
          this.updateFormulaY(
            box,
            direction,
            yCoef,
            this.child.centerBtnLW.text.toLowerCase()
          );
          break;
      }

      this.patternCreation.calcPattern(3);
      const patternSize = this.localStackData.pSizes[3];
      const pattern = getPatternWithBoxes(this.localStackData.pItems[3]);

      if (this.outsidePallet(patternSize)) {
        this.localStackData.pItems[3][boxIndex] = tempBox;
        return;
      }

      this.pallet.pattern = pattern;
      this.pallet.patternDim = patternSize;
      this.pallet.selectBox(pattern[this.pallet.selectedBoxIndex]);
      this.pallet.drawBoxes();
    }
  }

  /**
   * Check if the box is outside the pallet in the specified direction.
   * @alias outsidePallet
   * @memberof PatternBuilder
   * @param {Object} patternDim - The dimensions of the pattern
   * @returns {boolean} True if the box is outside the pallet, false otherwise
   */
  outsidePallet(patternDim) {
    return (
      patternDim._patternSizeX > this.pallet.palletLength ||
      patternDim._patternSizeY > this.pallet.palletWidth
    );
  }

  /**
   * Get the dimensions of the box in the specified orientation.
   * @alias getBoxDimensions
   * @memberof PatternBuilder
   * @param {string} orientation - The orientation of the box
   * @returns {Object} The length and width of the box
   */
  getBoxDimensions(orientation) {
    let length, width;
    if (orientation === 'H') {
      length = this.localStackData.boxProp.length;
      width = this.localStackData.boxProp.width;
    } else {
      length = this.localStackData.boxProp.width;
      width = this.localStackData.boxProp.length;
    }
    return { length, width };
  }

  /**
   * Update the x formula of the box.
   * @alias updateFormulaX
   * @memberof PatternBuilder
   * @param {Object} box - The box to be updated
   * @param {number} direction - The direction in which the box will be moved
   * @param {number} xCoef - The x coefficient
   */
  updateFormulaX(box, direction, xCoef, dimension) {
    const formulaX = box.formula.split(';')[1];
    const xCoord = dimension === 'l' ? xCoef + 'l' : xCoef + 'w';
    const newXFormula = this.simplifyExpression(
      `${formulaX}${direction === 1 ? '+' : '-'}${xCoord}`
    );
    box.formula = `${box.boxOrient};${newXFormula};${
      box.formula.split(';')[2]
    };`;
  }

  /**
   * Update the y formula of the box.
   * @alias updateFormulaY
   * @memberof PatternBuilder
   * @param {Object} box - The box to be updated
   * @param {number} direction - The direction in which the box will be moved
   * @param {number} yCoef - The y coefficient
   */
  updateFormulaY(box, direction, yCoef, dimension) {
    const formulaY = box.formula.split(';')[2];
    const yCoord = dimension === 'l' ? yCoef + 'l' : yCoef + 'w';
    const newYFormula = this.simplifyExpression(
      `${formulaY}${direction === 3 ? '+' : '-'}${yCoord}`
    );
    box.formula = `${box.boxOrient};${
      box.formula.split(';')[1]
    };${newYFormula};`;
  }

  /**
   * Simplify the expression of the box.
   * @alias simplifyExpression
   * @memberof PatternBuilder
   * @param {string} expr - The expression to be simplified
   * @returns {string} The simplified expression
   */
  simplifyExpression(expr) {
    // Define variables to be simplified
    const variables = ['l', 'w'];

    // Result array to hold simplified parts
    let simplifiedParts = [];

    variables.forEach((variable) => {
      // Create a regular expression using the variable
      const regex = new RegExp(`(-?\\d*(\\.\\d+)?)${variable}`, 'g');

      // Match all instances of coefficients followed by the variable
      const matches = expr.match(regex);
      if (!matches) return;

      // Extract coefficients and sum them up
      let sum = matches.reduce((total, match) => {
        const coefficient = match.slice(0, -1);
        return (
          total +
          (coefficient === '' || coefficient === '-'
            ? coefficient === '-'
              ? -1
              : 1
            : Number(coefficient))
        );
      }, 0);

      // If sum is not 0, add simplified part to result array
      if (sum !== 0) {
        simplifiedParts.push(parseFloat(sum.toFixed(2)).toString() + variable);
      }
    });

    // Join simplified parts and return
    return simplifiedParts.join('+');
  }

  /**
   * Generates the HTML definition corresponding to the component.
   * div element for the title and the tab container
   * @alias markup
   * @memberof PatternBuilder
   * @returns {string}
   */
  markup() {
    return /*html*/ `
        <div class="flex">
          <div class="flex-07">
            <div class="pallet-size my-3">
              <div class="pallet-size-content">
                <div class="flex tc-space my-3 items-center">
                  <div>${l.trans('pattbuild.ty')}</div>
                  <div class="pallet-selector"></div>
                </div>
                <div class="flex tc-space my-3 items-center">
                  <div>${l.trans('com.l')} L (mm)</div>
                  <div class="pallet-length"></div>
                </div>
                <div class="flex tc-space my-3 items-center">
                  <div>${l.trans('com.w')} W (mm)</div>
                  <div class="pallet-width"></div>
                </div>
                <div class="flex justify-center my-1">
                  <div class="setpall-button"></div>
                </div>
              </div>
            </div>
            <div class="box-size">
              <div class="box-size-content pb-10">
                <div class="flex tc-space my-1 items-center">
                  <div>${l.trans('com.l')} L (mm)</div>
                  <div class="box-length"></div>
                </div>
                <div class="flex tc-space my-1 items-center">
                  <div>${l.trans('com.w')} W (mm)</div>
                  <div class="box-width"></div>
                </div>
                <div class="flex justify-center my-1">
                  <div class="setbox-button"></div>
                </div>
                <div class="info-desc flex-row items-center">
                  <img src="${infoIconB}" class="info-iconb mr-2" />
                  ${l.trans('pattbuild.note')}
                </div>
              </div>
            </div>
          </div>
          <div class="flex-1 wh-cont pt-3">
            <div class="flex justify-end pr-3">
              <div class="x-close-button"></div>
            </div>
            <div class="pattern-build-cont">
              <div id="canvasParent"></div>
              <div class="flex mt-5 tc-space">
                <div class="flex-col pl-5">
                  <div class="hbox-radio mb-3"></div>
                  <div class="vbox-radio mb-5"></div>
                  <div class="add-button"></div>
                </div>
                <div class="move-buttons">
                  <div class="flex justify-center">
                    <div class="up-button"></div>
                  </div>
                  <div class="flex justify-center pb-2 pt-2">
                    <div class="left-button mr-2"></div>
                    <div class="flex-row center-button mr-2"></div>
                    <div class="right-button"></div>
                  </div>
                  <div class="flex justify-center">
                    <div class="down-button"></div>
                  </div>
                </div>
                <div class="flex-col pr-10">
                  <div class="rem-button mb-4"></div>
                  <div class="clear-button"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex my-2 justify-end pr-3">
          <div class="save-button"></div>
        </div>
    `;
  }
}

/**
 * Add css properties to the component, setup style of the tab container
 * @alias loadCssClassFromString
 * @static
 * @param {string} css - The css string to be loaded into style tag
 * @memberof PatternBuilder
 */
PatternBuilder.loadCssClassFromString(/*css*/ `
  .pallet-length, .pallet-width, .box-length, .box-width, .pallet-selector {
    width: 100px;
  }
  .save-button{
    width: 90px;
  }
  .add-button, .rem-button, .clear-button {
    width: 150px;
  }
  .pattern-build-cont .center-button {
    min-width: 49px;
    min-height: 44px;
  }
  .left-button .fp-components-button, .right-button .fp-components-button, 
  .up-button .fp-components-button, .down-button .fp-components-button{
    min-width: 0px;
  }
  .pattern-build-cont .fp-components-button-icon{
    background-size: auto;
    margin: 0;
  }
  .pattern-build-cont .fp-components-button-text{
    flex: none;
  }
  .pattern-build-cont .fp-components-button{
    min-width: 10px;
    padding: 0 0.5rem;
  }
  .move-buttons .fp-components-button-icon {
    margin: 0;
    width: 24px;
    height: 24px;
  }
  
  .info-iconb{
    width: 20px;
    height: 20px;
  }
  `);
