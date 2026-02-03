import { imgConveyor, playIcon, stopIcon } from '../../constants/images.js';
import { l } from '../../services/translation.js';

/**
 * @class Conveyor
 * @classdesc This class is responsible for rendering the conveyor toolbar view
 * @extends TComponents.Component_A
 * @memberof ProdView
 * @param {HTMLElement} parent - The parent element to which the view will be rendered
 * @param {Object} props - The properties object to be passed to the view
 */
export default class Conveyor extends TComponents.Component_A {
  constructor(parent, props = {}) {
    super(parent, props);
  }

  /**
   * Instantiation of Conveyor sub-components that shall be initialized in a synchronous way.
   * All this components are then accessible within {@link onRender() onRender} method by using this.child.<component-instance>
   * Create infoboxes for product, conveyor control, waiting and status and create two buttons for starting and stopping the conveyor.
   * @alias mapComponents
   * @memberof Conveyor
   * @returns {object} Contains all child Conveyor instances used within the component.
   */
  mapComponents() {
    // Create 4 Infobox in the Layout
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
        title: l.trans('conv.act'),
        content: { children: [this.find('.action-content')] },
      }
    );
    const statusInfobox = new TComponents.LayoutInfobox_A(
      this.find('.status'),
      {
        title: l.trans('conv.stat'),
        content: { children: [this.find('.status-content')] },
      }
    );
    // Create two buttons for starting and stopping the conveyor
    const startBtn = new TComponents.ButtonProcedure_A(this.find('.start'), {
      procedure: '',
      userLevel: true,
      text: l.trans('conv.start'),
      icon: playIcon,
    });
    const resumeBtn = new TComponents.ButtonProcedure_A(this.find('.stop'), {
      procedure: '',
      userLevel: true,
      text: l.trans('conv.stop'),
      icon: stopIcon,
    });
    return {
      setupInfobox,
      controlInfobox,
      statusInfobox,
      startBtn,
      resumeBtn,
    };
  }

  /**
   * Generates the HTML definition corresponding to the component.
   * html elements for different components in the layout
   * @alias markup
   * @memberof Conveyor
   * @returns {string}
   */
  markup() {
    return /*html*/ `
        <div id="conveyor-subview">
          <div class="flex">
            <div class="flex-07">
              <div class="my-3">
                <div class="product"></div>
                <div class="product-content pl-2">
                  <div class="product-name mt-1"></div>
                </div>
              </div>
              <div class="my-3">
                <div class="actions"></div>
                <div class="action-content gap-6 flex-row my-4 pl-2 pr-2">
                  <div class="start flex-1"></div>
                  <div class="stop flex-1"></div>
                </div>
              </div>
              <div class="status"></div>
              <div class="status-content pl-2 pr-2">
                <div class="flex-row my-2 items-baseline">
                  <div class="flex-1">${l.trans('conv.boxPr')}</div>
                  <div class="status-led ok">${l.trans('conv.run')}</div>
                </div>
                <div class="flex-row my-2 items-baseline">
                  <div class="flex-1">${l.trans('conv.title')}</div>
                  <div class="status-led ok">${l.trans('com.yes')}</div>
                </div>
              </div>
            </div>
            <div class="flex-1 wh-cont pt-4">
              <div class="flex justify-center">
                <img src="${imgConveyor}" class="production-img" />
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
 * @memberof Conveyor
 */
Conveyor.loadCssClassFromString(/*css*/ `
  #conveyor-subview .fp-components-button-icon{
    background-size: auto;
  }
  #conveyor-subview .fp-components-button-text{
    flex: none;
  }
  .status-led{
    flex: 0.3;
    text-align: center;
    border-radius: 4px;
    padding: 0.25rem;
    color: #ffffff;
  }
  .status-led.nok{
    background-color: #FF0000;
  }
  .status-led.ok{
    background-color: #21A67A;
  }
`);
