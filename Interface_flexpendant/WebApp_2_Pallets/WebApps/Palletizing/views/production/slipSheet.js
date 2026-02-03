import { imgSlipsheet } from '../../constants/images.js';
import { l } from '../../services/translation.js';

/**
 * @class SlipSheet
 * @classdesc This class is responsible for rendering the slipsheet view
 * @extends TComponents.Component_A
 * @memberof ProdView
 * @param {HTMLElement} parent - The parent element to which the view will be rendered
 * @param {Object} props - The properties object to be passed to the view
 */
export default class SlipSheet extends TComponents.Component_A {
  constructor(parent, props = {}) {
    super(parent, props);
  }

  /**
   * Instantiation of Slipsheet sub-components that shall be initialized in a synchronous way.
   * All this components are then accessible within {@link onRender() onRender} method by using this.child.<component-instance>
   * Create infoboxes for product name and slipsheet status.
   * @alias mapComponents
   * @memberof SlipSheet
   * @returns {object} Contains all child Slipsheet instances used within the component.
   */
  mapComponents() {
    // Create 2 Infobox in the Layout
    const setupInfobox = new TComponents.LayoutInfobox_A(
      this.find('.product'),
      {
        title: l.trans('com.pall'),
        content: { children: this.find('.product-content') },
      }
    );
    const statusInfobox = new TComponents.LayoutInfobox_A(
      this.find('.status'),
      {
        title: l.trans('slip.stat'),
        content: { children: [this.find('.status-content')] },
      }
    );
    return {
      setupInfobox,
      statusInfobox,
    };
  }

  /**
   * Generates the HTML definition corresponding to the component.
   * html elements for different components in the layout
   * @alias markup
   * @memberof SlipSheet
   * @returns {string}
   */
  markup() {
    return /*html*/ `
        <div id="slsheet-subview">
          <div class="flex">
            <div class="flex-07">
              <div class="my-3">
                <div class="product"></div>
                <div class="product-content pl-2">
                  <div class="product-name my-1"></div>
                </div>
              </div>
              <div class="status"></div>
              <div class="status-content pl-2 pr-2">
                <div class="flex-row my-2 items-baseline">
                  <div class="flex-1">${l.trans('slip.stack')}</div>
                  <div class="status-led ok">${l.trans('slip.high')}</div>
                </div>
                <div class="flex my-2 tc-space">
                  <span>${l.trans('slip.height')} (mm)</span>
                  <span>40</span>
                </div>
              </div>
            </div>
            <div class="flex-1 wh-cont pt-4">
              <div class="flex justify-center">
                <img src="${imgSlipsheet}" class="production-img" />
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
 * @memberof SlipSheet
 */
SlipSheet.loadCssClassFromString(/*css*/ `

`);
