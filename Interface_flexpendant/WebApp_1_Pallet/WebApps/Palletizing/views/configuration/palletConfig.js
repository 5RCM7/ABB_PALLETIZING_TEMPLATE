import { imgPallet } from '../../constants/images.js';
import {
  palletTypes,
  floatRegex,
  checkInputRange,
  argRange,
} from '../../constants/common.js';
import { l } from '../../services/translation.js';

/**
 * @class PalletConfig
 * @classdesc This class is responsible for rendering the pallet configuration subview
 * @extends TComponents.Component_A
 * @memberof MultiStep
 * @param {HTMLElement} parent - The parent element to which the view will be rendered
 * @param {Object} props - The properties object to be passed to the view
 */
export default class PalletConfig extends TComponents.Component_A {
  constructor(parent, props = {}) {
    super(parent, props);
  }

  /**
   * Instantiation of Conveyor sub-components that shall be initialized in a synchronous way.
   * All this components are then accessible within {@link onRender() onRender} method by using this.child.<component-instance>
   * Create elements for pallet setup.
   * @alias mapComponents
   * @memberof PalletConfig
   * @returns {object} Contains all child PalletConfig instances used within the component.
   */
  mapComponents() {
    // Create 2 Infobox in the Layout
    const palletTypeInfobox = new TComponents.LayoutInfobox_A(
      this.find('.pallet-type'),
      {
        title: l.trans('pallconf.type'),
        content: { children: this.find('.pallet-type-content') },
      }
    );
    const palletDimInfobox = new TComponents.LayoutInfobox_A(
      this.find('.pallet-dim'),
      {
        title: l.trans('com.dim'),
        content: { children: [this.find('.pallet-dim-content')] },
      }
    );
    // Create inputtboxes
    const { palletLength, palletWidth, palletHeight } = argRange;
    const lengthInput = new TComponents.Input_A(this.find('.pallet-length'), {
      text: '0',
      description: l.trans('com.val_ch', {
        var1: palletLength.min,
        var2: palletLength.max,
      }),
    });
    lengthInput.regex = floatRegex;
    lengthInput.validator = (value) =>
      checkInputRange(value, palletLength.min, palletLength.max);
    const widthInput = new TComponents.Input_A(this.find('.pallet-width'), {
      text: '0',
      description: l.trans('com.val_ch', {
        var1: palletWidth.min,
        var2: palletWidth.max,
      }),
    });
    widthInput.regex = floatRegex;
    widthInput.validator = (value) =>
      checkInputRange(value, palletWidth.min, palletWidth.max);
    const heightInput = new TComponents.Input_A(this.find('.pallet-height'), {
      text: '0',
      description: l.trans('com.val_ch', {
        var1: palletHeight.min,
        var2: palletHeight.max,
      }),
    });
    heightInput.regex = floatRegex;
    heightInput.validator = (value) =>
      checkInputRange(value, palletHeight.min, palletHeight.max);
    // Create dropdownbox
    const typeDropdown = new TComponents.Dropdown_A(
      this.find('.pallet-selector'),
      {
        itemList: palletTypes.map((pallet) => pallet.name),
      }
    );
    typeDropdown.onSelection(this.typeOnSelection.bind(this));
    return {
      palletTypeInfobox,
      palletDimInfobox,
      lengthInput,
      widthInput,
      heightInput,
      typeDropdown,
    };
  }

  /**
   * Callback function for the dropdown menu. Change pallet dimensions according to the selected pallet type.
   * @alias typeOnSelection
   * @memberof PalletConfig
   */
  typeOnSelection() {
    const selectedIndex = this.child.typeDropdown.items.indexOf(
      this.child.typeDropdown.selected
    );

    this.child.lengthInput.text = palletTypes[selectedIndex].length;
    this.child.widthInput.text = palletTypes[selectedIndex].width;
  }

  /**
   * Generates the HTML definition corresponding to the component.
   * html elements for different components in the layout
   * @alias markup
   * @memberof PalletConfig
   * @returns {string}
   */
  markup() {
    return /*html*/ `
        <div id="pallet-subview">
          <div class="flex-row">
            <div class="flex-07">
              <div class="my-3">
                <div class="pallet-type"></div>
                <div class="pallet-type-content pl-2 pr-2">
                  <div class="pallet-selector my-3"></div>
                </div>
              </div>
              <div>
                <div class="pallet-dim"></div>
                <div class="pallet-dim-content pl-2 pr-2">
                  <div class="flex-row tc-space my-3 items-center">
                    <div>${l.trans('com.l')} L (mm)</div>
                    <div class="pallet-length"></div>
                  </div>
                  <div class="flex-row tc-space my-3 items-center">
                    <div>${l.trans('com.w')} W (mm)</div>
                    <div class="pallet-width"></div>
                  </div>
                  <div class="flex-row tc-space my-3 items-center">
                    <div>${l.trans('com.h')} H (mm)</div>
                    <div class="pallet-height"></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="flex-1 flex wh-cont justify-center items-center">
              <img src="${imgPallet}" class="pallet-img" />
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
 * @memberof PalletConfig
 */
PalletConfig.loadCssClassFromString(/*css*/ `
  .pallet-img {
    width: 350px;
    height: auto;
  }
  #pallet-subview .fp-components-input{
    width: 100px;
  }
`);
