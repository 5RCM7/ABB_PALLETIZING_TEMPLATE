/**
 * @class CustomPopup
 * @classdesc Custom popup component with title body and footer.
 * @extends TComponents.Component_A
 * @param {HTMLElement} parent - The parent element to which the view will be rendered
 * @param {Object} props - The properties object to be passed to the view
 */
export default class CustomPopup extends TComponents.Component_A {
  constructor(parent, props = {}) {
    super(parent, props);
  }

  /**
   * Returns an object with expected input properties together with their initial value.
   * Every child class shall have a {@link defaultProps} to register its corresponding input properties.
   * @alias defaultProps
   * @memberof CustomPopup
   * @returns {Object}
   */
  defaultProps() {
    return { title: '', bodyContent: '', footerContent: '' };
  }

  /**
   * Instantiation of CustomPopup sub-components that shall be initialized in a synchronous way.
   * All this components are then accessible within {@link onRender() onRender} method by using this.child.<component-instance>
   * Create base t-components for the incremental/decremental input.
   * @alias mapComponents
   * @memberof CustomPopup
   * @returns {object} Contains all child CustomPopup instances used within the component.
   */
  mapComponents() {
    return {};
  }

  /**
   * Contains all synchronous operations/setups that may be required for any sub-component after its initialization and/or manipulation of the DOM.
   * This method is called internally during rendering process orchestrated by {@link render() render}.
   * Create event listener for close button
   * @alias onRender
   * @memberof CustomPopup
   */
  onRender() {
    this.find('.close-button').addEventListener(
      'click',
      this.destroy.bind(this)
    );
  }

  /**
   * Generates the HTML definition corresponding to the component.
   * div container for the incremental/decremental input
   * @alias markup
   * @memberof CustomPopup
   * @returns {string}
   */
  markup() {
    return /*html*/ `
      <div class="popup">
        <div class="popup-content">
          <div class="popup-header mt-3 mb-6">
            <span class="pl-3 title">${this._props.title}</span>
            <span class="close-button pr-2">&times;</span>
          </div>
          <div class="popup-body">
            ${this._props.bodyContent}
          </div>
          <div class="popup-footer mb-3 pr-2">
            ${this._props.footerContent}
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
 * @memberof CustomPopup
 */
CustomPopup.loadCssClassFromString(`
  .popup {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    position: absolute;
    top: 0px;
    left: 0px;
    box-sizing: border-box;
    height: 100vh;
    width: 100vw;
    z-index: 4;
    background-color: rgba(0, 0, 0, 0.6);
  }
  .popup-content {
    display: flex;
    flex-direction: column;
    max-width: 600px;
    min-width: 480px;
    box-sizing: border-box;
    border: 1px solid #DBDBDB;
    box-shadow: 0px 4px 16px 0px #9F9F9F;
    border-radius: 8px;
    border-top: 4px solid #3366FF ;
    background-color: rgba(255, 255, 255, 1);
    position: relative;
  }
  .popup-header{
    display: flex;
    justify-content: space-between;
  }
  .close-button {
    font-size: 2rem;
    cursor: pointer;
    font-weight: bolder;
  }
  .popup-body{
    display: flex;
    position: relative;
    padding: 1rem;
  }
  .popup-footer{
    display: flex;
    justify-content: flex-end;
  }
`);
