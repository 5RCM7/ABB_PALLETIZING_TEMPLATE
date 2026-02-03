import { checkInputRange, floatRegex } from '../../constants/common.js';

/**
 * @class CustomIncDec
 * @classdesc This class creates a custom incremental/decremental input
 * @extends TComponents.Component_A
 * @memberof tunView
 * @param {HTMLElement} parent - The parent element to which the view will be rendered
 * @param {Object} props - The properties object to be passed to the view
 */
export default class CustomIncDec extends TComponents.Component_A {
  constructor(parent, props) {
    super(parent, props);
  }

  defaultProps() {
    return { text: 0, step: 1, range: [-100, 100] };
  }

  /**
   * Instantiation of CustomIncDec sub-components that shall be initialized in a synchronous way.
   * All this components are then accessible within {@link onRender() onRender} method by using this.child.<component-instance>
   * Create base t-components for the incremental/decremental input.
   * @alias mapComponents
   * @memberof CustomIncDec
   * @returns {object} Contains all child CustomIncDec instances used within the component.
   */
  mapComponents() {
    const input = new TComponents.Input_A(this.find('.input-box'), {
      text: this._props.text,
    });
    const incrBtn = new TComponents.Button_A(this.find('.incr-btn'), {
      onClick: () => this.incValue(),
      text: '+',
    });
    const decrBtn = new TComponents.Button_A(this.find('.decr-btn'), {
      onClick: () => this.decrValue(),
      text: '-',
    });
    return {
      input,
      incrBtn,
      decrBtn,
    };
  }

  /**
   * Contains all synchronous operations/setups that may be required for any sub-component after its initialization and/or manipulation of the DOM.
   * This method is called internally during rendering process orchestrated by {@link render() render}.
   * Add a validator for the inputbox
   * @alias onRender
   * @memberof CustomIncDec
   */
  onRender() {
    const input = this.child.input;

    input.regex = floatRegex;
    input.validator = (value) =>
      checkInputRange(value, this._props.range[0], this._props.range[1]);
    input.description = `Value must be between ${this._props.range[0]} and ${this._props.range[1]}`;
  }

  /**
   * Set the value of the input box
   * @alias text
   * @memberof CustomIncDec
   * @param {string} value - The value to be set
   */
  set text(value) {
    this.child.input.text = value;
  }

  /**
   * Get the value of the input box
   * @alias text
   * @memberof CustomIncDec
   * @returns {string}
   */
  get text() {
    return this.child.input.text;
  }

  /**
   * Set the dec/inc step of the input box
   * @alias step
   * @memberof CustomIncDec
   * @param {number} step - The step to be set
   */
  set step(step) {
    this.setProps({ step });
  }

  /**
   * Get the dec/inc step of the input box
   * @alias step
   * @memberof CustomIncDec
   * @returns {number}
   */
  get step() {
    return this._props.step;
  }

  /**
   * Set the range of the input box
   * @alias range
   * @memberof CustomIncDec
   * @param {Array} range - The range to be set
   */
  set range(range) {
    this.setProps({ range });
  }

  /**
   * Get the range of the input box
   * @alias range
   * @memberof CustomIncDec
   * @returns {Array}
   */
  get range() {
    return this._props.range;
  }

  /**
   * Increment the value of the input box
   * @alias incValue
   * @memberof CustomIncDec
   */
  incValue() {
    const input = this.child.input;
    const newValue = parseInt(input.text) + this._props.step;

    if (newValue > this._props.range[1]) return;
    input.text = newValue;
  }

  /**
   * Decrement the value of the input box
   * @alias decrValue
   * @memberof CustomIncDec
   */
  decrValue() {
    const input = this.child.input;
    const newValue = parseInt(input.text) - this._props.step;

    if (newValue < this._props.range[0]) return;
    input.text = newValue;
  }

  /**
   * Generates the HTML definition corresponding to the component.
   * div container for the incremental/decremental input
   * @alias markup
   * @memberof CustomIncDec
   * @returns {string}
   */
  markup() {
    return /*html*/ `
        <div class="custom-container flex pl-1 pr-1">
          <div class="decr-btn"></div>
          <div class="input-box"></div>
          <div class="incr-btn"></div>
        </div>
    `;
  }
}

/**
 * Add css properties to the component
 * @alias loadCssClassFromString
 * @static
 * @param {string} css - The css string to be loaded into style tag
 * @memberof CustomIncDec
 */
CustomIncDec.loadCssClassFromString(`
  .custom-container .fp-components-button{
    border-radius: 4px;
    padding: 0px;
    min-width: 30px;
    height: 30px;
  }
  .custom-container .input-box .fp-components-input{
    border: none;
    min-height: 20px;
    justify-content: center;
  }
  .custom-container {
    border: solid 2px var(--fp-color-GRAY-20);
    border-radius: 4px;
    align-items: center;
  }
  .custom-container .fp-components-button-text{
    font-weight: bold;
    font-size: 18px;
  }
`);
