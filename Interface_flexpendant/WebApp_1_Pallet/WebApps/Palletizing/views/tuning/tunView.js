import BoxTune from './boxTune.js';
import MotionTune from './motionTune.js';
import { l } from '../../services/translation.js';

/**
 * @class TunView
 * @classdesc This class is responsible for rendering the tuning subview
 * @extends TComponents.Component_A
 * @memberof App
 * @param {HTMLElement} parent - The parent element to which the view will be rendered
 * @param {Object} props - The properties object to be passed to the view
 */
export default class TunView extends TComponents.Component_A {
  constructor(parent, props = {}) {
    super(parent, props);
  }

  /**
   * Instantiation of TunView sub-components that shall be initialized in a synchronous way.
   * All this components are then accessible within {@link onRender() onRender} method by using this.child.<component-instance>
   * Create a tab container with 2 tabs (Box and Motion tuning).
   * @alias mapComponents
   * @memberof TunView
   * @returns {object} Contains all child TunView instances used within the component.
   */
  mapComponents() {
    const tabContainer = new TComponents.TabContainer_A(
      this.find('.tab-container'),
      {
        views: [
          { name: l.trans('boxtune.title'), content: new BoxTune(null) },
          { name: l.trans('motune.title'), content: new MotionTune(null) },
        ],
      }
    );
    return {
      tabContainer,
    };
  }

  /**
   * Generates the HTML definition corresponding to the component.
   * div element for the title and the tab container
   * @alias markup
   * @memberof Tunview
   * @returns {string}
   */
  markup() {
    return /*html*/ ` 
        <div class="title my-4 pl-5">
          Palletizing | ${l.trans('com.tune')}
        </div>
        <div class="tab-container"></div>
    `;
  }
}
