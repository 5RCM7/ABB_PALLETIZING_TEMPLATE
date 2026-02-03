import { helpIcon } from '../../constants/images.js';

/**
 * @class HelpSelector
 * @classdesc
 * @extends TComponents.Component_A
 * @memberof
 * @param {HTMLElement} parent - The parent element to which the view will be rendered
 * @param {Object} props - The properties object to be passed to the view
 */
export default class HelpSelector extends TComponents.Component_A {
  constructor(parent, props = {}) {
    super(parent, props);
  }

  /**
   * Default properties for the component
   * @alias defaultProps
   * @memberof HelpSelector
   * @returns {object} The default properties object
   */
  defaultProps() {
    return { itemList: [] };
  }

  /**
   * Instantiation of HelpSelector sub-components that shall be initialized in a synchronous way.
   * All this components are then accessible within {@link onRender() onRender} method by using this.child.<component-instance>
   * Create a button for the help dropdown menu
   * @alias mapComponents
   * @memberof HelpSelector
   * @returns {object} Contains all child HelpSelector instances used within the component.
   */
  mapComponents() {
    const helpBtn = new TComponents.Button_A(this.find('.help-button'), {
      text: '',
      icon: helpIcon,
      onClick: () => this.showMenu(),
    });
    return {
      helpBtn,
    };
  }

  /**
   * Contains all synchronous operations/setups that may be required for any sub-component after its initialization and/or manipulation of the DOM.
   * This method is called internally during rendering process orchestrated by {@link render() render}.
   *
   * @alias onRender
   * @memberof HelpSelector
   */
  onRender() {
    this.onClickHandler = this.props.itemList.map((item) => item.onClick);
  }

  /**
   * Show the dropdown menu when the help button is clicked
   * @alias showMenu
   * @memberof HelpSelector
   */
  showMenu() {
    const createElement = (type, className, html) => {
      const element = document.createElement(type);
      element.className = className;
      if (html) element.innerHTML = html;
      return element;
    };

    const divContainer = this.find('.help-dropdown');
    const divMenu = createElement('div', 'help-dropdown-menu');
    const divOverlay = createElement('div', 'help-overlay');

    const items = this.props.itemList.map((item) => item.name);

    items.forEach((item, index) => {
      const parItem = createElement('p', 'help-dropdown-item', item);
      parItem.onclick = (event) => {
        event.stopPropagation();
        divMenu.remove();
        divOverlay.remove();
        if (typeof this.onClickHandler[index] === 'function')
          this.onClickHandler[index].call(this);
      };
      divMenu.appendChild(parItem);
    });

    divContainer.appendChild(divMenu);
    divContainer.appendChild(divOverlay);

    divOverlay.onclick = (event) => {
      event.stopPropagation();
      divMenu.remove();
      divOverlay.remove();
    };
  }

  /**
   * Generates the HTML definition corresponding to the component.
   * html elements for different components in the layout
   * @alias markup
   * @memberof HelpSelector
   * @returns {string}
   */
  markup() {
    return /*html*/ `
        <div class="help-button">
          <div class="help-dropdown"></div>
        </div>
    `;
  }
}

/**
 * Add css properties to the component
 * @alias loadCssClassFromString
 * @static
 * @param {string} css - The css string to be loaded into style tag
 * @memberof HelpSelector
 */
HelpSelector.loadCssClassFromString(/*css*/ `
  .help-button {
    position: relative;
  }
  .help-button .fp-components-button {
    min-width: 10px;
    padding: 0 0.5rem;
  }
  .help-button .fp-components-button-icon {
    margin: 0;
    width: 24px;
    height: 24px;
  }
  .help-dropdown-menu {
    position: absolute;
    left: -260px;
    top: 50px;
    width: 300px;
    z-index: 4;
    background-color: var(--fp-color-WHITE);
    border: 1px solid var(--fp-color-GRAY-30);
    border-radius: 4px;
    padding: 0.25rem 0 0.25rem 0;
  }
  .help-dropdown-menu > p {
    padding: 0.75rem 0.75rem 0.75rem 1rem;
    margin: 0; 
  }
  .help-dropdown-menu > p:hover {
    background-color: var(--fp-color-GRAY-10);
  }
  .help-dropdown-menu > p:active {
    background-color: var(--fp-color-BLACK-OPACITY-4);
  }
  .help-overlay {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 3;
    background-color: rgba(255, 255, 255, 0.6);
    width: 100vw;
    height: 100vh;
  }
`);
