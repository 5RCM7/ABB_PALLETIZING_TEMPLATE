/**
 * @class DropDownButton
 * @classdesc DropDownButton component is a combination of a button and a dropdown list.
 * @extends TComponents.Component_A
 * @param {HTMLElement} parent - The parent element to which the view will be rendered
 * @param {Object} props - The properties object to be passed to the view
 */
export default class DropDownButton extends TComponents.Component_A {
  constructor(parent, props = {}) {
    super(parent, props);
  }

  /**
   * Returns an object with expected input properties together with their initial value.
   * Every child class shall have a {@link defaultProps} to register its corresponding input properties.
   * @alias defaultProps
   * @memberof DropDownButton
   * @returns {Object}
   */
  defaultProps() {
    return {
      itemList: [],
      selected: '',
      icon: '',
      addNoSelection: false,
      label: '',
      onClick: null,
    };
  }

  async onInit() {
    if (this._props.onClick) this.on('click', this._props.onClick);
  }

  /**
   * Instantiation of DropDownButton sub-components that shall be initialized in a synchronous way.
   * All this components are then accessible within {@link onRender() onRender} method by using this.child.<component-instance>
   * Create base t-components for the incremental/decremental input.
   * @alias mapComponents
   * @memberof DropDownButton
   * @returns {object} Contains all child DropDownButton instances used within the component.
   */
  mapComponents() {
    const btn = new TComponents.Button_A(this.find('.button-element'), {
      text: this._props.selected,
      icon: this._props.icon,
      onClick: this.cbOnClick.bind(this),
    });

    const dropdown = new TComponents.Dropdown_A(
      this.find('.dropdown-element'),
      {
        itemList: this._props.itemList,
        selected: this._props.selected,
      }
    );
    const dropdownOnSelection = () => {
      btn.text = dropdown.selected;
    };
    dropdown.onSelection(dropdownOnSelection.bind(this));

    return {
      btn,
      dropdown,
    };
  }

  cbOnClick() {
    this.trigger('click', this.selected);
  }

  /**
   * Set the enable property of the element
   * @alias enable
   * @memberof DropDownButton
   * @param {boolean} value - The value to be set
   */
  set enable(value) {
    this.child.btn.enable = value;
    this.child.dropdown.enable = value;
  }

  /**
   * Get the enable property of the element
   * @alias enable
   * @memberof DropDownButton
   * @returns {boolean}
   */
  get enable() {
    return this.child.btn.enable;
  }

  /**
   * Set the selected property of the element
   * @alias selected
   * @memberof DropDownButton
   * @param {string} value - The value to be set
   */
  set selected(value) {
    this.child.dropdown.selected = value;
    this.child.btn.text = value;
  }

  /**
   * Get the selected property of the element
   * @alias selected
   * @memberof DropDownButton
   * @returns {string}
   */
  get selected() {
    return this.child.dropdown.selected;
  }

  /**
   * Set the items property of the element
   * @alias items
   * @memberof DropDownButton
   * @param {Array} value - The value to be set
   */
  set items(value) {
    this.child.dropdown.items = value;
  }

  /**
   * Get the items property of the element
   * @alias items
   * @memberof DropDownButton
   * @returns {Array}
   */
  get items() {
    return this.child.dropdown.items;
  }

  /**
   * Generates the HTML definition corresponding to the component.
   * div container for the incremental/decremental input
   * @alias markup
   * @memberof DropDownButton
   * @returns {string}
   */
  markup() {
    return /*html*/ `
        <div class="element-container flex items-center">
          <div class="button-element"></div>
          <div class="dropdown-element"></div>
        </div>
    `;
  }
}

/**
 * Add css properties to the component
 * @alias loadCssClassFromString
 * @static
 * @param {string} css - The css string to be loaded into style tag
 * @memberof DropDownButton
 */
DropDownButton.loadCssClassFromString(`
  .dropdown-element {
    width: 40px;
  }
  .dropdown-element .t-component{
    min-width: 40px !important;
  }
  .dropdown-element .fp-components-dropdown{
    border-radius: 0px 20px 20px 0px;
    background-color: var(--fp-color-BLACK-OPACITY-4);
    border: none;
    height: 40px;
    margin-left: 2px;
  }
  .dropdown-element .fp-components-dropdown > p {
    display:none;
  }
  .button-element{
    width:100%;
  }
  .button-element .fp-components-button, .button-element .fp-components-button-disabled{
    border-radius: 20px 0px 0px 20px;
  }
`);
