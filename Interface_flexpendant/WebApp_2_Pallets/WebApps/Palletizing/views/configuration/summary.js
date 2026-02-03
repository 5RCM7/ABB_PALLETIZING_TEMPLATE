import { stackData } from '../../leanPallet/StackData.js';
import { l } from '../../services/translation.js';
/**
 * @class Summary
 * @classdesc This class is responsible for rendering the summary subview
 * @extends TComponents.Component_A
 * @memberof MultiStep
 * @param {HTMLElement} parent - The parent element to which the view will be rendered
 * @param {Object} props - The properties object to be passed to the view
 */
export default class Summary extends TComponents.Component_A {
  constructor(parent, props = {}) {
    super(parent, props);
  }

  /**
   * Creates the summary list from the desired data
   * @alias createSummaryList
   * @memberof Summary
   */
  createSummaryList() {
    const { stack, boxProp, stackProp, palletProp } = stackData;
    const summaryData = {
      [`${l.trans('summary.cnt')}`]: stack.countBox(),
      [`${l.trans('summary.bSize')}
        (L x W x H) (mm)`]: `${boxProp.length} x ${boxProp.width} x ${boxProp.height}`,
      [`${l.trans('com.noLay')}`]: stackProp.nrOfLayers,
      [`${l.trans('summary.pSize')}
        (L x W x H) (mm)`]: `${palletProp.length} x ${palletProp.width} x ${palletProp.height}`,
      [`${l.trans('summary.pHe')} (mm)`]: palletProp.fullHeight,
      [`${l.trans('summary.pWe')} (kg)`]: stack.countBox() * boxProp.weight,
      [`${l.trans('summary.fR')} (%)`]: Math.round(stack.fillingRate() * 100),
    };

    const summary = this.find('#summary');
    summary.innerHTML = '';

    const createElement = (type, className, html) => {
      const element = document.createElement(type);
      element.className = className;
      if (html) element.innerHTML = html;
      return element;
    };

    for (const [title, value] of Object.entries(summaryData)) {
      const item = createElement('div', 'summary-item mb-3');
      const titleEl = createElement('div', 'element-title pl-4', title);
      const valueEl = createElement('div', 'element-value', value);
      item.appendChild(titleEl);
      item.appendChild(valueEl);
      summary.appendChild(item);
    }
  }

  /**
   * Generates the HTML definition corresponding to the component.
   * html elements for different components in the layout
   * @alias markup
   * @memberof Summary
   * @returns {string}
   */
  markup() {
    return /*html*/ `
        <div class="summary-cont">
          <div class="summary-title mb-4">${l.trans('summary.prod')}</div>
          <div id="summary"></div>
        </div>
    `;
  }
}

/**
 * Add css properties to the component
 * @alias loadCssClassFromString
 * @static
 * @param {string} css - The css string to be loaded into style tag
 * @memberof Summary
 */
Summary.loadCssClassFromString(/*css*/ `
  .summary-title {
    font-size: 20px;
    font-style: normal;
    font-weight: 600;
  }
  .summary-cont {
    display: flex;
    flex-direction: column;
    padding: 2rem;
    margin: 0.5rem;
    background-color: #fff;
    border-radius: 8px;
  }
  .summary-item {
    display: flex;
    border-bottom: 0.25px solid #ddd;
  }
  .element-title {
    flex:1;
    font-size: 16px;
  }
  .element-value {
    flex:1;
    color: var(--blue-60, #36F);
  }
`);
