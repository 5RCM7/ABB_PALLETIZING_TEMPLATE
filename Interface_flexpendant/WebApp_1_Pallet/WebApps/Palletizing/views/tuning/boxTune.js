import { imgBoxTune, pickPos } from '../../constants/images.js';
import { argRange } from '../../constants/common.js';
import CustomIncDec from '../components/customIncDec.js';
import { fetchData } from '../../services/dataManager.js';
import { stackData } from '../../leanPallet/StackData.js';
import { l } from '../../services/translation.js';

/**
 * @class BoxTune
 * @classdesc This class is responsible for rendering the box tuning subview
 * @extends TComponents.Component_A
 * @memberof App
 * @param {HTMLElement} parent - The parent element to which the view will be rendered
 * @param {Object} props - The properties object to be passed to the view
 */
export default class BoxTune extends TComponents.Component_A {
  constructor(parent, props = {}) {
    super(parent, props);
  }

  /**
   * Instantiation of BoxTune sub-components that shall be initialized in a synchronous way.
   * All this components are then accessible within {@link onRender() onRender} method by using this.child.<component-instance>
   * Create child elements on the tuning page.
   * @alias mapComponents
   * @memberof BoxTune
   * @returns {object} Contains all child BoxTune instances used within the component.
   */
  mapComponents() {
    const { tune_range } = argRange;
    // Create 2 Infobox in the Layout
    const boxDimInfobox = new TComponents.LayoutInfobox_A(
      this.find('.box-tune'),
      {
        title: l.trans('boxtune.param'),
        content: { children: this.find('.box-tune-content') },
      }
    );
    const pickPosInfobox = new TComponents.LayoutInfobox_A(
      this.find('.pick-pos'),
      {
        title: l.trans('boxtune.pick'),
        content: { children: this.find('.pick-pos-content') },
      }
    );
    const boxLengthInput = new CustomIncDec(
      this.find('.box-tune-content .length'),
      {
        range: tune_range,
      }
    );
    const boxWidthInput = new CustomIncDec(
      this.find('.box-tune-content .width'),
      {
        range: tune_range,
      }
    );
    const boxHeightInput = new CustomIncDec(
      this.find('.box-tune-content .height'),
      {
        range: tune_range,
      }
    );
    const posXInput = new CustomIncDec(this.find('.pos-x'), {
      range: tune_range,
    });
    const posYInput = new CustomIncDec(this.find('.pos-y'), {
      range: tune_range,
    });
    const posZInput = new CustomIncDec(this.find('.pos-z'), {
      range: tune_range,
    });
    // Create buttons for updating and resetting the values
    const setBoxBtn = new TComponents.Button_A(
      this.find('.box-tune-content .set-button'),
      {
        text: l.trans('com.set'),
        onClick: () => this.setBoxParams(),
      }
    );
    const resetBoxBtn = new TComponents.Button_A(
      this.find('.box-tune-content .reset-button'),
      {
        text: l.trans('com.def'),
        onClick: () => this.updateBoxParams(),
      }
    );
    const setPickBtn = new TComponents.Button_A(
      this.find('.pick-pos-content .set-button'),
      {
        text: l.trans('com.set'),
        onClick: () => this.setPickParams(),
      }
    );
    const resetPickBtn = new TComponents.Button_A(
      this.find('.pick-pos-content .reset-button'),
      {
        text: l.trans('com.def'),
        onClick: () => this.updatePickParams(),
      }
    );
    return {
      boxDimInfobox,
      pickPosInfobox,
      boxLengthInput,
      boxWidthInput,
      boxHeightInput,
      setBoxBtn,
      resetBoxBtn,
      posXInput,
      posYInput,
      posZInput,
      setPickBtn,
      resetPickBtn,
    };
  }

  /**
   * Set the box parameters in RAPID
   * @alias resetBoxParams
   * @memberof BoxTune
   */
  async setBoxParams() {
    const boxLengthOffs = parseInt(this.child.boxLengthInput.text);
    const boxWidthOffs = parseInt(this.child.boxWidthInput.text);
    const boxHeightOffs = parseInt(this.child.boxHeightInput.text);

    RWS.Rapid.setDataValue('T_ROB1', 'AppData', 'OffsBoxLength', boxLengthOffs);
    RWS.Rapid.setDataValue('T_ROB1', 'AppData', 'OffsBoxWidth', boxWidthOffs);
    RWS.Rapid.setDataValue('T_ROB1', 'AppData', 'OffsBoxHeight', boxHeightOffs);

    const dataKeys = [
      'XOffsPick',
      'YOffsPick',
      'ZOffsPick',
      'PickSpeed',
      'PalletSpeed',
      'PlaceSpeed',
      'ReturnSpeed',
      'Acceleration',
      'PickTime',
      'PlaceTime',
    ];
    const fetchedData = await Promise.all(
      dataKeys.map((key) => fetchData('AppData', key).then((res) => res.value))
    );

    const dataToSave = [
      ...fetchedData.slice(0, 3),
      boxLengthOffs,
      boxWidthOffs,
      boxHeightOffs,
      ...fetchedData.slice(3),
    ];

    stackData.pBuilder.saveTuneData(dataToSave);
  }

  /**
   * Set the pick position parameters in RAPID
   * @alias resetPickParams
   * @memberof BoxTune
   */
  async setPickParams() {
    const XOffsPick = parseInt(this.child.posXInput.text);
    const YOffsPick = parseInt(this.child.posYInput.text);
    const ZOffsPick = parseInt(this.child.posZInput.text);

    RWS.Rapid.setDataValue('T_ROB1', 'AppData', 'XOffsPick', XOffsPick);
    RWS.Rapid.setDataValue('T_ROB1', 'AppData', 'YOffsPick', YOffsPick);
    RWS.Rapid.setDataValue('T_ROB1', 'AppData', 'ZOffsPick', ZOffsPick);

    RWS.Rapid.setDataValue('T_ROB1', 'AppData', 'SaveData', true);

    const dataKeys = [
      'OffsBoxLength',
      'OffsBoxWidth',
      'OffsBoxHeight',
      'PickSpeed',
      'PalletSpeed',
      'PlaceSpeed',
      'ReturnSpeed',
      'Acceleration',
      'PickTime',
      'PlaceTime',
    ];
    const fetchedData = await Promise.all(
      dataKeys.map((key) => fetchData('AppData', key).then((res) => res.value))
    );

    stackData.pBuilder.saveTuneData([
      XOffsPick,
      YOffsPick,
      ZOffsPick,
      ...fetchedData,
    ]);
  }

  /**
   * Update box parameter inputs with RAPID values
   * @alias resetBoxParams
   * @memberof BoxTune
   */
  async updateBoxParams() {
    const [boxLengthOffs, boxWidthOffs, boxHeightOffs] = await Promise.all([
      fetchData('AppData', 'OffsBoxLength').then((res) => res.value),
      fetchData('AppData', 'OffsBoxWidth').then((res) => res.value),
      fetchData('AppData', 'OffsBoxHeight').then((res) => res.value),
    ]);

    this.child.boxLengthInput.text = boxLengthOffs;
    this.child.boxWidthInput.text = boxWidthOffs;
    this.child.boxHeightInput.text = boxHeightOffs;
  }

  /**
   * Update pick position inputs with RAPID values
   * @alias resetPickParams
   * @memberof BoxTune
   */
  async updatePickParams() {
    const [XOffsPick, YOffsPick, ZOffsPick] = await Promise.all([
      fetchData('AppData', 'XOffsPick').then((res) => res.value),
      fetchData('AppData', 'YOffsPick').then((res) => res.value),
      fetchData('AppData', 'ZOffsPick').then((res) => res.value),
    ]);

    this.child.posXInput.text = XOffsPick;
    this.child.posYInput.text = YOffsPick;
    this.child.posZInput.text = ZOffsPick;
  }

  /**
   * Contains all synchronous operations/setups that may be required for any sub-component after its initialization and/or manipulation of the DOM.
   * This method is called internally during rendering process orchestrated by {@link render() render}.
   * Add a validator for the inputbox
   * @alias onRender
   * @memberof BoxTune
   */
  onRender() {
    this.updateBoxParams();
    this.updatePickParams();
  }

  /**
   * Generates the HTML definition corresponding to the component.
   * html elements for different components in the layout
   * @alias markup
   * @memberof BoxTune
   * @returns {string}
   */
  markup() {
    return /*html*/ `
        <div id="tuning-subview">
          <div class="mt-3">
            <div class="box-tune my-3 mr-2">
              <div class="box-tune-content pl-5">
                <div class="flex">
                  <div class="flex-07">
                    <div class="flex-row tc-space my-3 items-center">
                      <div class="">${l.trans('com.l')} L1 (mm)</div>
                      <div class="length"></div>
                    </div>
                    <div class="flex-row tc-space my-3 items-center">
                      <div class="">${l.trans('com.w')} W1 (mm)</div>
                      <div class="width"></div>
                    </div>
                    <div class="flex-row tc-space my-3 items-center">
                      <div class="">${l.trans('com.h')} H1 (mm)</div>
                      <div class="height"></div>
                    </div>
                  </div>
                  <div class="img-container flex-1">
                    <img src="${imgBoxTune}" class="tune-img" />
                  </div>
                </div>
                <div class="control-buttons flex-row gap-5 mb-1 justify-end">
                  <div class="reset-button"></div>
                  <div class="set-button"></div>
                </div>
              </div>
            </div>
            <div class="pick-pos mr-2">
              <div class="pick-pos-content pl-5">
                <div class="flex">
                  <div class="flex-07">
                    <div class="flex-row tc-space my-3 items-center">
                      <div class="">${l.trans('boxtune.pos')} X (mm)</div>
                      <div class="pos-x"></div>
                    </div>
                    <div class="flex-row tc-space my-3 items-center">
                      <div class="">${l.trans('boxtune.pos')} Y (mm)</div>
                      <div class="pos-y"></div>
                    </div>
                    <div class="flex-row tc-space my-3 items-center">
                      <div class="">${l.trans('boxtune.pos')} Z (mm)</div>
                      <div class="pos-z"></div>
                    </div>
                  </div>
                  <div class="img-container flex-1">
                    <img src="${pickPos}" class="tune-img" />
                  </div>
                </div>
                <div class="control-buttons flex-row gap-5 mb-1 justify-end">
                  <div class="reset-button"></div>
                  <div class="set-button"></div>
                </div>
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
 * @memberof BoxTune
 */
BoxTune.loadCssClassFromString(/*css*/ `
  .tune-img {
    width: auto;
    height: 150px;
  }
`);
