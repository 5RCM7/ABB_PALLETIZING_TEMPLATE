import { closeIcon, QRCode } from '../../constants/images.js';
import OnBoarding from '../components/onBoarding.js';
import { version } from '../../constants/common.js';
import Production from './production.js';
import Conveyor from './conveyor.js';
import Gripper from './gripper.js';
import SlipSheet from './slipSheet.js';
import HelpSelector from '../components/helpSelector.js';
import { l } from '../../services/translation.js';
import { Utils } from '../../services/utils.js';

/**
 * @class ProdView
 * @classdesc This class is responsible for rendering the production subview
 * @extends TComponents.Component_A
 * @memberof App
 * @param {HTMLElement} parent - The parent element to which the view will be rendered
 * @param {Object} props - The properties object to be passed to the view
 */
export default class ProdView extends TComponents.Component_A {
  constructor(parent, props = {}) {
    super(parent, props);
  }

  /**
   * Contains component specific asynchronous implementation (like access to controller).
   * This method is called internally during initialization process orchestrated by {@link init() init}.
   * Show onboarding page once and save state in json file
   * @alias onInit
   * @memberof ProdView
   */
  async onInit() {
    let setupCont = await Utils.getSetup();
    if (!setupCont.onboard_first) {
      setupCont.onboard_first = true;
      await Utils.setSetup(setupCont);

      this.createOnBoarding();
    }
  }

  /**
   * Instantiation of ProdView sub-components that shall be initialized in a synchronous way.
   * All this components are then accessible within {@link onRender() onRender} method by using this.child.<component-instance>
   * Create a tab container with 4 tabs (Production, Conveyor, Gripper, Slip sheet) and help menu.
   * @alias mapComponents
   * @memberof ProdView
   * @returns {object} Contains all child ProdView instances used within the component.
   */
  mapComponents() {
    // Create a help button
    const helpMenu = new HelpSelector(this.find('.help-menu'), {
      itemList: [
        {
          name: l.trans('onboard.title'),
          onClick: () => {
            const tabCont = this.child.tabContainer;
            if (tabCont.activeTab === tabCont.viewList[0]) {
              this.createOnBoarding();
            }
          },
        },
        {
          name: l.trans('sw_info.title'),
          onClick: () => {
            this.createInfoPage();
          },
        },
      ],
    });
    const tabContainer = new TComponents.TabContainer_A(
      this.find('.tab-container'),
      {
        views: [
          { name: l.trans('prod.title'), content: new Production(null) },
          { name: l.trans('conv.title'), content: new Conveyor(null) },
          { name: l.trans('grip.title'), content: new Gripper(null) },
          { name: l.trans('slip.title'), content: new SlipSheet(null) },
        ],
        onChange: function (oldID, newID) {
          // Update the product name in the other tabs
          const tabContElement = this.child.tabContainer;
          const index = tabContElement.viewList.indexOf(newID);

          if (index > 0)
            tabContElement.views[index].content.find(
              '.product-name'
            ).innerHTML =
              tabContElement.views[0].content.find('.product-name').innerHTML;
        }.bind(this),
      }
    );
    return {
      helpMenu,
      tabContainer,
    };
  }

  /**
   * Create the onboarding with defined elements
   * @alias createOnBoarding
   * @memberof ProdView
   */
  createOnBoarding() {
    const elements = [
      {
        element: '.fp-components-hamburgermenu-a-menu__wrapper',
        key: 'onboard.popup_2',
      },
      {
        element: '.fp-components-tabcontainer-tabbar',
        key: 'onboard.popup_3',
        position: 'down',
      },
      { element: '.product .layout-infobox', key: 'onboard.popup_4' },
      { element: '.actions .layout-infobox', key: 'onboard.popup_5' },
      { element: '.status .layout-infobox', key: 'onboard.popup_6' },
      { element: '.wh-cont', key: 'onboard.popup_7', position: 'left' },
    ];

    const onboard = new OnBoarding(null, {
      openPage: {
        title: l.trans(`onboard.popup_1`)[0],
        content: l.trans(`onboard.popup_1`)[1],
      },
      elementList: elements.map(({ element, key, position }) => ({
        element,
        title: l.trans(key)[0],
        content: l.trans(key)[1],
        position: position,
      })),
    });
    onboard.render();
  }

  /**
   * Create the info page when the user clicks on the second option (More)
   * @alias createInfoPage
   * @memberof ProdView
   */
  createInfoPage() {
    const createElement = (type, className, html) => {
      const element = document.createElement(type);
      element.className = className;
      if (html) element.innerHTML = html;
      return element;
    };
    const infoMainDiv = createElement('div', 'info-page');
    const infoContentDiv = createElement(
      'div',
      'info-content',
      /*html*/ `
      <div class="flex x-close-button">
      </div>
      <div class="info-section pb-3">
        <p class="title">${l.trans('sw_info.man')[0]}</p>
        <p>
          ${l.trans('sw_info.man')[1]}
        </p>
        <div class="img-container">
          <img src=${QRCode} />
        </div>
      </div>
      <div class="info-section pb-3">
        <p class="title">${l.trans('sw_info.about')[0]}</p>
        <p>${l.trans('sw_info.about')[1]}: <span class="ver"></span></p>
      </div>
      <div>
        <p class="title">${l.trans('sw_info.cont')[0]}</p>
        <p>${l.trans('sw_info.cont')[1]}</p>
      </div>
    `
    );

    const closeBtn = new FPComponents.Button_A();
    closeBtn.text = '';
    closeBtn.icon = closeIcon;
    closeBtn.onclick = () => {
      this.deleteInfoPage();
    };
    const body = document.body;

    body.appendChild(infoMainDiv);
    infoMainDiv.appendChild(infoContentDiv);
    closeBtn.attachToElement(document.querySelector('.x-close-button'));
    const versionElement = document.querySelector('.info-page .ver');
    versionElement.innerHTML = version;
  }

  /**
   * Delete the info page when the user clicks on the close button
   * @alias deleteInfoPage
   * @memberof ProdView
   */
  deleteInfoPage() {
    const infoMainDiv = document.querySelector('.info-page');
    infoMainDiv.remove();
  }

  /**
   * Generates the HTML definition corresponding to the component.
   * div element for the title and the tab container
   * @alias markup
   * @memberof ProdView
   * @returns {string}
   */
  markup() {
    return /*html*/ `
        <div class="flex tc-space items-center"> 
          <div class="title my-4 pl-5">Palletizing | 
          ${l.trans('prod.title')}
          </div>
          <div class="help-menu pr-3"></div>
        </div>
        <div class="tab-container"></div>
    `;
  }
}

ProdView.loadCssClassFromString(/*css*/ `
   .info-page {
    display: flex;
    justify-content: center;
    align-items: center;
    position: fixed;
    top: 0px;
    left: 0px;
    box-sizing: border-box;
    height: 100vh;
    width: 100vw;
    z-index: 10;
    background-color: rgba(0, 0, 0, 0.6);
    font-size:18px;
  }
  .info-content {
    width: 90%;
    height: 90%;
    box-sizing: border-box;
    border-style: solid;
    border-color: #DBDBDB;
    border-width: 1px;
    box-shadow: 0px 8px 16px 0px #9F9F9F;
    border-radius: 4px;
    background-color: rgba(255, 255, 255, 1);
    padding: 1rem;
  }
  .info-page .ver{
    color: #696969;
    font-weight: bold;
  }
  .info-section {
    border-bottom: solid 0.25px #464646;
  }
  .info-page .x-close-button {
    float: right;
  }
  .x-close-button .fp-components-button {
    min-width: 10px;
    padding: 0 0.75rem;
  }
  .x-close-button .fp-components-button-icon {
    margin: 0;
    width: 16px;
  }
`);
