import {
  resumeIcon,
  playIcon,
  stopIcon,
  infoIcon,
  closeIcon,
  infoIconB,
} from '../../constants/images.js';
import {
  cmd,
  statusProduction,
  checkInputRange,
  intRegex,
} from '../../constants/common.js';
import fs, { FILES_DIRECTORY_RECIPES } from '../../services/fileManager.js';
import { drawPalletWithBoxes } from '../pattern builder/patternHelper.js';
import { stackData } from '../../leanPallet/StackData.js';
import { fetchData } from '../../services/dataManager.js';
import DropDownButton from '../components/dropDownButton.js';
import { patternItemProperties } from '../../leanPallet/DataType classes/PatternItemProperties.js';
import CustomPopup from '../components/customPopup.js';
import { l } from '../../services/translation.js';

/**
 * @class Production
 * @classdesc This class is responsible for rendering the main page of production
 * @extends TComponents.Component_A
 * @memberof ProdView
 * @param {HTMLElement} parent - The parent element to which the view will be rendered
 * @param {Object} props - The properties object to be passed to the view
 */
export default class Production extends TComponents.Component_A {
  constructor(parent, props = {}) {
    super(parent, props);
  }

  /**
   * Contains component specific asynchronous implementation (like access to controller).
   * This method is called internally during initialization process orchestrated by {@link init() init}.
   * Subscribe for execution,production and box state
   * @alias onInit
   * @memberof Production
   */
  async onInit() {
    this.monitorProductionState();
    this.monitorExecutionState();
    this.monitorBoxState();
  }

  /**
   * Monitor the production state and change the elements depending on the state
   * @alias monitorProductionState
   * @memberof Production
   */
  async monitorProductionState() {
    try {
      const { dataPromise: prodStatus } = await fetchData(
        'AppData',
        'ProductionStatus'
      );
      const updateStopDropdown = (items) => {
        this.child.stopDropdownBtn.items = items;
        this.child.stopDropdownBtn.selected = items[0];
      };
      const updateResumeDropdown = (items) => {
        this.child.resumeDropdownBtn.items = items;
        this.child.resumeDropdownBtn.selected = items[0];
      };
      prodStatus.addCallbackOnChanged(async () => {
        const prodValue = await prodStatus.getValue();
        const cancelBox = this.find('.info-box.cancel');

        if (prodValue === statusProduction.running) {
          // Production starts have all the stop selectors
          cancelBox.style.display = 'none';
          updateStopDropdown(l.trans('prod.stop'));
          updateResumeDropdown(l.trans('prod.resume'));
          // Get the parameters and show status when production starts (data initialized)
          await this.getBoxAndPallDim();
          this.getRecordData('Init', 'Pallet', 'NrOfLayers', '.layer-cnt');
          await this.getSimpleData('AppData', 'BoxesTotal', '.box-cnt');
        } else if (prodValue === statusProduction.endCycle) {
          // Stop after placing current box change stop selector and show cancel panel
          updateStopDropdown(l.trans('prod.stop').slice(0, 1));
          cancelBox.style.display = 'block';
        } else if (prodValue === statusProduction.endPallet) {
          // Stop after pallet cycle change stop selector and show cancel panel
          updateStopDropdown(l.trans('prod.stop').slice(0, 2));
          cancelBox.style.display = 'block';
        } else if (prodValue === statusProduction.homeRun) {
          // Home run change resume selector
          updateResumeDropdown(l.trans('prod.resume').slice(1, 2));
        } else if (prodValue === statusProduction.endHome) {
          // End of home run
          updateResumeDropdown(l.trans('prod.resume').slice(0, 1));
        }
      });
      await prodStatus.subscribe();
    } catch (error) {
      TComponents.Popup_A.error(error);
    }
  }

  /**
   * Monitors the workrange check mode by subscribing to changes in the 'WorkrangeCheckMode' data.
   * When the workrange check mode changes to false, logs a message indicating that the reachability check has finished.
   * If an error occurs during the process, it displays an error popup.
   *
   * @method processReachabilityCheck
   * @memberof Production
   *
   * @returns {boolean}
   **/
  async processReachabilityCheck() {
    try {
      const { dataPromise: workrangeCheckMode } = await fetchData(
        'AppData',
        'WorkrangeCheckMode'
      );
      const isCheckMode = await workrangeCheckMode.getValue();

      if (isCheckMode) {
        // set checkmode back to false
        await RWS.Rapid.setDataValue(
          'T_ROB1',
          'AppData',
          'WorkrangeCheckMode',
          false
        );

        // retrieve results of the workrange check
        const workrangeError = await RWS.Rapid.getData(
          'T_ROB1',
          'WorkrangeCheck',
          'WorkRangeError'
        );
        const workrangeErrorValue = await workrangeError.getValue();

        // Filter the workrangeError array to get only entries with non-empty messages
        const errorMessages = workrangeErrorValue
          .filter((error) => error.message !== '')
          .map(
            (error) =>
              `${error.pallet > 0 ? `Pallet ${error.pallet},` : ``} ${
                error.layer > 0 ? `Layer ${error.layer}` : ``
              } ${error.box > 0 ? `, Box ${error.box}` : ``}: ${error.message}`
          );

        // Display the error messages in a warning popup
        if (errorMessages.length > 0) {
          TComponents.Popup_A.warning('Reachability Check', errorMessages);
        } else {
          TComponents.Popup_A.info('Reachability Check', 'No errors found.');
        }
      }

      return isCheckMode;
    } catch (error) {
      TComponents.Popup_A.error(error);
    }
  }

  /**
   * Monitor the execution state and change the elements depending on the state
   * @alias monitorProductionState
   * @memberof Production
   */
  async monitorExecutionState() {
    try {
      const executionMonitor = RWS.Rapid.getMonitor('execution');

      executionMonitor.addCallbackOnChanged(async (stateValue) => {
        const cancelBox = this.find('.info-box.cancel');
        const productSelect = this.find('.product-change');
        const isRunning = stateValue === 'running';

        let isCheckMode = false;
        if (!isRunning) {
          isCheckMode = await this.processReachabilityCheck();
        }

        if (isCheckMode) {
          this.updateButtonState({
            startState: true,
            stopState: false,
            resumeState: false,
            abortDisplay: 'block',
          });
        } else {
          this.updateButtonState({
            startState: false,
            stopState: isRunning,
            resumeState: !isRunning,
            abortDisplay: isRunning ? 'none' : 'block',
          });
        }
        productSelect.style.display = 'none';

        if (!isRunning) {
          cancelBox.style.display = 'none';
        } else {
          const prodValue = await fetchData('AppData', 'ProductionStatus').then(
            (res) => res.value
          );
          if (prodValue === 6 || prodValue === 9) {
            cancelBox.style.display = 'block';
          }
        }
      });
      await executionMonitor.subscribe();
    } catch (error) {
      TComponents.Popup_A.error(error);
    }
  }

  /**
   * Monitor the box status and change the elements depending on the state
   * @alias monitorBoxState
   * @memberof Production
   */
  async monitorBoxState() {
    try {
      const { dataPromise: boxStatus } = await fetchData(
        'AppData',
        'CurrentBoxStatus'
      );
      const checkAnyElementNotOne = (array) => {
        return array.some((element) => element !== 1);
      };

      let updateCalled = false;

      boxStatus.addCallbackOnChanged(async () => {
        const currentStatus = await boxStatus.getValue();

        // Calculate the actual pattern and draw the pallet status after first box initialization
        if (checkAnyElementNotOne(currentStatus)) {
          this.calcAndDrawActPattern();
          await this.getSimpleData('AppData', 'BoxesOnPallet', '.current-box');
          if (!updateCalled) {
            this.updateData('AppData', 'ActLayer', '.current-layer');
            updateCalled = true;
          }
          this.updateProgressBar();
        }
      });
      await boxStatus.subscribe();
    } catch (error) {
      TComponents.Popup_A.error(error);
    }
  }

  /**
   * Update the progress bar and the percentage of the progress
   * @alias updateProgressBar
   * @memberof Production
   */
  async updateProgressBar() {
    const totalBoxes = parseInt(this.find('.box-cnt').textContent);
    const placedBoxes = parseInt(this.find('.current-box').textContent);
    const progressBar = this.find('.progbar');
    const progDisp = this.find('.proc-perc');

    const { value: pallType } = await fetchData('Settings', 'Palletize');
    const { value: pallStat } = await fetchData('AppData', 'PalletStatus');

    // Check which pallet is active
    let isDepalletizing = pallType[pallStat.indexOf(2)] === 2;
    let progressBoxes = isDepalletizing
      ? totalBoxes - placedBoxes
      : placedBoxes;
    const progressPercentage = (progressBoxes / totalBoxes) * 100;
    progDisp.textContent = (100 - progressPercentage).toFixed(0);
    progressBar.style.width = `${progressPercentage}%`;
  }

  /**
   * Instantiation of Production sub-components that shall be initialized in a synchronous way.
   * All this components are then accessible within {@link onRender() onRender} method by using this.child.<component-instance>
   * Create infoboxes in the layout for product, palletizing actions and status and create buttons for start, resume,cancel actions.
   * @alias mapComponents
   * @memberof Production
   * @returns {object} Contains all child Production instances used within the component.
   */
  mapComponents() {
    //Create 3 Infobox in the Layout
    const productInfobox = new TComponents.LayoutInfobox_A(
      this.find('.product'),
      {
        title: l.trans('com.pall'),
        content: { children: this.find('.product-content') },
      }
    );
    const controlInfobox = new TComponents.LayoutInfobox_A(
      this.find('.actions'),
      {
        title: l.trans('prod.act'),
        content: {
          children: [
            this.find('.start-button'),
            this.find('.stop-button'),
            this.find('.res-button'),
          ],
        },
      }
    );
    const statusInfobox = new TComponents.LayoutInfobox_A(
      this.find('.status'),
      {
        title: l.trans('prod.stat'),
        content: { children: [this.find('.status-content')] },
      }
    );
    // Create buttons
    const startDropdownBtn = new DropDownButton(this.find('.start-button'), {
      itemList: l.trans('prod.start'),
      selected: l.trans('prod.start')[0],
      icon: playIcon,
      onClick: () => this.startCycle(),
    });
    const resumeDropdownBtn = new DropDownButton(this.find('.res-button'), {
      itemList: l.trans('prod.resume'),
      selected: l.trans('prod.resume')[0],
      icon: resumeIcon,
      onClick: () => this.resumePalletizing(),
    });
    const cancelBtn = new TComponents.Button_A(this.find('.cancel-button'), {
      text: l.trans('prod.cancel'),
      icon: closeIcon,
      onClick: () =>
        RWS.Rapid.setDataValue(
          'T_ROB1',
          'AppData',
          'AppCommand',
          cmd.stopCancel
        ),
    });
    const stopDropdownBtn = new DropDownButton(this.find('.stop-button'), {
      itemList: l.trans('prod.stop'),
      selected: l.trans('prod.stop')[0],
      icon: stopIcon,
      onClick: () => this.stopPalletizing(),
    });

    // Create buttons for pallet statuses
    const palletBtns = [];
    for (let i = 0; i < 4; i++) {
      palletBtns[i] = new TComponents.Button_A(
        this.find(`.pall${i + 1}-status`),
        {
          text: '',
          onClick: () => this.reportPalletOnClick(i),
        }
      );
    }
    const abortBtn = new TComponents.Button_A(this.find('.abort-button'), {
      text: l.trans('prod.abort'),
      onClick: () => this.abortPalletOnClick(),
    });
    return {
      productInfobox,
      controlInfobox,
      statusInfobox,
      startDropdownBtn,
      resumeDropdownBtn,
      cancelBtn,
      stopDropdownBtn,
      palletBtns,
      abortBtn,
    };
  }

  /**
   * Contains all synchronous operations/setups that may be required for any sub-component after its initialization and/or manipulation of the DOM.
   * This method is called internally during rendering process orchestrated by {@link render() render}.
   * Create a stop button and change product popup
   * @alias onRender
   * @memberof Production
   */
  onRender() {
    // Render main elements on the page
    this.renderElements();
    // Create the popup if the user clicks on the change product title
    const changeProd = this.find('.product-change');
    changeProd.addEventListener('click', this.createProdSelectPopup.bind(this));
  }

  /**
   * Enable/disable and update the elements depending on the execution state
   * @alias renderElements
   * @memberof Production
   */
  async renderElements() {
    // Show Pallet status buttons depending on the configuration
    this.renderPalletStatus();

    const [prodValue, state] = await Promise.all([
      fetchData('AppData', 'ProductionStatus').then((res) => res.value),
      RWS.Rapid.getExecutionState(),
    ]);

    // Check the execution state
    if (prodValue !== 0) {
      const productSelect = this.find('.product-change');
      const cancelBox = this.find('.info-box.cancel');
      // Enable/disable buttons
      if (state === 'running') {
        this.updateButtonState({
          startState: false,
          stopState: true,
          resumeState: false,
          abortDisplay: 'none',
        });
        if (prodValue === 6 || prodValue === 9) {
          cancelBox.style.display = 'block';
        }
      } else {
        this.updateButtonState({
          startState: false,
          stopState: false,
          resumeState: true,
          abortDisplay: 'block',
        });
      }
      productSelect.style.display = 'none';
      // Update product name
      const productDisp = this.find('.product-name');
      const { value: productName } = await fetchData('AppData', 'RecipeName');
      productDisp.textContent = productName;
      // Show the current pattern status
      await this.getBoxAndPallDim();
      this.calcAndDrawActPattern();
      // Get the layer data
      this.getRecordData('Init', 'Pallet', 'NrOfLayers', '.layer-cnt');
      this.updateData('AppData', 'ActLayer', '.current-layer');
      // Get the placed boxes
      await this.getSimpleData('AppData', 'BoxesTotal', '.box-cnt');
      await this.getSimpleData('AppData', 'BoxesOnPallet', '.current-box');
      this.updateProgressBar();
    } else {
      // Disable all the buttons if the pallet is aborted
      this.updateButtonState({
        startState: false,
        stopState: false,
        resumeState: false,
        abortDisplay: 'none',
      });
    }
  }

  /**
   * Update the state of the buttons
   * @alias updateButtonState
   * @memberof Production
   * @param {Object} states - The states object containing the properties to update
   * @param {boolean} [states.startState] - The state of the start button
   * @param {boolean} [states.stopState] - The state of the stop button
   * @param {boolean} [states.resumeState] - The state of the resume button
   * @param {string} [states.abortDisplay] - The display of the abort button
   */
  updateButtonState(states) {
    const { startDropdownBtn, stopDropdownBtn, resumeDropdownBtn, abortBtn } =
      this.child;

    if (states.hasOwnProperty('startState')) {
      startDropdownBtn.enabled = states.startState;
    }
    if (states.hasOwnProperty('stopState')) {
      stopDropdownBtn.enabled = states.stopState;
    }
    if (states.hasOwnProperty('resumeState')) {
      resumeDropdownBtn.enabled = states.resumeState;
    }
    if (states.hasOwnProperty('abortDisplay')) {
      abortBtn.parent.style.display = states.abortDisplay;
    }
  }

  /**
   * Render the pallet buttons depending on the configuration and update them
   * @alias renderPalletStatus
   * @memberof Production
   */
  async renderPalletStatus() {
    const palletText = l.trans('prod.pallStat');
    const palletTextColor = ['', '#2934FF', '#21A67A', '#1F1F1F'];

    // Get the button configurations and pallet status in parallel
    const [btnCfg, btnStatuses] = await Promise.all([
      fetchData('Settings', 'AllowAppRelease').then((res) => res.value),
      RWS.Rapid.getData('T_ROB1', 'AppData', 'PalletStatus'),
    ]);
    const pallTitle = this.all('.pall-title');

    // Update specific pallet button
    const updatePalletButtons = async () => {
      const statValues = await btnStatuses.getValue();
      const stationInfo = this.find('.station-info');

      let palletFull = true;
      for (let i = 0; i < 4; i++) {
        const palletBtn = this.child.palletBtns[i];
        switch (btnCfg[i]) {
          case 0:
            palletBtn.parent.style.display = 'none';
            pallTitle[i].style.display = 'none';
            break;
          case 1:
            palletBtn.enabled = false;
            break;
          case 2:
            palletBtn.enabled = true;
            break;
        }
        if (statValues[i] !== 3) {
          palletBtn.enabled = false;
          palletFull = false;
        }
        palletBtn.text = `${palletText[statValues[i]]}`;
        // Execute in the end of the event queue
        setTimeout(() => {
          palletBtn.parent.querySelector(
            '.fp-components-button-text'
          ).style.color = `${palletTextColor[statValues[i]]}`;
        }, 0);
      }
      // Station info if pallet is full
      if (palletFull) {
        stationInfo.style.display = 'block';
        stationInfo.textContent = l.trans('prod.wait');
      } else {
        stationInfo.style.display = 'none';
      }
    };

    updatePalletButtons();
    btnStatuses.addCallbackOnChanged(updatePalletButtons);
    await btnStatuses.subscribe();
  }

  /**
   * Abort pallet on click method.
   * @alias abortPalletOnClick
   * @memberof Production
   */
  abortPalletOnClick() {
    TComponents.Popup_A.confirm(
      l.trans('prod.abort_popup')[0],
      l.trans('prod.abort_popup').slice(1, 3),
      (action) => {
        if (action !== 'ok') return;
        this.confirmAbortPallet();
      }
    );
  }

  /**
   * Abort the pallet and delete data from the page if confirmed
   * @alias confirmAbortPallet
   * @memberof Production
   */
  confirmAbortPallet() {
    const productSelect = this.find('.product-change');
    const selectors = [
      '.product-name',
      '.layer-name',
      '.layer-cnt',
      '.current-layer',
      '.current-box',
      '.box-cnt',
      '.proc-perc',
    ];
    const elements = selectors.map((selector) => this.find(selector));
    const progressBar = this.find('.progbar');

    progressBar.style.width = '0%';
    RWS.Rapid.setDataValue('T_ROB1', 'AppData', 'ProductionStatus', 0);
    productSelect.style.display = 'block';
    elements.forEach((element) => (element.textContent = ''));
    this.updateButtonState({
      startState: false,
      stopState: false,
      resumeState: false,
      abortDisplay: 'none',
    });
    if (this.pallet) this.pallet.clearCanvas();
  }

  /**
   * Report pallet on click method.
   * @alias reportPalletOnClick
   * @memberof Production
   * @param {number} i - The index of the pallet
   */
  async reportPalletOnClick(i) {
    const [startLay, startBox] = await Promise.all([
      fetchData('Init', 'StartLayer').then((res) => res.value),
      fetchData('Init', 'StartCycle').then((res) => res.value),
    ]);

    TComponents.Popup_A.confirm(
      l.trans('prod.report_popup')[0],
      [
        l.trans('prod.report_popup', { var1: i + 1 })[1],
        l.trans('prod.report_popup')[2],
        startLay[i] === 1 && startBox[i] === 1
          ? ''
          : l.trans('prod.report_popup', {
              var1: startLay[i],
              var2: startBox[i],
            })[3],
      ],
      (action) => {
        if (action !== 'ok') return;
        this.confirmReportPallet(i);
      }
    );
  }

  /**
   * Report the pallet as empty if confirmed
   * @alias confirmReportPallet
   * @param {number} i - The index of the pallet
   * @memberof Production
   */
  confirmReportPallet(i) {
    RWS.Rapid.setDataValue('T_ROB1', 'AppData', `PalletStatus{${i + 1}}`, 1);
  }

  /**
   * Retrieve box and pallet parameters from the RAPID code
   * @alias getBoxAndPallDim
   * @memberof Production
   */
  async getBoxAndPallDim() {
    const [palletLength, palletWidth, boxLength, boxWidth] = await Promise.all([
      fetchData('AppData', 'PalletLength').then((res) => res.value),
      fetchData('AppData', 'PalletWidth').then((res) => res.value),
      fetchData('AppData', 'BoxLength').then((res) => res.value),
      fetchData('AppData', 'BoxWidth').then((res) => res.value),
    ]);

    stackData.palletProp.length = palletLength;
    stackData.palletProp.width = palletWidth;
    stackData.boxProp.length = boxLength;
    stackData.boxProp.width = boxWidth;
  }

  /**
   * Calculate the actual pattern and draw the pallet status
   * @alias calcAndDrawActPattern
   * @memberof Production
   */
  async calcAndDrawActPattern() {
    const [boxStatuses, boxFormulas, patternName, boxParents] =
      await Promise.all([
        fetchData('AppData', 'CurrentBoxStatus').then((res) => res.value),
        fetchData('AppData', 'CurrentLayerFormula').then((res) => res.value),
        fetchData('AppData', 'ActLayerName').then((res) => res.value),
        fetchData('AppData', 'CurrentBoxParents').then((res) => res.value),
      ]);

    const index = stackData.libProp.getPatternIndex(patternName);
    const layerName = this.find('.layer-name');

    // Show actual pattern name
    layerName.textContent = patternName;

    stackData.pItems[3] = [];
    const boxFormulasMod = boxFormulas.filter((box) => box !== '');

    for (let i = 0; i < boxFormulasMod.length; i++) {
      stackData.pItems[3].push(
        new patternItemProperties(
          i,
          boxFormulas[i],
          stackData.boxProp.pickLSL,
          stackData.boxProp.pickSSL
        )
      );
    }
    stackData.patternCreation.calcPattern(3);
    // Draw the pallet with actual pattern
    this.pallet = drawPalletWithBoxes(
      this.find('.palletStatus'),
      3,
      stackData,
      stackData.palletProp.length,
      stackData.palletProp.width,
      boxStatuses,
      true,
      boxParents
    );
  }

  /**
   * Update the product name and close the popup when the user clicks on the update button
   * Also update the project name in the RAPID code
   * @alias updateAndClose
   * @param {object} prodSelector - The product selector object
   * @param {object} popup - The popup object
   * @memberof Production
   */
  updateAndClose(prodSelector, popup) {
    const productName = document.querySelector('.product-name');
    const selectedIndex = prodSelector.selected;

    if (selectedIndex != null) {
      productName.textContent = prodSelector.model.items[selectedIndex];
    }
    RWS.Rapid.setDataValue(
      'T_ROB1',
      'AppData',
      'RecipeName',
      '"' + productName.textContent + '"'
    );
    popup.destroy();
    this.child.startDropdownBtn.enabled = true;
  }

  /**
   * Create the product selection popup with existing products
   * @alias createProdSelectPopup
   * @memberof Production
   */
  async createProdSelectPopup() {
    const bodyContent = `
        <span class="dropdown-label">${l.trans('prod.select_popup')[0]}</span>
        <div class="dropdown"></div>
      `;

    const popup = new CustomPopup(document.body, {
      title: l.trans('prod.select_popup')[1],
      bodyContent: bodyContent,
    });
    await popup.render();

    const libDir = await fs.getFiles(FILES_DIRECTORY_RECIPES);
    const products = libDir.files
      .filter((file) => file.includes('.lpproj'))
      .map((file) => file.replace(/\.[^/.]+$/, ''));

    // Create dropdown menu
    const prodSelector = new FPComponents.Dropdown_A();
    prodSelector.model = { items: products };
    // Create update button
    const updateBtn = new FPComponents.Button_A();
    updateBtn.text = l.trans('prod.select_popup')[2];
    updateBtn.highlight = true;
    // Event listeners
    updateBtn.onclick = () => {
      this.updateAndClose(prodSelector, popup);
    };
    prodSelector.onselection = () => {
      popup.find('.dropdown-label').remove();
      prodSelector.onselection = null;
    };

    // Attach the dropdown menu and update button to the popup
    prodSelector.attachToElement(popup.find('.dropdown'));
    updateBtn.attachToElement(popup.find('.popup-footer'));
  }

  /**
   * Set the start layer and cycle in the RAPID code
   * @alias setBoxStart
   * @memberof Production
   * @param {number} layer - The layer number
   * @param {number} cycle - The cycle number
   */
  setBoxStart(layer, cycle, index) {
    RWS.Rapid.setDataValue('T_ROB1', 'Init', `StartLayer{${index}}`, layer);
    RWS.Rapid.setDataValue('T_ROB1', 'Init', `StartCycle{${index}}`, cycle);
  }

  /**
   * Create the start popup with the layer and box input fields
   * @alias createStartPopup
   * @memberof Production
   */
  async createStartPopup() {
    const bodyContent = `
    <div class="input-cont">
      <div class="flex mb-3 items-center tc-space">
        <span class="input-label">${l.trans('prod.start_popup')[1]}:</span>
        <div class="pall-select"></div>
      </div>
      <div class="flex mb-3 items-center tc-space">
        <span class="input-label">${l.trans('prod.start_popup')[2]}:</span>
        <div class="layer-input"></div>
      </div>
      <div class="flex items-center tc-space">
        <span class="input-label">${l.trans('prod.start_popup')[3]}:</span>
        <div class="box-input"></div>
      </div>
      <div class="patternInfo mt-4"></div>
    </div>
    `;

    const popup = new CustomPopup(document.body, {
      title: l.trans('prod.start_popup')[0],
      bodyContent: bodyContent,
    });
    await popup.render();

    const layerInput = new FPComponents.Input_A();
    layerInput.enabled = false;
    const boxInput = new FPComponents.Input_A();
    boxInput.enabled = false;
    const pallSelect = new FPComponents.Dropdown_A();

    const { value: palletCfg } = await fetchData('Settings', 'Palletize');

    let actPallets = [];
    palletCfg.forEach((status, index) => {
      if (status !== 0) {
        actPallets.push(`Pallet ${index + 1}`);
      }
    });
    pallSelect.model = { items: actPallets };

    // Get the actual recipe data
    const recipeName = this.find('.product-name').textContent;
    const actRecipe = stackData.projectProp.recipeElements.find(
      (recipe) => recipe.name === recipeName
    );

    const [
      layerCnt,
      cycleCnt,
      lowCorner,
      upCorner,
      obFeeder,
      obPallet1,
      obPallet2,
      obPallet3,
      obPallet4,
    ] = await Promise.all([
      fetchData('Init', 'LayerCnt').then((res) => res.value),
      fetchData('Init', 'CycleCnt').then((res) => res.value),
      fetchData('Settings', 'CORNER_LOWER_LAYERS').then((res) => res.value),
      fetchData('Settings', 'CORNER_UPPER_LAYERS').then((res) => res.value),
      fetchData('Settings', 'obFeeder1').then((res) => res.value),
      fetchData('Settings', 'obPallet1').then((res) => res.value),
      fetchData('Settings', 'obPallet2').then((res) => res.value),
      fetchData('Settings', 'obPallet3').then((res) => res.value),
      fetchData('Settings', 'obPallet4').then((res) => res.value),
    ]);
    const maxLayer = parseInt(actRecipe.stack.layerNr);
    const obPallet = [obPallet1, obPallet2, obPallet3, obPallet4];
    const patterns = actRecipe.pattern.indexes;

    const calcPattData = (layer, startCorner) => {
      const patternIndex =
        layer === maxLayer && patterns.length === 3
          ? 2
          : layer % 2 === 0
          ? 1
          : 0;
      const maxBox = actRecipe.stack.boxParents[patternIndex][
        startCorner
      ].filter((v) => v === 0).length;
      return { patternIndex, maxBox };
    };

    const getStartCorner = () => {
      const boxHeight = parseInt(actRecipe.box.height);
      const palletIndex = pallSelect.selected;
      const layer = parseInt(layerInput.text);
      const absPalletHeight =
        parseInt(actRecipe.pallet.height) +
        layer * boxHeight +
        obPallet[palletIndex].uframe.trans.z +
        obPallet[palletIndex].oframe.trans.z;
      const absFeederHeight =
        obFeeder.uframe.trans.z + obFeeder.oframe.trans.z + boxHeight;
      const startCorner =
        absPalletHeight > absFeederHeight + boxHeight ? upCorner : lowCorner;
      return startCorner;
    };

    const drawPattern = (layer, palletIndex) => {
      stackData.pItems[3] = [];

      const startCorner = getStartCorner()[palletIndex];
      const { patternIndex } = calcPattData(layer, startCorner);

      const boxFormulas = actRecipe.stack.formulas[patternIndex][startCorner];
      const boxParents = actRecipe.stack.boxParents[patternIndex][startCorner];

      for (let i = 0; i < boxFormulas.length; i++) {
        stackData.pItems[3].push(
          new patternItemProperties(
            i,
            boxFormulas[i],
            actRecipe.box.lslCnt,
            actRecipe.box.sslCnt
          )
        );
      }
      stackData.patternCreation.calcPattern(3);
      // Draw the pallet with actual pattern
      const pallet = drawPalletWithBoxes(
        popup.find('.patternInfo'),
        3,
        stackData,
        stackData.palletProp.length,
        stackData.palletProp.width,
        null,
        true,
        boxParents
      );
    };

    pallSelect.onselection = async (index) => {
      const layerVal = parseInt(layerCnt[index]);
      const boxVal = parseInt(cycleCnt[index]);

      const startCorner = getStartCorner()[index];
      const { maxBox } = calcPattData(layerVal, startCorner);

      layerInput.text = layerVal;
      boxInput.text = boxVal;
      layerInput.enabled = true;
      boxInput.enabled = true;

      layerInput.regex = intRegex;
      layerInput.validator = (value) =>
        checkInputRange(value, 1, actRecipe.stack.layerNr);
      layerInput.label = l.trans('com.val_ch', {
        var1: 1,
        var2: maxLayer,
      });
      boxInput.regex = intRegex;
      boxInput.validator = (value) => checkInputRange(value, 1, maxBox);
      boxInput.label = l.trans('com.val_ch', { var1: 1, var2: maxBox });

      stackData.palletProp.length = parseInt(actRecipe.pallet.length);
      stackData.palletProp.width = parseInt(actRecipe.pallet.width);
      stackData.boxProp.length = parseInt(actRecipe.box.length);
      stackData.boxProp.width = parseInt(actRecipe.box.width);

      drawPattern(layerVal, index);
    };

    layerInput.onchange = (value) => {
      const startCorner = getStartCorner()[pallSelect.selected];
      const { maxBox } = calcPattData(value, startCorner);

      boxInput.validator = (value) => checkInputRange(value, 1, maxBox);
      boxInput.label = l.trans('com.val_ch', { var1: 1, var2: maxBox });
      drawPattern(parseInt(value), pallSelect.selected);
    };

    const startBtn = new FPComponents.Button_A();
    startBtn.text = 'Start';
    startBtn.highlight = true;
    startBtn.onclick = async () => {
      this.setBoxStart(
        parseInt(layerInput.text),
        parseInt(boxInput.text),
        pallSelect.selected + 1
      );
      await this.startMain();
      popup.destroy();
    };

    pallSelect.attachToElement(popup.find('.pall-select'));
    layerInput.attachToElement(popup.find('.layer-input'));
    boxInput.attachToElement(popup.find('.box-input'));
    startBtn.attachToElement(popup.find('.popup-footer'));
  }

  /**
   * Start the palletzing cycle from beginning or from a specific box
   * @alias startCycle
   * @memberof Production
   * @returns {Promise}
   */
  async startCycle() {
    const startDropdown = this.child.startDropdownBtn;

    const setBoxStartAndStartMain = async (workrangeCheckMode) => {
      for (let i = 0; i < 4; i++) {
        this.setBoxStart(1, 1, i + 1);
      }
      this.startMain(workrangeCheckMode);
    };

    try {
      switch (startDropdown.selected) {
        case startDropdown.items[0]:
          await setBoxStartAndStartMain(false);
          break;
        case startDropdown.items[1]:
          this.createStartPopup();
          break;
        case startDropdown.items[2]:
          await setBoxStartAndStartMain(true);
          break;
        default:
          break;
      }
    } catch (e) {
      TComponents.Popup_A.error(e);
    }
  }

  /**
   * Start the execution of the main program (Turn on the motors, set the PP to main, start the execution)
   * @alias startMain
   * @memberof Production
   * @returns {Promise}
   */
  async startMain(workrangeCheckMode = false) {
    await RWS.Rapid.setDataValue(
      'T_ROB1',
      'AppData',
      'WorkrangeCheckMode',
      workrangeCheckMode
    );
    // Set the command to none
    await RWS.Rapid.setDataValue('T_ROB1', 'AppData', 'AppCommand', cmd.none);
    // Set the Program Pointer to main
    await RWS.Rapid.resetPP();
    // Turn the motors on
    await RWS.Controller.setMotorsState('motors_on');
    // Start the execution of the program
    this.executeProgram();
  }

  /**
   * Start the execution of the main program with the desired features
   * @alias executeProgram
   * @memberof Production
   * @returns {Promise}
   */
  executeProgram() {
    try {
      RWS.Rapid.startExecution({
        regainMode: 'continue',
        executionMode: 'continue',
        cycleMode: 'as_is',
        condition: 'none',
        stopAtBreakpoint: false,
        enableByTSP: true,
      });
    } catch (e) {
      TComponents.Popup_A.error(e);
    }
  }

  /**
   * Resume the palletizing depending on the user selection
   * @alias resumePalletizing
   * @memberof Production
   */
  async resumePalletizing() {
    const resumeDropdown = this.child.resumeDropdownBtn;
    //Resume palletizing in different ways
    switch (resumeDropdown.selected) {
      case resumeDropdown.items[0]:
        this.executeProgram();
        break;
      case resumeDropdown.items[1]:
        await RWS.Rapid.setDataValue(
          'T_ROB1',
          'AppData',
          'AppCommand',
          cmd.homeRun
        );
        this.executeProgram();
        break;
      default:
        break;
    }
  }

  /**
   * Stop the execution of palletizing depending on the user selection
   * @alias stopPalletizing
   * @memberof Production
   * @returns {Promise}
   */
  async stopPalletizing() {
    const stopDropdown = this.child.stopDropdownBtn;
    // Stop palletizing in different ways
    switch (stopDropdown.selected) {
      case stopDropdown.items[0]:
        // Stop the execution of the program immadiately
        RWS.Rapid.stopExecution();
        break;
      case stopDropdown.items[1]:
        // Stop the execution after box cycle
        RWS.Rapid.setDataValue(
          'T_ROB1',
          'AppData',
          'AppCommand',
          cmd.stopEndCycle
        );
        break;
      case stopDropdown.items[2]:
        // Stop the execution after pallet cycle
        RWS.Rapid.setDataValue(
          'T_ROB1',
          'AppData',
          'AppCommand',
          cmd.stopEndPallet
        );
        break;
      default:
        break;
    }
  }

  /**
   * Update the data in the layout
   * @alias updateData
   * @memberof Production
   * @param {string} moduleName - The name of the module
   * @param {string} varName - The name of the variable
   * @param {string} elementName - The name of the HTML element in the layout
   * @returns {Promise}
   */
  async updateData(moduleName, varName, elementName) {
    try {
      const { dataPromise, value } = await fetchData(moduleName, varName);
      this.find(elementName).textContent = value;

      dataPromise.addCallbackOnChanged(async () => {
        const element = await dataPromise.getValue();
        this.find(elementName).textContent = element;
      });
      await dataPromise.subscribe();
    } catch (e) {
      TComponents.Popup_A.error(e);
    }
  }

  /**
   * Get the simple data type and set the value to the HTML element in the layout
   * @alias getSimpleData
   * @memberof Production
   * @param {string} moduleName - The name of the module
   * @param {string} varName - The name of the variable
   * @param {string} elementName - The name of the HTML element in the layout
   */
  async getSimpleData(moduleName, varName, elementName) {
    try {
      const { value } = await fetchData(moduleName, varName);
      this.find(elementName).textContent = value;
    } catch (e) {
      TComponents.Popup_A.error(e);
    }
  }

  /**
   * Get the record data type and set the value to the HTML element in the layout
   * @alias getRecordData
   * @memberof Production
   * @param {string} moduleName - The name of the module
   * @param {string} varName - The name of the variable
   * @param {string} property - The name of the property in the record
   * @param {string} elementName - The name of the HTML element in the layout
   * @returns {Promise}
   */
  async getRecordData(moduleName, varName, property, elementName) {
    try {
      const { value } = await fetchData(moduleName, varName);
      this.find(elementName).textContent = value[property];
    } catch (e) {
      TComponents.Popup_A.error(e);
    }
  }

  /**
   * Generates the HTML definition corresponding to the component.
   * html elements for different components in the layout
   * @alias markup
   * @memberof Production
   * @returns {string}
   */
  markup() {
    return /*html*/ `
        <div id="production-subview">
          <div class="flex">
            <div class="flex-07">
              <div class="my-3">
                <div class="product"></div>
                <div class="product-content pl-2 pr-2">
                  <div class="flex my-1 tc-space items-baseline">
                    <div class="product-name"></div>
                    <div class="product-change pr-2">
                      ${l.trans('prod.chProd')}
                    </div>
                    <div class="abort-button"></div>
                  </div>
                </div>
              </div>
              <div class="mb-3">
                <div class="actions"></div>
                <div class="start-button my-1"></div>
                <div class="stop-button my-1"></div>
                <div class="res-button my-1"></div>
              </div>
              <div class="status"></div>
              <div class="status-content pl-2 pr-2">
                <div class="flex my-4 tc-space">
                  <div class="flex items-center">
                    <div class="pall-title">Pallet 1</div>
                    <div class="pall1-status ml-2"></div>
                  </div>
                  <div class="flex items-center">
                    <div class="pall-title">Pallet 2</div>
                    <div class="pall2-status ml-2"></div>
                  </div>
                </div>
                <div class="flex my-4 tc-space">
                  <div class="flex items-center">
                    <div class="pall-title">Pallet 3</div>
                    <div class="pall3-status ml-2"></div>
                  </div>
                  <div class="flex items-center">
                    <div class="pall-title">Pallet 4</div>
                    <div class="pall4-status ml-2"></div>
                  </div>
                </div>
                <div class="flex-row items-center pl-2 test1">
                  <img src="${infoIconB}" class="info-iconb mr-2" />
                  <div class="info-desc">
                    ${l.trans('prod.status_info')}
                  </div>
                </div>
              </div>
            </div>
            <div class="flex-1 wh-cont">
              <div class="mt-2 pl-3">
                ${l.trans('prod.layName')}: 
                <span class="layer-name"></span></div>
              <div class="palletStatus mt-2">
                <canvas width="450px" height="300px"></canvas>
              </div>
              <div class="pl-8 pr-4">
                <div class="flex tc-space mt-3">
                  <div>
                    ${l.trans('prod.totalB')}
                    <span class="current-box"></span>/<span class="box-cnt"></span>
                  </div>
                  <div>
                    ${l.trans('prod.currL')}
                    <span class="current-layer"></span>/<span class="layer-cnt"></span>
                  </div>
                </div>
                <div class="proc-cont">
                  <div class="proc-disp">
                    <span class="proc-perc"></span> % ${l.trans('prod.rem')}
                  </div>
                </div>
                <div class="flex items-center mt-6 mb-3">
                  <div> ${l.trans('prod.proc')}</div>
                  <div class="progbar-cont mt-1 ml-2">
                    <div class="progbar"></div>
                  </div>
                </div>
                <div class="station-info disp-none"></div>
                <div class="info-box cancel disp-none mb-2">
                  <div class="flex">
                    <img src="${infoIcon}" class="info-icon" />
                    <div class="info-title">
                      ${l.trans('prod.stop_info')[0]}
                    </div>
                  </div>
                  <div class="info-desc pl-8 my-1 flex-row tc-space">
                    <span>${l.trans('prod.stop_info')[1]}</span>
                    <div class="cancel-button"></div>
                  </div>
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
 * @memberof Production
 */
Production.loadCssClassFromString(/*css*/ `
  .product-change{
    text-decoration: underline;
    color: grey;
  }
  .station-info{
    background-color: #FFF3CD;
    border: 1px solid #FFC107;
    border-radius: 8px;
    padding: 0.25rem 1rem;
  }
  .dropdown .fp-components-dropdown-container {
    width: 460px;
  }
  .close-button {
    font-size: 2rem;
    cursor: pointer;
    font-weight: bolder;
  }
  .dropdown-label{
    position: absolute;
    top: 24px;
    left: 24px;
    color: var(--fp-color-GRAY-40, #9F9F9F);
  }
  .wh-cont{
    margin: 0.75rem 0.5rem 0 0.5rem;
    background-color: #fff;
    border-radius: 10px;
  }
  #production-subview .fp-components-button-icon{
    background-size: auto;
  }
  #production-subview .fp-components-button-text{
    flex: none;
  }
  .palletStatus{
    width: 560px;
    display: flex;
    justify-content: center;
  }
  .status-content .fp-components-button {
    width: 81px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid var(--status-warning, #FFA200);
    background: var(--status-warning-bg, #FEF9EF);
    color: #1F1F1F;
  }
  .status-content .fp-components-button-disabled{
    width: 81px;
    height: 32px;
    border-radius: 8px;
    border: 2px solid var(--border-secondary-disabled, rgba(0, 0, 0, 0.12));
    background: var(--background-disabled, #EBEBEB);
  }
  .info-iconb{
    width: 20px;
    height: 20px;
  }
  .progbar-cont {
    background-color: var(--t-color-GRAY-20);
    border-radius: 8px;
    width: 360px;
    height: 8px;
  }
  .progbar {
    width: 0%;
    height: 8px;
    background-color: #000;
    border-radius: 8px;
  }
  .proc-cont {
    position: absolute;
  }
  .proc-disp {
    position: relative;
    left: 395px;
    top: 8px;
    font-size: 16px;
  }
  .layer-input, .box-input , .pall-select{
    width: 100px;
  }
  .input-label{
    font-size: 16px;
    margin-right: 16px;
  }
`);
