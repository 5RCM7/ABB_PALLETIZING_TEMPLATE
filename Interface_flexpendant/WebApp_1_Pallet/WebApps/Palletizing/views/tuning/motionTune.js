import { imgBoxPos, placePos } from '../../constants/images.js';
import { fetchData } from '../../services/dataManager.js';
import {
  checkInputRange,
  floatRegex,
  intRegex,
  argRange,
} from '../../constants/common.js';
import { stackData } from '../../leanPallet/StackData.js';
import { l } from '../../services/translation.js';

/**
 * @class MotionTune
 * @classdesc This class is responsible for rendering the motion tuning subview
 * @extends TComponents.Component_A
 * @memberof App
 * @param {HTMLElement} parent - The parent element to which the view will be rendered
 * @param {Object} props - The properties object to be passed to the view
 */
export default class MotionTune extends TComponents.Component_A {
  constructor(parent, props = {}) {
    super(parent, props);

    this._params = [
      'pickSpeed',
      'palletSpeed',
      'placeSpeed',
      'returnSpeed',
      'acceleration',
      'pickTime',
      'placeTime',
    ];
  }

  async onInit() {
    const task = await API.RAPID.getTask();
    for (const param of this._params) {
      const varElement = await task.getVariable('AppData', param);
      varElement.onChanged((newValue) =>
        this.cbUpdateInputField(param, newValue)
      );
    }
  }

  /**
   * Instantiation of MotionTune sub-components that shall be initialized in a synchronous way.
   * All this components are then accessible within {@link onRender() onRender} method by using this.child.<component-instance>
   * Create child elements on the motion tuning page.
   * @alias mapComponents
   * @memberof MotionTune
   * @returns {object} Contains all child MotionTune instances used within the component.
   */
  mapComponents() {
    // Create Infobox in the Layout
    const motionInfobox = new TComponents.LayoutInfobox_A(
      this.find('.motion'),
      {
        title: l.trans('motune.param'),
        content: { children: this.find('.motion-content') },
      }
    );
    const { acc, time } = argRange;
    const accelerationInput = new TComponents.Input_A(this.find('.acc'), {
      description: l.trans('com.val_ch', { var1: acc.min, var2: acc.max }),
    });
    accelerationInput.regex = intRegex;
    accelerationInput.validator = (value) =>
      checkInputRange(value, acc.min, acc.max);
    const pickSpeedInput = new TComponents.Input_A(this.find('.pick-speed'));
    pickSpeedInput.regex = intRegex;
    const palletSpeedInput = new TComponents.Input_A(
      this.find('.pallet-speed')
    );
    palletSpeedInput.regex = intRegex;
    const placeSpeedInput = new TComponents.Input_A(this.find('.place-speed'));
    placeSpeedInput.regex = intRegex;
    const returnSpeedInput = new TComponents.Input_A(
      this.find('.return-speed')
    );
    returnSpeedInput.regex = intRegex;
    const pickTimeInput = new TComponents.Input_A(this.find('.pick-time'), {
      description: l.trans('com.val_ch', { var1: time.min, var2: time.max }),
    });
    pickTimeInput.regex = floatRegex;
    pickTimeInput.validator = (value) =>
      checkInputRange(value, time.min, time.max);
    const placeTimeInput = new TComponents.Input_A(this.find('.place-time'), {
      description: l.trans('com.val_ch', { var1: time.min, var2: time.max }),
    });
    placeTimeInput.regex = floatRegex;
    placeTimeInput.validator = (value) =>
      checkInputRange(value, time.min, time.max);
    const setMotionBtn = new TComponents.Button_A(
      this.find('.motion-content .set-button'),
      {
        text: l.trans('com.set'),
        onClick: () => this.setMotionParams(),
      }
    );
    const resetMotionBtn = new TComponents.Button_A(
      this.find('.motion-content .reset-button'),
      {
        text: l.trans('com.def'),
        onClick: () => this.updateMotionParams(),
      }
    );
    return {
      motionInfobox,
      accelerationInput,
      pickSpeedInput,
      palletSpeedInput,
      placeSpeedInput,
      returnSpeedInput,
      pickTimeInput,
      placeTimeInput,
      setMotionBtn,
      resetMotionBtn,
    };
  }

  /**
   * Callback to updates the input field of a child component with a new value. This callback is associated with the corresponding RAPID variables in onInit method
   *
   * @param {string} param - The parameter name corresponding to the input field to update.
   * @param {string} newValue - The new value to set for the input field.
   */
  cbUpdateInputField(param, newValue) {
    if (this.child && this.child[`${param}Input`]) {
      this.child[`${param}Input`].text = newValue;
    }
  }

  /**
   * Set the motion parameters in RAPID
   * @alias setMotionParams
   * @memberof MotionTune
   */
  async setMotionParams() {
    const paramsVals = this._params.map(
      (param) => this.child[`${param}Input`].text
    );
    this._params.forEach((param, i) =>
      RWS.Rapid.setDataValue('T_ROB1', 'AppData', param, paramsVals[i])
    );

    const dataKeys = [
      'XOffsPick',
      'YOffsPick',
      'ZOffsPick',
      'OffsBoxLength',
      'OffsBoxWidth',
      'OffsBoxHeight',
    ];
    const fetchedData = await Promise.all(
      dataKeys.map((key) => fetchData('AppData', key).then((res) => res.value))
    );

    stackData.pBuilder.saveTuneData([...fetchedData, ...paramsVals]);
  }

  /**
   * Update motion parameter inputs with RAPID values
   * @alias updateMotionParams
   * @memberof MotionTune
   */
  async updateMotionParams() {
    const [
      pickSpeed,
      palletSpeed,
      placeSpeed,
      returnSpeed,
      acc,
      pickTime,
      placeTime,
    ] = await Promise.all([
      fetchData('AppData', 'PickSpeed').then((res) => res.value),
      fetchData('AppData', 'PalletSpeed').then((res) => res.value),
      fetchData('AppData', 'PlaceSpeed').then((res) => res.value),
      fetchData('AppData', 'ReturnSpeed').then((res) => res.value),
      fetchData('AppData', 'Acceleration').then((res) => res.value),
      fetchData('AppData', 'PickTime').then((res) => res.value),
      fetchData('AppData', 'PlaceTime').then((res) => res.value),
    ]);

    this.child.pickSpeedInput.text = pickSpeed;
    this.child.palletSpeedInput.text = palletSpeed;
    this.child.placeSpeedInput.text = placeSpeed;
    this.child.returnSpeedInput.text = returnSpeed;
    this.child.accelerationInput.text = acc;
    this.child.pickTimeInput.text = pickTime;
    this.child.placeTimeInput.text = placeTime;
  }

  /**
   * Contains all synchronous operations/setups that may be required for any sub-component after its initialization and/or manipulation of the DOM.
   * This method is called internally during rendering process orchestrated by {@link render() render}.
   * Add a validator for the inputbox
   * @alias onRender
   * @memberof MotionTune
   */
  async onRender() {
    this.updateMotionParams();
    this.all('.speed-icon-cont').forEach((icon, index) => {
      icon.addEventListener(
        'click',
        function () {
          const speedText = this.all('.tooltip-text')[index];
          speedText.classList.toggle('show');
          icon.classList.toggle('clicked');
        }.bind(this)
      );
    });
    // Get the maximum speed from MOC cfg
    const motion_plan = await RWS.CFG.getInstanceByName(
      'moc',
      'motion_planner',
      'motion_planner_1'
    );
    const attributes = await motion_plan.getAttributes();
    const max_speed = parseInt(attributes.linear_max_speed) * 1000;
    // Set range for speed inputs
    this.child.pickSpeedInput.validator = (value) =>
      checkInputRange(value, 0, max_speed);
    this.child.pickSpeedInput.description = l.trans('com.val_ch', {
      var1: 0,
      var2: max_speed,
    });
    this.child.palletSpeedInput.validator = (value) =>
      checkInputRange(value, 0, max_speed);
    this.child.palletSpeedInput.description = l.trans('com.val_ch', {
      var1: 0,
      var2: max_speed,
    });
    this.child.placeSpeedInput.validator = (value) =>
      checkInputRange(value, 0, max_speed);
    this.child.placeSpeedInput.description = l.trans('com.val_ch', {
      var1: 0,
      var2: max_speed,
    });
    this.child.returnSpeedInput.validator = (value) =>
      checkInputRange(value, 0, max_speed);
    this.child.returnSpeedInput.description = l.trans('com.val_ch', {
      var1: 0,
      var2: max_speed,
    });
  }

  /**
   * Generates the HTML definition corresponding to the component.
   * html elements for different components in the layout
   * @alias markup
   * @memberof MotionTune
   * @returns {string}
   */
  markup() {
    return /*html*/ `
        <div id="tuning-subview">
          <div class="flex-row mt-3">
            <div class="motion flex-1 mr-2">
              <div class="motion-content">
                <div class="flex">
                  <div class="flex-1 mt-10">
                    <div class="upper-cont flex justify-center mt-4">
                      <svg class="arrow" width="124" height="53" viewBox="0 0 124 53" fill="none">
                        <path d="M123.5 3.43622L118.5 0.549473L118.5 6.32298L123.5 3.43622ZM1.04292 3.43622L1.04292 2.93622L0.54292 2.93622L0.542921 3.43623L1.04292 3.43622ZM1.54298 52.4363L1.54292 3.43622L0.542921 3.43623L0.542975 52.4363L1.54298 52.4363ZM1.04292 3.93622L119 3.93622L119 2.93622L1.04292 2.93622L1.04292 3.93622Z" fill="black"/>
                      </svg>
                      <div class="speed-cont tooltip">
                        <div class="speed-icon-cont">
                          <svg class="speed-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M1.51959 13.5H4.3V15H0V14.25C0 7.15146 4.77303 1.5 12 1.5C19.227 1.5 24 7.15146 24 14.25V15H19.7V13.5H22.4804C22.1767 7.72703 18.3669 3.37899 12.75 3.02352V6H11.25V3.02352C5.63315 3.37899 1.82329 7.72703 1.51959 13.5Z" fill="#1F1F1F"/>
                            <path d="M9 15V18H12L15 9L9 15Z" fill="#1F1F1F" />
                          </svg>
                        </div>
                        <span class="tooltip-text top">${l.trans(
                          'motune.padsc'
                        )}</span>
                        <div class="speed-text">${l.trans('motune.vpall')}</div>
                      </div>
                      <svg class="arrow" width="143" height="50" viewBox="0 0 143 50" fill="none">
                        <path d="M1.00009 0.936269C0.723946 0.936269 0.500089 1.16013 0.500089 1.43627C0.500089 1.71241 0.723947 1.93627 1.00009 1.93627L1.00009 0.936269ZM139.861 49.4363L142.747 44.4363L136.974 44.4363L139.861 49.4363ZM139.861 1.4362L140.361 1.4362L140.361 0.936204L139.861 0.936205L139.861 1.4362ZM1.00009 1.93627L139.861 1.9362L139.861 0.936205L1.00009 0.936269L1.00009 1.93627ZM139.361 1.4362L139.361 44.9363L140.361 44.9363L140.361 1.4362L139.361 1.4362Z" fill="black"/>
                      </svg>
                    </div>
                    <div class="lower-cont flex justify-center mt-4">
                      <div class="speed-cont tooltip">
                        <div class="speed-icon-cont">
                          <svg class="speed-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M1.51959 13.5H4.3V15H0V14.25C0 7.15146 4.77303 1.5 12 1.5C19.227 1.5 24 7.15146 24 14.25V15H19.7V13.5H22.4804C22.1767 7.72703 18.3669 3.37899 12.75 3.02352V6H11.25V3.02352C5.63315 3.37899 1.82329 7.72703 1.51959 13.5Z" fill="#1F1F1F"/>
                            <path d="M9 15V18H12L15 9L9 15Z" fill="#1F1F1F" />
                          </svg>
                        </div>
                        <span class="tooltip-text bottom">
                          ${l.trans('motune.pidsc')}
                        </span>
                        <div class="speed-text">${l.trans('motune.vpick')}</div>
                      </div>
                      <svg class="arrow" width="90" height="7" viewBox="0 0 90 7" fill="none">
                        <path d="M0 3.43628L5 6.32303L5 0.549528L0 3.43628ZM89 3.93628C89.2761 3.93628 89.5 3.71242 89.5 3.43628C89.5 3.16014 89.2761 2.93628 89 2.93628V3.93628ZM4.5 3.93628L89 3.93628V2.93628L4.5 2.93628V3.93628Z" fill="black"/>
                      </svg>
                      <div class="speed-cont tooltip">
                        <div class="speed-icon-cont">
                          <svg class="speed-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M1.51959 13.5H4.3V15H0V14.25C0 7.15146 4.77303 1.5 12 1.5C19.227 1.5 24 7.15146 24 14.25V15H19.7V13.5H22.4804C22.1767 7.72703 18.3669 3.37899 12.75 3.02352V6H11.25V3.02352C5.63315 3.37899 1.82329 7.72703 1.51959 13.5Z" fill="#1F1F1F"/>
                            <path d="M9 15V18H12L15 9L9 15Z" fill="#1F1F1F" />
                          </svg>
                        </div>
                        <span class="tooltip-text bottom">
                          ${l.trans('motune.redsc')}
                        </span>
                        <div class="speed-text">${l.trans('motune.vret')}</div>
                      </div>
                      <svg class="arrow" width="104" height="7" viewBox="0 0 104 7" fill="none">
                        <path d="M0 3.43628L5 6.32303V0.549528L0 3.43628ZM103.019 3.93628C103.296 3.93628 103.519 3.71242 103.519 3.43628C103.519 3.16014 103.296 2.93628 103.019 2.93628V3.93628ZM4.5 3.93628H103.019V2.93628H4.5V3.93628Z" fill="black"/>
                      </svg>
                      <div class="speed-cont tooltip">
                        <div class="speed-icon-cont">
                          <svg  class="speed-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M1.51959 13.5H4.3V15H0V14.25C0 7.15146 4.77303 1.5 12 1.5C19.227 1.5 24 7.15146 24 14.25V15H19.7V13.5H22.4804C22.1767 7.72703 18.3669 3.37899 12.75 3.02352V6H11.25V3.02352C5.63315 3.37899 1.82329 7.72703 1.51959 13.5Z" fill="#1F1F1F"/>
                            <path d="M9 15V18H12L15 9L9 15Z" fill="#1F1F1F" />
                          </svg>
                        </div>
                        <span class="tooltip-text right">
                          ${l.trans('motune.pldsc')}
                        </span>
                        <div class="speed-text">${l.trans('motune.vpla')}</div>
                      </div>
                    </div>
                    <div class="img-cont flex justify-center items-center">
                      <img src="${imgBoxPos}" class="img-pick" />
                      <img src="${placePos}" class="img-place" />
                    </div>
                  </div>
                  <div class="flex-07 pr-4">
                      <div class="flex-row tc-space my-3 items-center">
                        <div class="">${l.trans('motune.acc')} (%)</div>
                        <div class="acc"></div>
                      </div>
                      <div class="flex-row tc-space my-3 items-center">
                        <div class="">${l.trans('motune.vpick')} (mm/s)</div>
                        <div class="pick-speed"></div>
                      </div>
                      <div class="flex-row tc-space my-3 items-center">
                        <div class="">${l.trans('motune.vpall')} (mm/s)</div>
                        <div class="pallet-speed"></div>
                      </div>
                      <div class="flex-row tc-space my-3 items-center">
                        <div class="">${l.trans('motune.vret')} (mm/s)</div>
                        <div class="return-speed"></div>
                      </div>
                      <div class="flex-row tc-space my-3 items-center">
                        <div class="">${l.trans('motune.vpla')} (mm/s)</div>
                        <div class="place-speed"></div>
                      </div>
                      <div class="pick-cont flex-row tc-space my-3 items-center">
                        <div class="">${l.trans('motune.tpick')} (s)</div>
                        <div class="pick-time"></div>
                      </div>
                      <div class="flex-row tc-space my-3 items-center">
                        <div class="">${l.trans('motune.tpla')} (s)</div>
                        <div class="place-time"></div>
                      </div>
                      <div class="control-buttons flex-row gap-5 justify-end mt-10 mb-5">
                        <div class="reset-button"></div>
                        <div class="set-button"></div>
                      </div>
                  </div>
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
 * @memberof MotionTune
 */
MotionTune.loadCssClassFromString(/*css*/ `
    .acc, .pick-speed, .pallet-speed, .place-speed, .return-speed, .pick-time, .place-time {
      width: 100px;
    }
    .speed-icon {
      border-radius: 24px;
      border: 0.5px solid var(--text-white-secondary, #DBDBDB);
      background: var(--text-white-secondary, #DBDBDB);
      padding: 0.75rem;
    }
    .speed-icon.clicked {
      border: 0.5px solid #36F;
      background: var(--status-info-bg, #D8E4FF);
    }
    .arrow {
      position: relative;
      top: 20px;
    }
    .speed-text {
      color: var(--text-black-primary, #1F1F1F);
      font-size: 12px;
      font-style: normal;
      font-weight: 400;
      line-height: normal;
    }
    .speed-cont {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .img-pick {
      position: relative;
      left: -100px;
      width: 150px;
    }
    .img-place {
      position: relative;
      left: 85px;
      width: 100px;
    }
    .tooltip {
      position: relative;
    }
    .tooltip .tooltip-text {
      width: 150px;
      color: #000;
      box-shadow: 0px 0px 1px 0px rgba(0, 0, 0, 0.08), 0px 2px 4px 0px rgba(0, 0, 0, 0.08), 0px 8px 16px 0px rgba(0, 0, 0, 0.12);
      text-align: center;
      border-radius: 8px;
      background: var(--background-alternative, #F5F5F5);
      padding: 0.5rem;
      position: absolute;
      z-index: 1;
      opacity: 0;
      transition: opacity 0.3s;
      font-family: ABBvoice;
      font-size: 12px;
      font-style: normal;
    }
    .tooltip .tooltip-text.show{
      opacity: 1;
    }
    .tooltip .tooltip-text.top {
      bottom: 125%;
    }
    .tooltip .tooltip-text.left {
      right: 100%;
    }
    .tooltip .tooltip-text.right {
      left: 100%;
    }
    .tooltip .tooltip-text.bottom {
      top: 125%;
    }
    .pick-cont {
      border-top: solid 0.25px #979797;
      padding-top: 0.5rem;
    }
`);
