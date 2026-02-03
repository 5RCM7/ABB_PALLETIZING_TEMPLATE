import { imgGripper } from '../../constants/images.js';
import { l } from '../../services/translation.js';

/**
 * @class Gripper
 * @classdesc This class is responsible for rendering the gripper toolbar view
 * @extends TComponents.Component_A
 * @memberof ProdView
 * @param {HTMLElement} parent - The parent element to which the view will be rendered
 * @param {Object} props - The properties object to be passed to the view
 */
export default class Gripper extends TComponents.Component_A {
  constructor(parent, props = {}) {
    super(parent, props);
  }

  /**
   * Instantiation of Gripper sub-components that shall be initialized in a synchronous way.
   * All this components are then accessible within {@link onRender() onRender} method by using this.child.<component-instance>
   * Create infoboxes for product, gripper control and status and create two buttons for gripping and releasing.
   * @alias mapComponents
   * @memberof Gripper
   * @returns {object} Contains all child Gripper instances used within the component.
   */
  mapComponents() {
    // Create 3 Infobox in the Layout
    const setupInfobox = new TComponents.LayoutInfobox_A(
      this.find('.product'),
      {
        title: l.trans('com.pall'),
        content: { children: this.find('.product-content') },
      }
    );
    const controlInfobox = new TComponents.LayoutInfobox_A(
      this.find('.actions'),
      {
        title: l.trans('grip.act'),
        content: { children: [this.find('.action-content')] },
      }
    );
    const statusInfobox = new TComponents.LayoutInfobox_A(
      this.find('.status'),
      {
        title: l.trans('grip.stat'),
        content: { children: [this.find('.status-content')] },
      }
    );
    const gripBtn = new TComponents.ButtonProcedure_A(this.find('.grip'), {
      procedure: '',
      userLevel: true,
      text: l.trans('grip.grip'),
    });
    const releaseBtn = new TComponents.ButtonProcedure_A(
      this.find('.release'),
      {
        procedure: '',
        userLevel: true,
        text: l.trans('grip.rel'),
      }
    );
    return {
      setupInfobox,
      controlInfobox,
      statusInfobox,
      gripBtn,
      releaseBtn,
    };
  }

  /**
   * Generates the HTML definition corresponding to the component.
   * html elements for different components in the layout
   * @alias markup
   * @memberof Gripper
   * @returns {string}
   */
  markup() {
    return /*html*/ `
        <div id="gripper-subview">
          <div class="flex">
            <div class="flex-07">
              <div class="my-3">
                <div class="product"></div>
                <div class="product-content pl-2">
                  <div class="product-name my-1"></div>
                </div>
              </div>
              <div class="mb-3">
                <div class="actions"></div>
                <div class="action-content gap-6 flex-row my-4 pl-2 pr-2">
                  <div class="grip flex-1"></div>
                  <div class="release flex-1"></div>
                </div>
              </div>
              <div class="status"></div>
              <div class="status-content pl-2 pr-2">
                <div class="flex-row my-2 items-baseline">
                  <div class="flex-1">${l.trans('grip.partg')}</div>
                  <div class="status-led ok">${l.trans('com.yes')}</div>
                </div>
                <div class="flex-row my-2 items-baseline">
                  <div class="flex-1">${l.trans('grip.vacuum')}</div>
                  <div class="status-led ok">${l.trans('com.on')}</div>
                </div>
              </div>
            </div>
            <div class="flex-1 wh-cont pt-4">
              <div class="flex justify-center">
                <img src="${imgGripper}" class="production-img" />
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
 * @memberof Gripper
 */
Gripper.loadCssClassFromString(/*css*/ `

`);
