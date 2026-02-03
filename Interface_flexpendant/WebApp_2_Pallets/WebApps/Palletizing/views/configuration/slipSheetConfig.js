import { imgSlSheet, infoIcon } from '../../constants/images.js';
import {
  floatRegex,
  checkInputRange,
  argRange,
} from '../../constants/common.js';
import { stackData } from '../../leanPallet/StackData.js';
import { l } from '../../services/translation.js';

/**
 * @class SlSheetConfig
 * @classdesc This class is responsible for rendering the slip sheet configuration subview
 * @extends TComponents.Component_A
 * @memberof MultiStep
 * @param {HTMLElement} parent - The parent element to which the view will be rendered
 * @param {Object} props - The properties object to be passed to the view
 */
export default class SlSheetConfig extends TComponents.Component_A {
  constructor(parent, props = {}) {
    super(parent, props);
    this.slSheetUsed = new FPComponents.Checkbox_A();
  }

  /**
   * Instantiation of SlSheetConfig sub-components that shall be initialized in a synchronous way.
   * All this components are then accessible within {@link onRender() onRender} method by using this.child.<component-instance>
   * Create elements for the slip sheet setup.
   * @alias mapComponents
   * @memberof SlSheetConfig
   * @returns {object} Contains all child SlSheetConfig instances used within the component.
   */
  mapComponents() {
    // Create infobox in the Layout
    const slSheetUsedInfobox = new TComponents.LayoutInfobox_A(
      this.find('.slsheet-used'),
      {
        title: l.trans('slipconf.title'),
        content: { children: [this.find('.slsheet-used-content')] },
      }
    );
    const slSheetDimInfobox = new TComponents.LayoutInfobox_A(
      this.find('.slsheet-dim'),
      {
        title: l.trans('com.dim'),
        content: { children: [this.find('.slsheet-dim-content')] },
      }
    );
    // Create inputboxes
    const { palletLength, palletWidth, slipSThickness, slStackHeight } =
      argRange;
    const lengthInput = new TComponents.Input_A(this.find('.slsheet-length'), {
      text: '0',
      description: l.trans('com.val_ch', {
        var1: palletLength.min,
        var2: palletLength.max,
      }),
    });
    lengthInput.regex = floatRegex;
    lengthInput.validator = (value) =>
      checkInputRange(value, palletLength.min, palletLength.max);
    const widthInput = new TComponents.Input_A(this.find('.slsheet-width'), {
      text: '0',
      description: l.trans('com.val_ch', {
        var1: palletWidth.min,
        var2: palletWidth.max,
      }),
    });
    widthInput.regex = floatRegex;
    widthInput.validator = (value) =>
      checkInputRange(value, palletWidth.min, palletWidth.max);
    const thicknessInput = new TComponents.Input_A(
      this.find('.slsheet-thickness'),
      {
        text: '0',
        description: l.trans('com.val_ch', {
          var1: slipSThickness.min,
          var2: slipSThickness.max,
        }),
      }
    );
    thicknessInput.regex = floatRegex;
    thicknessInput.validator = (value) =>
      checkInputRange(value, slipSThickness.min, slipSThickness.max);
    const stackHeightInput = new TComponents.Input_A(
      this.find('.stack-height'),
      {
        description: l.trans('com.val_ch', {
          var1: slStackHeight.min,
          var2: slStackHeight.max,
        }),
        onChange: () => this.nextBtnEnable(this.checkSlParam()),
      }
    );
    stackHeightInput.regex = floatRegex;
    stackHeightInput.validator = (value) =>
      checkInputRange(value, slStackHeight.min, slStackHeight.max);
    return {
      slSheetUsedInfobox,
      slSheetDimInfobox,
      lengthInput,
      widthInput,
      thicknessInput,
      stackHeightInput,
    };
  }

  /**
   * Contains all synchronous operations/setups that may be required for any sub-component after its initialization and/or manipulation of the DOM.
   * This method is called internally during rendering process orchestrated by {@link render() render}.
   * Create elements for box dimensions, label position and box weight.
   * @alias onRender
   * @memberof SlSheetConfig
   */
  onRender() {
    // Setup check boxes
    this.slSheetUsed.desc = l.trans('slipconf.use');
    this.slSheetUsed.attachToElement(this.find('.slsheet-chbox'));
    this.slSheetUsed.onclick = () => {
      if (this.slSheetUsed.checked) {
        this.child.lengthInput.text = stackData.palletProp.length;
        this.child.widthInput.text = stackData.palletProp.width;
        this.child.thicknessInput.text = 5;
        this.child.stackHeightInput.text = '';
        this.find('.slsheet-dim').style.display = 'block';
      } else {
        this.find('.slsheet-dim').style.display = 'none';
      }
      this.nextBtnEnable(this.checkSlParam());
    };
  }

  /**
   * Check if stack height is set properly if slip sheet is used
   * @alias checkSlParam
   * @memberof SlSheetConfig
   * @returns {boolean} - True if stack height is set properly
   */
  checkSlParam() {
    if (this.slSheetUsed.checked) {
      if (this.child.stackHeightInput.text === '') {
        return false;
      }
    }
    return true;
  }

  /**
   * Generates the HTML definition corresponding to the component.
   * html elements for different components in the layout
   * @alias markup
   * @memberof SlSheetConfig
   * @returns {string}
   */
  markup() {
    return /*html*/ `
        <div id="slipsheet-subview">
          <div class="flex-row">
            <div class="flex-07">
              <div class="my-3">
                <div class="slsheet-used"></div>
                <div class="slsheet-used-content pl-4 pt-2">
                  <div class="slsheet-chbox"></div>
                </div>
              </div>
              <div class="slsheet-dim"></div>
              <div class="slsheet-dim-content pl-2 pr-2">
                <div class="flex-row tc-space items-center">
                  <div>${l.trans('com.l')} L (mm)</div>
                  <div class="slsheet-length"></div>
                </div>
                <div class="flex-row tc-space items-center">
                  <div>${l.trans('com.w')} W (mm)</div>
                  <div class="slsheet-width"></div>
                </div>
                <div class="flex-row tc-space items-center">
                  <div>${l.trans('slipconf.th')} (mm)</div>
                  <div class="slsheet-thickness"></div>
                </div>
                <div class="flex-row tc-space items-center">
                  <div>
                    ${l.trans('slipconf.h')} (mm) 
                    <span class="red-text">*</span>
                  </div>
                  <div class="stack-height"></div>
                </div>
              </div>
              <div class="info-box ml-2 mt-4">
                <div class="flex">
                  <img src="${infoIcon}" class="info-icon" />
                  <div class="info-title">${l.trans('slipconf.title')}</div>
                </div>
                <div class="info-desc pl-8 my-1">
                  ${l.trans('slipconf.info')}
                </div>
              </div>
            </div>
            <div class="flex-1 flex wh-cont justify-center items-center">
              <img src="${imgSlSheet}" class="slsheet-img" />
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
 * @memberof SlSheetConfig
 */
SlSheetConfig.loadCssClassFromString(/*css*/ `
  .slsheet-img {
    width: 350px;
    height: auto;
  }
  #slipsheet-subview .fp-components-input{
    width: 100px;
  }
`);
