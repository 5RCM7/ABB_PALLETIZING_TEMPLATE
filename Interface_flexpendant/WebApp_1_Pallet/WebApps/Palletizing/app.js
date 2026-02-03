import {
  imgProd,
  imgTune,
  imgConf,
  patternBuilder,
} from './constants/images.js';
import ProdView from './views/production/prodView.js';
import TunView from './views/tuning/tunView.js';
import ConfView from './views/configuration/confView.js';
import PatternBuilderView from './views/pattern builder/patternBuilderView.js';
import { stackData } from './leanPallet/StackData.js';
import { l } from './services/translation.js';
import { Utils } from './services/utils.js';

/**
 * @class App
 * @classdesc This class is responsible for rendering the main app view
 * @extends TComponents.Component_A
 * @param {HTMLElement} parent - The parent element to which the view will be rendered
 */
export default class App extends TComponents.Component_A {
  constructor(parent) {
    super(parent);

    this.hamburgerViews = {
      production: l.trans('prod.title'),
      tune: l.trans('com.tune'),
      config: l.trans('com.conf'),
      patterns: l.trans('com.build'),
    };
  }

  /**
   * Contains component specific asynchronous implementation (like access to controller).
   * This method is called internally during initialization process orchestrated by {@link init() init}.
   * Show onboarding page once and save state in json file
   * @alias onInit
   * @memberof App
   */
  async onInit() {
    let setupCont = await Utils.getSetup();
    if (!setupCont.hasOwnProperty('disable_pattern_builder')) {
      setupCont.disable_pattern_builder = false;
      await Utils.setSetup(setupCont);
    }

    if (!setupCont.hasOwnProperty('disable_recipe_config')) {
      setupCont.disable_recipe_config = false;
      await Utils.setSetup(setupCont);
    }

    if (!setupCont.hasOwnProperty('enable_debug')) {
      setupCont.enable_debug = false;
      await Utils.setSetup(setupCont);
    } else {
      if (setupCont.enable_debug) {
        fpComponentsEnableLog();
      }
    }

    this.disablePatternBuilderView = setupCont.disable_pattern_builder;
    this.disableRecipeConfigView = setupCont.disable_recipe_config;
  }

  /**
   * Instantiation of App sub-components that shall be initialized in a synchronous way.
   * All this components are then accessible within {@link onRender() onRender} method by using this.child.<component-instance>
   * Create 4 instances of the views that will be used later in the hamburger menu (Production, Tuning, Configuration, Pattern Builder)
   * @alias mapComponents
   * @memberof App
   * @returns {object} Contains all child App instances used within the component.
   */
  mapComponents() {
    const views = [];
    views.push({
      name: this.hamburgerViews.production,
      content: new ProdView(null),
      image: imgProd,
      active: true,
    });
    views.push({
      name: this.hamburgerViews.tune,
      content: new TunView(null),
      image: imgTune,
    });

    if (this.disableRecipeConfigView === false) {
      views.push({
        name: this.hamburgerViews.config,
        content: new ConfView(null, {
          changeHamView: this.changeHamburgermenu.bind(this),
        }),
        image: imgConf,
      });
    } else {
      stackData.projectProp.loadProject();
    }
    if (this.disablePatternBuilderView === false) {
      views.push({
        name: this.hamburgerViews.patterns,
        content: new PatternBuilderView(null, {
          changeHamView: this.changeHamburgermenu.bind(this),
        }),
        image: patternBuilder,
      });
    }

    const hamburgerMenu = new TComponents.Hamburger_A(
      this.find('.hamburger-container'),
      {
        title: 'Palletizing',
        alwaysVisible: true,
        views,
        onChange: this.cbOnChangeHMenu.bind(this),
      }
    );
    return {
      hamburgerMenu,
    };
  }

  /**
   * Contains all synchronous operations/setups that may be required for any sub-component after its initialization and/or manipulation of the DOM.
   * This method is called internally during rendering process orchestrated by {@link render() render}.
   * Add class to display pages stretched to the full height of the container
   * @alias onRender
   * @memberof App
   */
  onRender() {
    this.container.classList.add('tc-container');
  }

  cbOnChangeHMenu(prevView, activeView) {
    switch (activeView) {
      case this.hamburgerViews.config:
        const configView = this.child.hamburgerMenu.views[2].content;
        const stepView = configView.child.stepContainer;

        if (
          stepView.activeTab === stepView.viewList[3] &&
          prevView === this.hamburgerViews.patterns
        ) {
          const patternView = stepView.views[3].content;
          const itemsOld = patternView.child.patternDropdown.items;
          const itemsNew = stackData.libProp.libPatternProp.map((i) => i.name);

          patternView.child.patternDropdown.setProps({ itemList: itemsNew });
          patternView.child.patternDropdown.enabled = true;

          // adapt the selected patterns to the new list
          for (let i = 0; i < 3; i++) {
            const patternIndex = stackData.stack.patterns[i];
            if (itemsOld[patternIndex] != itemsNew[patternIndex]) {
              const newIndex = itemsNew.indexOf(itemsOld[patternIndex]);
              if (newIndex !== -1) {
                stackData.stack.patterns[i] = newIndex;
              } else {
                stackData.stack.patterns[i] = undefined;
                stackData.pItems[i] = undefined;
              }
            }
          }

          configView.preparePatternPage();
        }

        break;

      default:
        break;
    }
  }

  /**
   * Change the hamburger menu view to the selected one, helps navigate through the different views
   * @alias changeHamburgermenu
   * @memberof App
   * @param {string} name - The name of the view to be displayed
   */
  changeHamburgermenu(name) {
    if (name === this.child.hamburgerMenu.viewList[2]) {
      // changing to product configuraiton view
      const stepView =
        this.child.hamburgerMenu.views[2].content.child.stepContainer;
      if (stepView.activeTab === stepView.viewList[3])
        this.child.hamburgerMenu.activeView = name;
    } else {
      this.child.hamburgerMenu.activeView = name;
    }
  }

  /**
   * Generates the HTML definition corresponding to the component.
   * Div element for the hamburger menu
   * @alias markup
   * @memberof App
   * @returns {string}
   */
  markup() {
    return /*html*/ `
        <div class="hamburger-container tc-container"></div>
    `;
  }
}
