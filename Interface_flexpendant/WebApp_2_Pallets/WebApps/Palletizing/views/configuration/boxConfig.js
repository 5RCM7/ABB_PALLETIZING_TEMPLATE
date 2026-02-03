import {
  imgBox,
  imgBoxPos,
  imgLabelPosSSL,
  imgLabelPosLSL,
} from '../../constants/images.js';
import {
  floatRegex,
  checkInputRange,
  argRange,
  intRegex,
} from '../../constants/common.js';
import { stackData } from '../../leanPallet/StackData.js';
import { l } from '../../services/translation.js';

/**
 * @class BoxConfig
 * @classdesc This class is responsible for rendering the box configuration subview
 * @extends TComponents.Component_A
 * @memberof MultiStep
 * @param {HTMLElement} parent - The parent element to which the view will be rendered
 * @param {Object} props - The properties object to be passed to the view
 */
export default class BoxConfig extends TComponents.Component_A {
  constructor(parent, props = {}) {
    super(parent, props);
    // Create radio buttons
    this.sslead = new FPComponents.Radio_A();
    this.lslead = new FPComponents.Radio_A();
    // Create check boxes
    this.frontL = new FPComponents.Checkbox_A();
    this.leftL = new FPComponents.Checkbox_A();
    this.backL = new FPComponents.Checkbox_A();
    this.rightL = new FPComponents.Checkbox_A();
  }

  /**
   * Contains component specific asynchronous implementation (like access to controller).
   * This method is called internally during initialization process orchestrated by {@link init() init}.
   * Get the RAPID data that used in UI
   * @alias onInit
   * @memberof BoxConfig
   */
  async onInit() {
    // Loading the RAPID data
    await stackData.projectProp.GetRAPIDdata();
  }

  /**
   * Instantiation of BoxConfig sub-components that shall be initialized in a synchronous way.
   * All this components are then accessible within {@link onRender() onRender} method by using this.child.<component-instance>
   * Create elements for box setup.
   * @alias mapComponents
   * @memberof BoxConfig
   * @returns {object} Contains all child BoxConfig instances used within the component.
   */
  mapComponents() {
    // Create 4 Infobox in the Layout
    const boxDimInfobox = new TComponents.LayoutInfobox_A(
      this.find('.box-dim'),
      {
        title: l.trans('boxconf.param'),
        content: { children: this.find('.box-dim-content') },
      }
    );
    const boxPosInfobox = new TComponents.LayoutInfobox_A(
      this.find('.box-pos'),
      {
        title: l.trans('boxconf.posc'),
        content: { children: this.find('.box-pos-content') },
      }
    );
    const labelPosInfobox = new TComponents.LayoutInfobox_A(
      this.find('.label-pos'),
      {
        title: l.trans('boxconf.label'),
        content: { children: this.find('.label-pos-content') },
      }
    );
    const boxCountInput = new TComponents.Input_A(this.find('.box-count'), {
      text: '1',
    });
    boxCountInput.regex = intRegex;
    const { boxLength, boxWidth, boxHeight, boxWeight } = argRange;
    const lengthInput = new TComponents.Input_A(this.find('.box-length'), {
      text: '0',
      description: l.trans('com.val_ch', {
        var1: boxLength.min,
        var2: boxLength.max,
      }),
    });
    lengthInput.regex = floatRegex;
    lengthInput.validator = (value) =>
      checkInputRange(value, boxLength.min, boxLength.max);
    const widthInput = new TComponents.Input_A(this.find('.box-width'), {
      text: '0',
      description: l.trans('com.val_ch', {
        var1: boxWidth.min,
        var2: boxWidth.max,
      }),
    });
    widthInput.regex = floatRegex;
    widthInput.validator = (value) =>
      checkInputRange(value, boxWidth.min, boxWidth.max);
    const heightInput = new TComponents.Input_A(this.find('.box-height'), {
      text: '0',
      description: l.trans('com.val_ch', {
        var1: boxHeight.min,
        var2: boxHeight.max,
      }),
    });
    heightInput.regex = floatRegex;
    heightInput.validator = (value) =>
      checkInputRange(value, boxHeight.min, boxHeight.max);
    const weightInput = new TComponents.Input_A(this.find('.box-weight'), {
      text: '0',
      description: l.trans('com.val_ch', {
        var1: boxWeight.min,
        var2: boxWeight.max,
      }),
    });
    weightInput.regex = floatRegex;
    weightInput.validator = (value) =>
      checkInputRange(value, boxWeight.min, boxWeight.max);
    return {
      boxDimInfobox,
      boxPosInfobox,
      labelPosInfobox,
      boxCountInput,
      lengthInput,
      widthInput,
      heightInput,
      weightInput,
    };
  }

  /**
   * Contains all synchronous operations/setups that may be required for any sub-component after its initialization and/or manipulation of the DOM.
   * This method is called internally during rendering process orchestrated by {@link render() render}.
   * Create elements for box dimensions, label position and box weight.
   * @alias onRender
   * @memberof ConfView
   */
  onRender() {
    // Setup radio buttons
    this.sslead.desc = l.trans('boxconf.ssl');
    this.lslead.desc = l.trans('boxconf.lsl');
    this.sslead.attachToElement(this.find('.ssl-radio'));
    this.lslead.attachToElement(this.find('.lsl-radio'));
    this.sslead.onclick = () => {
      this.lslead.checked = false;
      this.find('.labelpos-img').src = imgLabelPosSSL;
      this.child.boxCountInput.validator = (value) =>
        checkInputRange(value, 1, stackData.projectProp.maxPickSSL);
      this.child.boxCountInput.description = l.trans('com.val_ch', {
        var1: 1,
        var2: stackData.projectProp.maxPickSSL,
      });
      stackData.projectProp.maxPickSSL === 1
        ? (this.find('.boxes-pick').style.display = 'none')
        : (this.find('.boxes-pick').style.display = 'flex');
    };
    this.lslead.onclick = () => {
      this.sslead.checked = false;
      this.find('.labelpos-img').src = imgLabelPosLSL;
      this.child.boxCountInput.validator = (value) =>
        checkInputRange(value, 1, stackData.projectProp.maxPickLSL);
      this.child.boxCountInput.description = l.trans('com.val_ch', {
        var1: 1,
        var2: stackData.projectProp.maxPickLSL,
      });
      stackData.projectProp.maxPickLSL === 1
        ? (this.find('.boxes-pick').style.display = 'none')
        : (this.find('.boxes-pick').style.display = 'flex');
    };
    if (stackData.projectProp.maxPickLSL === 0)
      this.find('.lsl-radio').style.display = 'none';

    if (stackData.projectProp.maxPickSSL === 0) {
      this.find('.ssl-radio').style.display = 'none';
    }
    // Setup check boxes
    this.frontL.desc = `${l.trans('boxconf.side')} 1`;
    this.leftL.desc = `${l.trans('boxconf.side')} 2`;
    this.backL.desc = `${l.trans('boxconf.side')} 3`;
    this.rightL.desc = `${l.trans('boxconf.side')} 4`;
    this.frontL.attachToElement(this.find('.front-chB'));
    this.leftL.attachToElement(this.find('.left-chB'));
    this.backL.attachToElement(this.find('.back-chB'));
    this.rightL.attachToElement(this.find('.right-chB'));
  }

  /**
   * Generates the HTML definition corresponding to the component.
   * html elements for different components in the layout
   * @alias markup
   * @memberof BoxConfig
   * @returns {string}
   */
  markup() {
    return /*html*/ `
        <div id="box-subview">
          <div class="flex-row">
            <div class="box-dim flex-1 my-3">
              <div class="box-dim-content pl-2 pr-2">
                <div class="img-container">
                  <img src="${imgBox}" class="boxdim-img" />
                </div>
                <div class="flex-row tc-space my-1 items-center">
                  <div>${l.trans('com.l')} L (mm)</div>
                  <div class="box-length"></div>
                </div>
                <div class="flex-row tc-space my-1 items-center">
                  <div>${l.trans('com.w')} W (mm)</div>
                  <div class="box-width"></div>
                </div>
                <div class="flex-row tc-space my-1 items-center">
                  <div>${l.trans('com.h')} H (mm)</div>
                  <div class="box-height"></div>
                </div>
                <div class="flex-row tc-space my-3 items-center">
                  <div>${l.trans('boxconf.we')} (kg)</div>
                  <div class="box-weight"></div>
                </div>
              </div>
            </div>
            <div class="box-pos flex-1 my-3">
              <div class="box-pos-content pl-2 pr-2">
                <div class="img-container">
                  <img src="${imgBoxPos}" class="boxpos-img" />
                </div>
                <div class="ssl-radio my-5"></div>
                <div class="lsl-radio"></div>
                <div class="boxes-pick flex-row tc-space mt-12 items-center">
                  <div>${l.trans('boxconf.pick')}</div>
                  <div class="box-count"></div>
                </div>
              </div>
            </div>
            <div class="label-pos flex-1 my-3">
              <div class="label-pos-content pl-2">
                <div class="img-container">
                  <img src="${imgLabelPosSSL}" class="labelpos-img" />
                </div>
                <div class="front-chB my-5"></div>
                <div class="left-chB my-5"></div>
                <div class="back-chB my-5"></div>
                <div class="right-chB my-5"></div>
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
 * @memberof BoxConfig
 */
BoxConfig.loadCssClassFromString(/*css*/ `
  .boxdim-img, .boxpos-img, .labelpos-img {
    width: auto;
    height: 150px;
  }
  #box-subview .fp-components-input{
    width: 100px;
  }
  .box-dim-content > *:last-child{
    border-top: solid 0.25px #979797;
    padding-top: 0.5rem;
  }
  .box-dim .layout-container,.box-pos .layout-container, .label-pos .layout-container{
    height: 415px;
  }
  .fp-components-checkbox-desc, .fp-components-radio-desc {
    font-size: unset !important;
  }
`);
