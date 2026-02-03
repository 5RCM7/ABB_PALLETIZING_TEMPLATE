import CustomPopup from '../components/customPopup.js';

/**
 * @class OnBoarding
 * @classdesc
 * @extends TComponents.Component_A
 * @memberof
 * @param {HTMLElement} parent - The parent element to which the view will be rendered
 * @param {Object} props - The properties object to be passed to the view
 */
export default class OnBoarding extends TComponents.Component_A {
  constructor(parent, props = {}) {
    super(parent, props);
  }

  /**
   * Default properties for the component
   * @alias defaultProps
   * @memberof OnBoarding
   * @returns {object} The default properties object
   */
  defaultProps() {
    return { openPage: { title: 'OnBoarding', content: '' }, elementList: [] };
  }

  /**
   * Instantiation of OnBoarding sub-components that shall be initialized in a synchronous way.
   * All this components are then accessible within {@link onRender() onRender} method by using this.child.<component-instance>
   *
   * @alias mapComponents
   * @memberof OnBoarding
   * @returns {object} Contains all child OnBoarding instances used within the component.
   */
  mapComponents() {
    return {};
  }

  /**
   * Contains all synchronous operations/setups that may be required for any sub-component after its initialization and/or manipulation of the DOM.
   * This method is called internally during rendering process orchestrated by {@link render() render}.
   * Save the text and create the onboarding popup
   * @alias onRender
   * @memberof OnBoarding
   */
  onRender() {
    this.textContent = this.props.elementList.map((element) => ({
      title: element.title,
      content: element.content,
    }));

    this.createOnBoarding();
  }

  /**
   * Create the onboarding popup from CustomPopup component
   * @alias createOnBoarding
   * @memberof OnBoarding
   */
  async createOnBoarding() {
    const bodyContent = `
          <div class="onboard-content">
            ${this.props.openPage.content}
          </div>
        `;
    const footerContent = `
          <div class="button-container flex pr-2">
            <div class="prev-container disp-none"></div>
            <div class="next-container pl-2"></div>
          </div>
          <span class="page-indicator disp-none pl-3">
            <span class="act-page"></span>/${this.textContent.length}
          </span>
        `;

    const popup = new CustomPopup(document.body, {
      title: this.props.openPage.title,
      bodyContent: bodyContent,
      footerContent: footerContent,
    });
    await popup.render();

    this.nextBtn = new FPComponents.Button_A();
    this.nextBtn.text = 'Next';
    this.nextBtn.highlight = true;
    const prevBtn = new FPComponents.Button_A();
    prevBtn.text = 'Prev';

    prevBtn.attachToElement(popup.find('.prev-container'));
    this.nextBtn.attachToElement(popup.find('.next-container'));

    this.step = 0;
    this.nextBtn.onclick = () => this.handleButtonClick(1, popup);
    prevBtn.onclick = () => this.handleButtonClick(-1);
  }

  /**
   * Handle the button click event for the onboarding popup
   * @alias handleButtonClick
   * @memberof OnBoarding
   * @param {number} inc - The increment value for the step
   * @param {Object} popup - The onboarding popup object
   */
  handleButtonClick(inc, popup = null) {
    const actPage = document.querySelector('.act-page');
    const closeBtn = document.querySelector('.close-button');
    const { elementList, openPage } = this.props;
    const elementLength = elementList.length;

    const updateBtnState = (type) => {
      this.nextBtn.text = type === 'hide' ? 'Close' : 'Next';
      closeBtn.style.display = type === 'hide' ? 'none' : 'block';
    };

    this.step = Math.max(0, Math.min(this.step + inc, elementLength + 1));

    switch (this.step) {
      case 0:
        this.changePopupStyle('default');
        this.changeContent(openPage.title, openPage.content);
        return;
      case 1:
        this.changePopupStyle();
        if (elementLength === 1) {
          updateBtnState('hide');
        } else if (elementLength === 2) {
          updateBtnState('unhide');
        }
        break;
      case elementLength - 1:
        updateBtnState('unhide');
        break;
      case elementLength:
        updateBtnState('hide');
        break;
      case elementLength + 1:
        popup && popup.destroy();
        return;
    }

    const { element, position } = elementList[this.step - 1];
    const htmlElement = document.querySelector(element);
    this.highlightElement(htmlElement, position);

    actPage.innerHTML = this.step;
    this.changeContent(
      this.textContent[this.step - 1].title,
      this.textContent[this.step - 1].content
    );
  }

  /**
   * Change the style of the onboarding popup
   * @alias changePopupStyle
   * @memberof OnBoarding
   * @param {string} type - The type of the popup
   */
  changePopupStyle(type = 'info') {
    const popupCont = document.querySelector('.popup-content');
    const header = document.querySelector('.popup-header');
    const body = document.querySelector('.popup-body');
    const content = document.querySelector('.onboard-content');
    const pageIndicator = document.querySelector('.page-indicator');
    const popupFooter = document.querySelector('.popup-footer');
    const prevBtnContainer = document.querySelector('.prev-container');
    const popup = document.querySelector('.popup');

    if (type === 'info') {
      popup.style.display = 'block';
      popupCont.style.borderTop = 'none';
      popupCont.style.width = '300px';
      popupCont.style.minWidth = '0px';
      popupCont.classList.add('triang');
      header.style.margin = '0px';
      body.style.padding = '0px';
      content.style.padding = '0.75rem';
      content.style.color = 'var(--text-black-secondary, #686868)';
      pageIndicator.style.display = 'block';
      pageIndicator.style.color = 'var(--text-black-secondary, #686868)';
      popupFooter.style.justifyContent = 'space-between';
      prevBtnContainer.style.display = 'block';
    } else {
      popup.style.display = 'flex';
      popup.style.maskComposite = 'unset';
      popupCont.style = '4px solid #3366FF';
      popupCont.classList.remove('triang');
      header.style.marginBottom = '1.5rem';
      header.style.marginTop = '0.75rem';
      body.style.padding = '1rem';
      content.style.padding = '1rem';
      content.style.color = '#000';
      pageIndicator.style.display = 'none';
      popupFooter.style.justifyContent = 'flex-end';
      prevBtnContainer.style.display = 'none';
    }
  }

  /**
   * Highlight the element in the onboarding popup
   * @alias highlightElement
   * @memberof OnBoarding
   * @param {Object} element - The element to be highlighted
   * @param {string} direction - The direction where the popup should be moved
   */
  highlightElement(element, direction = 'right') {
    const elementDim = element.getBoundingClientRect();
    const { left: startElemX, top: startElemY, width, height } = elementDim;
    const endElemX = startElemX + width;
    const endElemY = startElemY + height;
    const newPoints = `${startElemX},${startElemY} ${startElemX},${endElemY} ${endElemX},${endElemY} ${endElemX},${startElemY}`;

    const popup = document.querySelector('.popup');
    popup.style.mask = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"><polygon points="${newPoints}" fill="black"/></svg>'),linear-gradient(#fff,#fff)`;
    popup.style.maskComposite = 'exclude';

    this.movePopup(elementDim, direction);
  }

  /**
   * Change the content of the onboarding popup
   * @alias changeContent
   * @memberof OnBoarding
   * @param {string} title - The title of the popup
   * @param {string} body - The body of the popup
   */
  changeContent(title, body) {
    const popupTitle = document.querySelector('.popup-header .title');
    const popupBody = document.querySelector('.onboard-content');
    popupTitle.innerHTML = title;
    popupBody.innerHTML = body;
  }

  /**
   * Move the onboarding popup to the correct position
   * @alias movePopup
   * @memberof OnBoarding
   * @param {Object} dimension - The dimension of the element
   * @param {string} direction - The direction where the popup should be moved
   */
  movePopup(dimension, direction) {
    const popupCont = document.querySelector('.popup-content');
    const { width: popupWidth, height: popupHeight } =
      popupCont.getBoundingClientRect();
    const endElemX = dimension.left + dimension.width;
    const endElemY = dimension.top + dimension.height;
    const margin = 10;
    const className = `popup-content triang triang-${direction}`;

    const styles = {
      right: {
        left: `${endElemX + margin}px`,
        top: `${endElemY - dimension.height / 2 - popupHeight / 2}px`,
      },
      left: {
        left: `${dimension.left - popupWidth - margin}px`,
        top: `${endElemY - dimension.height / 2 - popupHeight / 2}px`,
      },
      down: {
        left: `${endElemX - dimension.width / 2 - popupWidth / 2}px`,
        top: `${endElemY + margin}px`,
      },
      top: {
        left: `${endElemX - dimension.width / 2 - popupWidth / 2}px`,
        top: `${dimension.top - popupHeight - margin}px`,
      },
    };

    Object.assign(popupCont.style, styles[direction]);
    popupCont.className = className;
  }

  /**
   * Generates the HTML definition corresponding to the component.
   * html elements for different components in the layout
   * @alias markup
   * @memberof OnBoarding
   * @returns {string}
   */
  markup() {
    return /*html*/ `
    `;
  }
}

/**
 * Add css properties to the component
 * @alias loadCssClassFromString
 * @static
 * @param {string} css - The css string to be loaded into style tag
 * @memberof OnBoarding
 */
OnBoarding.loadCssClassFromString(/*css*/ `
  .onboard-content {
    padding: 1rem;
  }
  .button-container .fp-components-button {
    width: 75px;
  }
  .popup-content.triang::after {
    content: "";
    position: absolute;
    margin-top: -10px;
    border-width: 10px;
    border-style: solid;
  }
  .popup-content.triang-right::after {
    top: 50%;
    right: 100%;
    border-color: transparent white transparent transparent;
  }
  .popup-content.triang-left::after {
    top: 50%;
    left: 100%;
    border-color: transparent transparent transparent white;
  }
  .popup-content.triang-down::after {
    bottom: 100%;
    left: 50%;
    border-color: transparent transparent white transparent;
  }
  .popup-content.triang-top::after {
    bottom: -14%;
    left: 50%;
    border-color: white transparent transparent transparent;
  }
`);
