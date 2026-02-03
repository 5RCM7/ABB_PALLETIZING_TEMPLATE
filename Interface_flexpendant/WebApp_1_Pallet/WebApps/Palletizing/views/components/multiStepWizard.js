import { closeIcon } from '../../constants/images.js';
import { l } from '../../services/translation.js';

/**
 * @class MultiStep
 * @classdesc This class is a multi step wizard element
 * @extends TComponents.Component_A
 * @memberof ConfView
 * @param {HTMLElement} parent - The parent element to which the view will be rendered
 * @param {Object} props - The properties object to be passed to the view
 */
export default class MultiStep extends TComponents.TabContainer_A {
  constructor(parent, props) {
    super(parent, props);
  }

  /**
   * Contains component specific asynchronous implementation (like access to controller).
   * This method is called internally during initialization process orchestrated by {@link init() init}.
   * Define behavior for next/back buttons
   * @alias onInit
   * @memberof MultiStep
   */
  async onInit() {
    this._props.hiddenTabs = true;
    await super.onInit();
  }

  mapComponents() {
    const closeBtn = new TComponents.Button_A(this.find('.wiz-close-button'), {
      text: '',
      icon: closeIcon,
    });
    const nextBtn = new TComponents.Button_A(this.find('.next-button'), {
      text: l.trans('com.next'),
      onClick: () => {
        const index = Array.from(this.all('.step-index')).indexOf(
          this.find('.active')
        );
        // Change the step indicator style depending on the index
        this.changeStep('next', index);
        this.handleNextButton(index);
      },
    });
    const backBtn = new TComponents.Button_A(this.find('.back-button'), {
      text: l.trans('com.back'),
      onClick: () => {
        const index = Array.from(this.all('.step-index')).indexOf(
          this.find('.active')
        );
        // Change the step indicator style depending on the index
        this.changeStep('back', index);
        this.handleBackButton(index);
      },
    });

    let ret = super.mapComponents();
    ret = Object.assign(ret, { closeBtn, nextBtn, backBtn });

    return ret;
  }

  /**
   * Contains all synchronous operations/setups that may be required for any sub-component after its initialization and/or manipulation of the DOM.
   * This method is called internally during rendering process orchestrated by {@link render() render}.
   * Create the buttons and the initialize the srep of wizard
   * @alias onRender
   * @memberof MultiStep
   */
  onRender() {
    super.onRender();

    if (this.views.length < 2) {
      Popup_A.warning('Multi step', [
        `The number of steps is less than 2.`,
        'Please add more steps to the wizard.',
      ]);
      return;
    }

    const stepIndex = this.all('.step-index');
    stepIndex[0].classList.add('active');

    this.nextPageHandlers = this.views.map((view) => view.onNext);
    this.backPageHandlers = this.views.map((element) => element.onBack);
  }

  /**
   * Change the page and step indicator depending on the control
   * @alias changeStep
   * @memberof MultiStep
   * @param {string} action - The action to be performed
   * @param {number} currentIndex - The index of the current step
   */
  changeStep(action, currentIndex) {
    const nextIndex = action === 'next' ? currentIndex + 1 : currentIndex - 1;
    const status = action === 'next' ? 'completed' : 'default';

    this.changeStepIndicator(currentIndex, status);
    if (nextIndex >= 0 && nextIndex < this.viewList.length) {
      this.changeStepIndicator(nextIndex, 'active');
      this.activeTab = this.viewList[nextIndex];
    }
  }

  /**
   * Change the step indicator depending on the index
   * @alias changeStepIndicator
   * @memberof MultiStep
   * @param {number} index - The index of the step
   * @param {string} backgroundColor - The background color of the step
   * @param {string} color - The color of the step
   */
  changeStepIndicator(index, stepState) {
    const stepIndex = this.all('.step-index');

    // Remove all possible classes first
    stepIndex[index].classList.remove('completed', 'active', 'default');

    let innerHTMLContent;
    if (stepState === 'completed') {
      innerHTMLContent = '&#x2713';
    } else if (stepState === 'active' || stepState === 'default') {
      innerHTMLContent = index + 1;
    }

    stepIndex[index].innerHTML = innerHTMLContent;
    stepIndex[index].classList.add(stepState);
  }

  /**
   * Events when clicking the next button
   * @alias handleNextButton
   * @memberof MultiStep
   * @param {number} index - The index of the page
   */
  handleNextButton(index) {
    if (index >= 0 && index < this.nextPageHandlers.length) {
      switch (index) {
        case 0:
          // Unhide the back button
          this.find('.back-button').style.display = 'block';
          break;
        case this.viewList.length - 2:
          // Change the next button text to save
          this.child.nextBtn.text = 'Save';
          break;
        case this.viewList.length - 1:
          // Set the page back to default
          this.resetDefault();
          break;
      }
      if (typeof this.nextPageHandlers[index] === 'function')
        this.nextPageHandlers[index].call(this);
    }
  }

  /**
   * Reset the mulitstep wizard to its default state
   * @alias resetDefault
   * @memberof MultiStep
   */
  resetDefault() {
    this.find('.back-button').style.display = 'none';
    this.activeTab = this.viewList[0];
    this.child.nextBtn.text = 'Next';
    this.child.nextBtn.enabled = true;
    this.viewList.forEach((view, i) => {
      this.changeStepIndicator(i, i === 0 ? 'active' : 'default');
    });
  }

  /**
   * Events when clicking the back button
   * @alias handleBackButton
   * @memberof MultiStep
   * @param {number} index - The index of the page
   */
  handleBackButton(index) {
    if (index === 1) {
      this.find('.back-button').style.display = 'none';
    } else if (index === this.viewList.length - 1) {
      this.child.nextBtn.text = 'Next';
    } else if (index > 0 && this.child.nextBtn.enabled === false) {
      this.nextBtnEnable(true);
    }

    if (typeof this.backPageHandlers[index] === 'function')
      this.backPageHandlers[index].call(this);
  }

  /**
   * Enable or disable the next button
   * @alias nextBtnEnable
   * @memberof MultiStep
   * @param {boolean} value - The value to enable or disable the button
   */
  nextBtnEnable(value) {
    this.child.nextBtn.enabled = value;
  }

  /**
   * Render the steps of the wizard
   * @alias renderSteps
   * @memberof MultiStep
   * @param {Object} view - The view object
   * @param {number} index - The index of the view
   * @returns {string}
   */
  renderSteps(view, index) {
    return /*html*/ `
    <div class="step-cont flex-col items-center">
      <div class="view-step">
        ${view.name}
      </div>
      <div class="step-index">${index + 1}</div>
    </div>
    `;
  }

  /**
   * Render the views of the tab container
   * @alias renderViews
   * @memberof MultiStep
   * @returns {string}
   */
  renderViews() {
    return /*html*/ `
    ${this.views
      .filter(({ id }) => id !== null)
      .reduce((html, { id }) => html + `<div id="${id}"></div>`, '')}
    `;
  }

  /**
   * Generates the HTML definition corresponding to the component.
   * html elements for different components in the layout
   * @alias markup
   * @memberof MultiStep
   * @returns {string}
   */
  markup() {
    return this.views.length < 2
      ? `${this.renderViews()}`
      : /*html*/ `
          <div class="view-main-menu">
            <div class="wiz-close-button"></div> 
            <div class="view-main flex justify-center">
              ${TComponents.Component_A.mFor(
                this.views,
                this.renderSteps.bind(this)
              )}
            </div>
          </div>
          ${this.renderViews()}
          <div class="step-ctrl">
            <div class="back-button"></div>
            <div class="next-button mr-3 ml-3"></div>
          </div>
      `;
  }
}

/**
 * Add css properties to the component
 * @alias loadCssClassFromString
 * @static
 * @param {string} css - The css string to be loaded into style tag
 * @memberof MultiStep
 */
MultiStep.loadCssClassFromString(/*css*/ `
  .view-main-menu{
    display: flex;
    justify-content: center;
    padding: 1.75rem 1.75rem 0.5rem 1.75rem;
    margin: 0.5rem 0.5rem 0 0.5rem;
    border-radius: 8px;
    background: white;
    position: relative;
  }
  .view-main-menu .wiz-close-button {
    position: absolute;
    right: 10px;
    top: 10px;
  }
  .wiz-close-button .fp-components-button {
    min-width: 10px;
    padding: 0 0.75rem;
  }
  .wiz-close-button .fp-components-button-icon {
    margin: 0;
    width: 16px;
    height: 16px;
  }
  .step-cont{
    width: 90px;
    position: relative;
  }
  .step-index{
    border-radius: 50%;
    width: 30px;
    height: 30px;
    font-weight: 500;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #D9D9D9;
  }
  .step-index.completed {
    background-color: #329A5D;
    color: #fff;
  }
  .step-index.active {
    background-color: #3366FF;
    color: #fff;
  }
  .step-index.default {
    background-color: #D9D9D9;
    color: #000;
  }
  .step-cont::before {
    content: "";
    position: absolute;
    width: 45px;
    height: 0.25px;
    background-color: #000;
    top: 38px;
    left: -23px;
  }
  .step-cont:first-child::before {
    display: none;
  }
  .step-ctrl{
    display: flex;
    position: absolute;
    right: 0px;
    bottom: 12px;
  }
  .step-ctrl + .fp-components-tabcontainer {
    min-height: 75%;
  }
  .back-button{
    display: none;
  }
`);
