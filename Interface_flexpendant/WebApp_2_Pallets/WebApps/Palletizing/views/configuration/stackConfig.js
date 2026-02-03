import {
  intRegex,
  floatRegex,
  checkInputRange,
  argRange,
} from '../../constants/common.js';
import {
  basePallet,
  downIcon,
  imgDel,
  plusIcon,
  resetIcon,
  upIcon,
} from '../../constants/images.js';
import { layerTypes } from '../../constants/common.js';
import { stackData } from '../../leanPallet/StackData.js';
import { l } from '../../services/translation.js';

/**
 * @class StackConfig
 * @classdesc This class is responsible for rendering the stack configuration subview
 * @extends TComponents.Component_A
 * @memberof MultiStep
 * @param {HTMLElement} parent - The parent element to which the view will be rendered
 * @param {Object} props - The properties object to be passed to the view
 */
export default class StackConfig extends TComponents.Component_A {
  constructor(parent, props = {}) {
    super(parent, props);
  }

  /**
   * Instantiation of StackConfig sub-components that shall be initialized in a synchronous way.
   * All this components are then accessible within {@link onRender() onRender} method by using this.child.<component-instance>
   * Create elements for the stack setup.
   * @alias mapComponents
   * @memberof StackConfig
   * @returns {object} Contains all child StackConfig instances used within the component.
   */
  mapComponents() {
    // Create layout info box
    const stackSetupInfobox = new TComponents.LayoutInfobox_A(
      this.find('.stack-setup'),
      {
        title: l.trans('stackconf.set'),
        content: { children: this.find('.stack-setup-content') },
      }
    );
    // Create buttons
    const addLayerBtn = new TComponents.Button_A(
      this.find('.addlayer-button'),
      {
        text: l.trans('stackconf.addL'),
        icon: plusIcon,
        onClick: () => this.addLayerOnClick(),
      }
    );
    const remLayerBtn = new TComponents.Button_A(
      this.find('.remlayer-button'),
      {
        text: l.trans('stackconf.delL'),
        icon: imgDel,
        onClick: () => this.remLayerOnClick(),
      }
    );
    const addSSBtn = new TComponents.Button_A(this.find('.addss-button'), {
      text: l.trans('stackconf.addS'),
      icon: plusIcon,
      onClick: () => this.addSSOnClick(),
    });
    const upBtn = new TComponents.Button_A(this.find('.up-button'), {
      text: '',
      icon: upIcon,
      onClick: () => this.upOnClick(),
    });
    const downBtn = new TComponents.Button_A(this.find('.down-button'), {
      text: '',
      icon: downIcon,
      onClick: () => this.downOnClick(),
    });
    const defStackBtn = new TComponents.Button_A(
      this.find('.defstack-button'),
      {
        text: l.trans('stackconf.setD'),
        icon: resetIcon,
        onClick: () => this.defStackOnclick(),
      }
    );
    // Create input boxes
    const { layerNo, stackHeight } = argRange;
    const numLayersInput = new TComponents.Input_A(this.find('.layer-cnt'), {
      text: '0',
      description: l.trans('com.val_ch', {
        var1: layerNo.min,
        var2: layerNo.max,
      }),
      onChange: () => this.numLayersOnChange(),
    });
    numLayersInput.regex = intRegex;
    numLayersInput.validator = (value) =>
      checkInputRange(value, layerNo.min, layerNo.max);
    const maxHeightInput = new TComponents.Input_A(this.find('.stack-height'), {
      text: '0',
      description: l.trans('com.val_ch', {
        var1: stackHeight.min,
        var2: stackHeight.max,
      }),
      onChange: () => this.maxHeightOnChange(),
    });
    maxHeightInput.regex = floatRegex;
    maxHeightInput.validator = (value) =>
      checkInputRange(value, stackHeight.min, stackHeight.max);
    return {
      stackSetupInfobox,
      addLayerBtn,
      remLayerBtn,
      addSSBtn,
      upBtn,
      downBtn,
      defStackBtn,
      numLayersInput,
      maxHeightInput,
    };
  }

  /**
   * Add layer button click method. Add the selected pattern to the stack, and update the stack height,view.
   * @alias addLayerOnClick
   * @memberof StackConfig
   */
  addLayerOnClick() {
    const patternList = this.find('.pattern-list');
    const layerList = this.find('.stack-cfg');

    stackData.stackProp.insert(
      layerTypes.pattern,
      this.selectedRelIndex,
      patternList[patternList.selectedIndex].text
    );
    stackData.palletProp.fullHeight += stackData.boxProp.height;
    this.createStack(layerList.selectedIndex);
  }

  /**
   * Remove layer button click method.
   * @alias remLayerOnClick
   * @memberof StackConfig
   */
  remLayerOnClick() {
    TComponents.Popup_A.confirm(
      l.trans('stackconf.del_popup')[0],
      l.trans('stackconf.del_popup').slice(1, 3),
      (action) => {
        if (action !== 'ok') return;
        this.confirmRemLayer();
      }
    );
  }

  /**
   * Remove the selected element from the stack, and update the stack view.
   * @alias confirmRemLayer
   * @memberof StackConfig
   */
  confirmRemLayer() {
    const layerList = this.find('.stack-cfg');
    const { stackProp, palletProp, boxProp } = stackData;
    const { height } = boxProp;
    const actindex = layerList.selectedIndex;

    if (layerList.length === 0 || actindex === -1) return;

    if (layerList[actindex].value === 'SlSheet') {
      stackProp.remove(layerTypes.slipSheet, this.selectedRelIndex);
    } else {
      stackProp.remove(layerTypes.pattern, this.selectedRelIndex);
      palletProp.fullHeight -= height;
    }
    const targetIndex =
      actindex === layerList.length - 1 ? actindex - 1 : actindex;

    this.createStack(targetIndex);
  }

  /**
   * Add slip sheet button click method. Add the slip sheet to the stack, and update the stack view.
   * @alias addSSOnClick
   * @memberof StackConfig
   */
  addSSOnClick() {
    const layerList = this.find('.stack-cfg');
    stackData.stackProp.set(layerTypes.slipSheet, this.selectedRelIndex);
    this.createStack(layerList.selectedIndex);
  }

  /**
   * Move layer up or down
   * @alias moveLayer
   * @memberof StackConfig
   * @param {string} direction - The direction of the movement
   */
  moveLayer(direction) {
    const layerList = this.find('.stack-cfg');
    const selectedValue = layerList[layerList.selectedIndex].value;
    const selectedType =
      selectedValue === 'SlSheet' ? layerTypes.slipSheet : layerTypes.pattern;
    const increment = direction === 'up' ? 1 : -1;
    const condition =
      direction === 'up'
        ? layerList.selectedIndex > 0
        : layerList.selectedIndex < layerList.length - 1;

    stackData.stackProp.swap(
      selectedType,
      this.selectedRelIndex,
      this.selectedRelIndex + increment
    );

    if (condition > 0) {
      this.createStack(layerList.selectedIndex - increment);
    }
  }

  /**
   * Up button click method. Swap the selected element with the previous element in the stack, and update the stack view.
   * @alias upOnClick
   * @memberof StackConfig
   */
  upOnClick() {
    this.moveLayer('up');
  }

  /**
   * Down button click method. Swap the selected element with the next element in the stack, and update the stack view.
   * @alias downOnClick
   * @memberof StackConfig
   */
  downOnClick() {
    this.moveLayer('down');
  }

  /**
   * Default stack button click method. Set the default stack configuration, and update the stack view.
   * @alias defStackOnclick
   * @alias setDefStack
   * @memberof StackConfig
   */
  defStackOnclick() {
    TComponents.Popup_A.confirm(
      l.trans('stackconf.res_popup')[0],
      l.trans('stackconf.res_popup').slice(1, 3),
      (action) => {
        if (action !== 'ok') return;
        this.setDefStack();
      }
    );
  }

  /**
   * Set the default stack configuration, and update the stack view.
   * @alias setDefStack
   * @memberof StackConfig
   */
  setDefStack() {
    stackData.stackProp.calcDefaultStackConfig(
      stackData.boxProp,
      stackData.palletProp,
      stackData.pNames
    );
    this.createStack(0);
  }

  /**
   * Number of layers input box change method. Update the number of layers, stack height calculate default stack conf and update the stack view.
   * @alias numLayersOnChange
   * @memberof StackConfig
   */
  numLayersOnChange() {
    stackData.stackProp.nrOfLayers = parseInt(this.child.numLayersInput.text);
    stackData.palletProp.fullHeight =
      stackData.palletProp.height +
      stackData.boxProp.height * stackData.stackProp.nrOfLayers;
    stackData.stack.init();
    this.setDefStack();
  }

  /**
   * Max height input box change method. Update the max height of the pallet, calculate default stack conf and update the stack view.
   * @alias maxHeightOnChange
   * @memberof StackConfig
   */
  maxHeightOnChange() {
    stackData.palletProp.fullHeight = parseFloat(
      this.child.maxHeightInput.text
    );
    stackData.stack.init();
    this.setDefStack();
  }

  /**
   * Calculate the relative index of stack element
   * @alias selectedRelIndex
   * @memberof StackConfig
   * @returns {number} - The relative index of stack element
   */
  get selectedRelIndex() {
    const layerList = this.find('.stack-cfg');
    const absolutIndex = layerList.selectedIndex;
    if (absolutIndex === -1) return 0;

    let slCnt = 0;
    for (let i = absolutIndex - 1; i > -1; i--) {
      if (layerList[i].value === 'SlSheet') slCnt++;
    }

    return stackData.stackProp.count() - (absolutIndex - slCnt);
  }

  /**
   * Create the selected pattern list (odd,even,top)
   * @alias createPatternList
   * @memberof StackConfig
   */
  createPatternList() {
    const patternList = this.find('.pattern-list');
    patternList.innerHTML = '';

    const optgroup = document.createElement('optgroup');
    optgroup.label = l.trans('stackconf.av');
    patternList.appendChild(optgroup);

    const patternValues = [];
    stackData.stack.patterns.forEach((patternElement) => {
      // Check if pattern is already in list
      if (patternValues.includes(patternElement) || patternElement == undefined)
        return;
      // Add pattern to list
      const option = document.createElement('option');
      option.text = stackData.libProp.libPatternProp[patternElement].name;
      option.value = patternElement;
      patternList.appendChild(option);
      // Add pattern to values
      patternValues.push(patternElement);
    });
    patternList.selectedIndex = 0;
  }

  /**
   * Create the stack list
   * @alias createStack
   * @memberof StackConfig
   * @param {number} index - The index of the selected element in stack
   */
  createStack(index) {
    const layerList = this.find('.stack-cfg');
    layerList.innerHTML = '';

    const stackProp = stackData.stackProp;
    const stackLength = stackProp.count();
    const stackSize = stackLength + stackProp.slipSheetData.length;
    layerList.size = stackSize;
    const fragment = document.createDocumentFragment();

    for (let i = stackLength; i > -1; i--) {
      if (stackProp.slipSheetData.includes(i)) {
        const option_sl = document.createElement('option');
        option_sl.text = 'Slip Sheet';
        option_sl.value = 'SlSheet';
        fragment.appendChild(option_sl);
      }
      if (i === 0) break;
      const option = document.createElement('option');
      option.text = `${i}: ${stackProp.stackConfigData[i - 1]}`;
      option.value = stackProp.stackConfigData[i - 1];
      fragment.appendChild(option);
    }
    layerList.appendChild(fragment);
    layerList.style.height = stackLength < 4 ? `${75 * stackSize}px` : '300px';
    layerList.selectedIndex = index === -1 ? 0 : index;
    this.child.numLayersInput.text = stackData.stackProp.nrOfLayers;
    this.child.maxHeightInput.text = stackData.palletProp.fullHeight;
    parseInt(this.child.numLayersInput.text) > 0
      ? this.nextBtnEnable(true)
      : this.nextBtnEnable(false);
  }

  /**
   * Generates the HTML definition corresponding to the component.
   * html elements for different components in the layout
   * @alias markup
   * @memberof StackConfig
   * @returns {string}
   */
  markup() {
    return /*html*/ `
        <div class="stack-subview">
          <div class="flex">
            <div class="flex-1 my-3">
              <div class="stack-setup"></div>
              <div class="stack-setup-content pl-2 pr-2">
                <div class="flex tc-space my-1 items-center">
                  <div>${l.trans('com.noLay')}</div>
                  <div class="layer-cnt"></div>
                </div>
                <div class="flex tc-space my-1 items-center">
                  <div>${l.trans('stackconf.mhe')} (mm)</div>
                  <div class="stack-height"></div>
                </div>
                <div class="pattern-container flex justify-center">
                  <select class="pattern-list" size="4"></select>
                </div>
                <div class="flex my-4 justify-center">
                  <div class="addlayer-button"></div>
                </div>
                <div class="flex my-1 justify-center">
                  <div class="addss-button"></div>
                </div>
              </div>
            </div>
            <div class="stack-view flex">
              <div class="stack-container flex-col">
                <select class="stack-cfg" size="5"></select>
                <img class="pallet-base" src="${basePallet}" />
                <div class="flex justify-center my-4">
                  <div class="remlayer-button"></div>
                  <div class="defstack-button ml-4"></div>
                </div>
              </div>
              <div class="button-container ml-3 flex-col">
                <div class="up-button my-3"></div>
                <div class="down-button"></div>
              </div>
            </div>
          </div>
        </div>
    `;
  }
}

/**
 * Add css properties to the component
 * @alias loadCssClassFromString
 * @static
 * @param {string} css - The css string to be loaded into style tag
 * @memberof StackConfig
 */
StackConfig.loadCssClassFromString(/*css*/ `
  .stack-subview .fp-components-input{
    width: 100px;
  }
  .stack-cfg {
    width: 380px;
    height: 300px;
    font-size: 24px;
    border: none;
    border-radius: 4px;
    box-shadow: rgba(0, 0, 0, 0.8) 0px 5px 15px;
  }
  .stack-cfg option {
    padding: 1.25rem;
    border-top: rgba(0, 0, 0, 0.1) 1px solid;
  }
  .stack-cfg option:checked{
    background-color: rgba(0, 0, 0, 0.16);
    color: #000;
    font-weight: 400;
  }
  .pallet-base {
    width: 380px;
    height: auto;
  }
  .stack-view{
    justify-content: center;
    align-items: center;
    flex: 1.2;
  }
  .pattern-list {
    width: 250px;
    height: 180px;
    font-size: 20px;
    border: none;
    border-radius: 8px;
    border: 0.25px solid #ddd;
  }
  .pattern-list option {
    padding: 0.5rem;
    border-top: rgba(0, 0, 0, 0.1) 1px solid;
  }
  .pattern-list option:checked{
    background-color: rgba(0, 0, 0, 0.16);
    color: #000;
    font-weight: 400;
  }
  .pattern-list optgroup {
    padding: 0.5rem;
    font-family: "Segoe UI", "Verdana", "sans-serif";
    font-weight: 500;
  }
  .stack-subview .fp-components-button-icon{
    background-size: auto;
  }
  .stack-subview .fp-components-button-text{
    flex: none;
  }
  .button-container .fp-components-button-icon {
    margin: 0;
    width: 24px;
    height: 24px;
  }
  .button-container .fp-components-button {
    min-width: 10px;
    padding: 0 0.5rem;
  }
`);
