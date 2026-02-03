import {
  imgDel,
  infoIcon,
  labelIcon,
  coordSystem,
  resetIcon,
} from '../../constants/images.js';
import { stackData } from '../../leanPallet/StackData.js';
import { drawPalletWithBoxes } from '../pattern builder/patternHelper.js';
import { notSetIcon, setIcon } from '../../constants/images.js';
import { l } from '../../services/translation.js';
import { Utils } from '../../services/utils.js';

/**
 * @class PatternConfig
 * @classdesc This class is responsible for rendering the pattern configuration subview
 * @extends TComponents.Component_A
 * @memberof MultiStep
 * @param {HTMLElement} parent - The parent element to which the view will be rendered
 * @param {Object} props - The properties object to be passed to the view
 */
export default class PatternConfig extends TComponents.Component_A {
  constructor(parent, props = {}) {
    super(parent, props);
  }

  /**
   * Returns an object with expected input properties together with their initial value.
   * Every child class shall have a {@link defaultProps} to register its corresponding input properties.
   * @alias defaultProps
   * @memberof PatternConfig
   * @protected
   * @returns {object}
   */
  defaultProps() {
    return {
      changeHamView: () => {},
    };
  }

  async onInit() {
    const setupCont = await Utils.getSetup();
    this.disablePatternBuilder = setupCont.disable_pattern_builder;
  }

  /**
   * Instantiation of PatternConfig sub-components that shall be initialized in a synchronous way.
   * All this components are then accessible within {@link onRender() onRender} method by using this.child.<component-instance>
   * Create elements for the pattern setup.
   * @alias mapComponents
   * @memberof PatternConfig
   * @returns {object} Contains all child PatternConfig instances used within the component.
   */
  mapComponents() {
    // Create layout info box
    const layerSetupInfobox = new TComponents.LayoutInfobox_A(
      this.find('.layer-setup'),
      {
        title: l.trans('patternconf.set'),
        content: { children: this.find('.layer-setup-content') },
      }
    );
    const setBtn = [];
    const delBtn = [];
    for (let i = 0; i < 3; i++) {
      setBtn[i] = new TComponents.Button_A(this.all('.set-button')[i], {
        text: l.trans('com.set'),
        icon: setIcon,
        onClick: () => this.setOnClick(i),
      });
      delBtn[i] = new TComponents.Button_A(this.all('.del-button')[i], {
        text: l.trans('com.del'),
        icon: imgDel,
        onClick: () => this.deleteOnClick(i),
      });
    }
    const setLabelBtn = new TComponents.Button_A(
      this.find('.setlabel-button'),
      {
        text: l.trans('com.ch'),
        icon: labelIcon,
        onClick: () => this.setLabelOnclick(),
      }
    );
    const resetLabelBtn = new TComponents.Button_A(
      this.find('.resetlabel-button'),
      {
        text: l.trans('com.res'),
        icon: resetIcon,
        onClick: () => this.resetLabelOnclick(),
      }
    );
    const patternDropdown = new TComponents.Dropdown_A(
      this.find('.pattern-selector'),
      {
        itemList: [''],
      }
    );

    const patternAdd = this.disablePatternBuilder
      ? null
      : new TComponents.Button_A(this.find('.add-pattern'), {
          text: l.trans('patternconf.des'),
          onClick: () => {
            this.props.changeHamView(l.trans('com.build'));
          },
        });

    patternDropdown.onSelection((element) => {
      this.targetIndex = patternDropdown.items.indexOf(element);
      const stackIndex = stackData.stack.patterns.indexOf(this.targetIndex);
      this.renderPatternList(stackIndex);
    });

    return {
      layerSetupInfobox,
      setBtn,
      delBtn,
      setLabelBtn,
      resetLabelBtn,
      patternDropdown,
      patternAdd,
    };
  }

  /**
   * Set pattern button click method. Render selected pattern and change UI elements
   * @alias setOnClick
   * @memberof PatternConfig
   * @param {number} i - The index of the pattern
   */
  setOnClick(i) {
    const { delBtn, setBtn, setLabelBtn } = this.child;
    const { patterns } = stackData.stack;

    if (stackData.libProp.libPatternProp.length === 0) return;

    if (patterns[i] === undefined || patterns[i] === -1) {
      // Enable the delete button,change set button icon and save the pattern index
      delBtn[i].enabled = true;
      setBtn[i].icon = setIcon;
      patterns[i] = this.targetIndex;
    } else {
      // Render the already defined pattern
      this.targetIndex = patterns[i];
    }
    // Render the pattern with label
    this.renderPatternList(i);
    setLabelBtn.text = l.trans('com.ch');
  }

  /**
   * Delete pattern button click method. Remove the pattern index and change UI elements
   * @alias deleteOnClick
   * @memberof PatternConfig
   * @param {number} i - The index of the pattern
   */
  deleteOnClick(i) {
    // Depending on i write the string first, second or top
    const index = i === 0 ? '1.' : i === 1 ? '2.' : '3.';
    TComponents.Popup_A.confirm(
      l.trans('patternconf.del_popup')[0],
      [
        l.trans('patternconf.del_popup', { var1: index })[1],
        l.trans('patternconf.del_popup')[2],
      ],
      (action) => {
        if (action !== 'ok') return;
        this.confirmDeletePattern(i);
      }
    );
  }

  /**
   * Delete product in case of confirmation
   * @alias confirmDeletePattern
   * @memberof PatternConfig
   * @param {number} index - The index of the product to be deleted
   */
  confirmDeletePattern(i) {
    const { delBtn, setBtn, setLabelBtn } = this.child;

    // Disable the delete button,change set button icon and remove the pattern index
    delBtn[i].enabled = false;
    setBtn[i].icon = notSetIcon;
    stackData.stack.patterns[i] = undefined;
    stackData.pItems[i] = undefined;
    this.renderPatternList();
    setLabelBtn.text = l.trans('com.ch');
  }

  /**
   * Set label button click method. Set the label orientation and change UI elements
   * @alias setLabelOnclick
   * @memberof PatternConfig
   */
  setLabelOnclick() {
    const canvasElem = this.pallet.canvas.canvasElem;

    if (!canvasElem.hasMouseDownEvent) {
      const stackIndex = stackData.stack.patterns.lastIndexOf(this.targetIndex);
      // Add event listener and change button text
      this.pallet.boundOnMouseDown = this.pallet.onMouseDown.bind(
        this.pallet,
        stackIndex
      );
      canvasElem.addEventListener('mousedown', this.pallet.boundOnMouseDown);
      canvasElem.hasMouseDownEvent = true;
      this.child.setLabelBtn.text = l.trans('com.save');
    } else {
      // Save label orientation in case of matching patterns and remove event listener
      stackData.patternCreation.copyLabelOrient();
      canvasElem.removeEventListener('mousedown', this.pallet.boundOnMouseDown);
      this.pallet.deselectBox();
      this.pallet.renderBoxWithLabels();
      canvasElem.hasMouseDownEvent = false;
      this.child.setLabelBtn.text = l.trans('com.ch');
    }
  }

  /**
   * Reset label button click method.
   * @alias resetLabelOnclick
   * @memberof PatternConfig
   */
  resetLabelOnclick() {
    TComponents.Popup_A.confirm(
      l.trans('patternconf.res_popup')[0],
      l.trans('patternconf.res_popup').slice(1, 3),
      (action) => {
        if (action !== 'ok') return;
        this.confirmResLabel();
      }
    );
  }

  /**
   * Reset the label orientation and change UI elements.
   * @alias confirmResLabel
   * @memberof PatternConfig
   */
  confirmResLabel() {
    const { patternCreation, stack } = stackData;
    const stackIndex = stack.patterns.lastIndexOf(this.targetIndex);
    patternCreation.calcDefaultLabelOrient(stackIndex);
    patternCreation.copyLabelOrient();
    this.pallet = drawPalletWithBoxes(
      this.find('#canvasParent'),
      stackIndex,
      stackData
    );
    this.pallet.drawBoxLabels();
    this.child.setLabelBtn.text = l.trans('com.ch');
  }

  /**
   * Calculate the box coordinates on the pallet and render the pattern on the pallet
   * @alias renderPatternList
   * @memberof PatternConfig
   */
  renderPatternList(stackIndex = -1) {
    const patternIndex = this.targetIndex;
    const labelSetupContainer = this.find('.labelpos-container');

    if (stackIndex !== -1) {
      if (stackData.pItems[stackIndex] === undefined) {
        stackData.patternCreation.calcFormulaCoordinates(
          stackIndex,
          patternIndex
        );
        let patternIndexInStack = stackData.stack.patterns.findIndex(
          (pattern, i) => pattern === patternIndex && i !== stackIndex
        );

        if (patternIndexInStack !== -1) {
          stackData.pItems[stackIndex] = stackData.pItems[patternIndexInStack];
        } else {
          stackData.patternCreation.calcDefaultLabelOrient(stackIndex);
        }
      }
      this.pallet = drawPalletWithBoxes(
        this.find('#canvasParent'),
        stackIndex,
        stackData
      );
      this.pallet.drawBoxLabels();
      // Check if there is any label set
      if (stackData.boxProp.labelPos.some((e) => e == true)) {
        labelSetupContainer.classList.add('flex-col');
      }
    } else {
      stackData.patternCreation.calcFormulaCoordinates(3, patternIndex);
      this.pallet = drawPalletWithBoxes(
        this.find('#canvasParent'),
        3,
        stackData
      );
      labelSetupContainer.classList.remove('flex-col');
    }
    if (stackData.libProp.libPatternProp[patternIndex])
      this.child.patternDropdown.selected =
        stackData.libProp.libPatternProp[patternIndex].name;
    this.nextBtnEnable(this.checkPatternsValidity());
  }

  /**
   * Check if two(odd,even) of the pattern are set
   * @alias checkPatternsValidity
   * @memberof PatternConfig
   * @returns {boolean} - True if odd,even patterns set properly otherwise false
   */
  checkPatternsValidity() {
    const patterns = stackData.stack.patterns;
    return patterns[0] !== undefined && patterns[1] !== undefined;
  }

  /**
   * Generates the HTML definition corresponding to the component.
   * html elements for different components in the layout
   * @alias markup
   * @memberof PatternConfig
   * @returns {string}
   */
  markup() {
    return /*html*/ `
        <div class="pattern-subview">
          <div class="flex-row">
            <div class="flex-1">
              <div class="my-3">
                <div class="layer-setup"></div>
                <div class="layer-setup-content pl-2 pr-2">
                  <div class="flex-row tc-space my-3 items-center">
                    <div>
                      ${l.trans('patternconf.first')} 
                      <span class="red-text">*</span>
                    </div>
                    <div class="pattern-odd"></div>
                    <div class="pattern-buttons flex">
                      <div class="set-button mr-1"></div>
                      <div class="del-button"></div>
                    </div>
                  </div>
                  <div class="flex-row tc-space my-3 items-center">
                    <div>
                      ${l.trans('patternconf.sec')}
                      <span class="red-text">*</span>
                    </div>
                    <div class="pattern-even"></div>
                    <div class="pattern-buttons flex">
                      <div class="set-button mr-1"></div>
                      <div class="del-button"></div>
                    </div>
                  </div>
                  <div class="flex-row tc-space items-center">
                    <div>${l.trans('patternconf.top')}</div>
                    <div class="pattern-top"></div>
                    <div class="pattern-buttons flex">
                      <div class="set-button mr-1"></div>
                      <div class="del-button"></div>
                    </div>
                  </div>
                  <div class="info-box labelpos-container mt-4">
                    <div class="flex">
                      <img src="${infoIcon}" class="info-icon" />
                      <div class="info-title">
                        ${l.trans('patternconf.label')[0]}
                      </div>
                    </div>
                    <div class="flex my-4 items-center tc-space">
                      <div class="info-label">
                        ${l.trans('patternconf.label')[1]}
                      </div>
                      <div class="setlabel-button"></div>
                    </div>
                    <div class="flex my-2 items-center tc-space">
                      <div class="info-label">
                        ${l.trans('patternconf.label')[2]}
                      </div>
                      <div class="resetlabel-button"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="pattern-view pl-4 pt-4 flex-1">
              <div class="pattern-container">
                <div id="canvasParent"></div>
                <img src="${coordSystem}" class="coord-sys" />
              </div>
              <div class="flex mt-12 items-center">
                <div class="pattern-label">${l.trans('patternconf.name')}</div>
                <div class="pattern-selector ml-4 mr-5"></div>
                <div class="add-pattern"></div>
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
 * @memberof PatternConfig
 */
PatternConfig.loadCssClassFromString(/*css*/ `
  #canvasParent {
    width: 100%;
    display: flex;
    justify-content: center;
  }
  .pattern-view {
    background: #fff;
    border-radius: 10px;
    margin: 0.75rem;
    height: 430px;
  }
  .pattern-selector {
    width: 190px;
  }
  .pattern-container {
    position: relative;
  }
  .coord-sys{
    position: absolute;
    left: -15px;
    bottom: -25px;
  }
  .labelpos-container{
    display: none;
  }
  .setlabel-button, .resetlabel-button{
    width: 110px;
  }
  .info-label{
    font-family: Segoe UI;
    font-size: 14px;
    font-style: normal;
  }
  .layer-setup .layout-container {
    height: 450px;
  }
  .pattern-buttons .fp-components-button-icon {
    width: 16px;
    height: 16px;
  }
  .pattern-buttons .fp-components-button, .pattern-buttons .fp-components-button-disabled {
    min-width: 10px;
    margin-right: 5px;
    padding: 0 0.5rem;
    border-radius: 10px;
  }
  .setlabel-button .fp-components-button-icon, .resetlabel-button .fp-components-button-icon{
    width: 16px;
    height: 16px;
  }
`);
