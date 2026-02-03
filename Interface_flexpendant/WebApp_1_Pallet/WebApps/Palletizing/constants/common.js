const version = 'v1.1.0-RC1';
const setupFile = 'setup.json';
const palletizingFilesPath = `$HOME/Palletizing_files`;
const linkTypes = {
  noLink: 0,
  longSideLink: 1,
  shortSideLink: 2,
};
const gripperTypes = {
  grpNone: 0,
  grpVacuumCenter: 1,
  grpVacuumCorner: 2,
  grpMechTCPSideCenterBottom: 3,
  grpMechTCPSideCornerBottom: 4,
  grpMechOppSideCenterBottom: 5,
  grpMechOppSideCornerBottom: 6,
  grpMechTCPSideCenterTop: 7,
  grpMechTCPSideCornerTop: 8,
  grpMechOppSideCenterTop: 9,
  grpMechOppSideCornerTop: 10,
  grpMechCenterTop: 11,
};
const layerTypes = {
  pallet: 1,
  pattern: 2,
  slipSheet: 3,
  oddLayer: 0,
  evenLayer: 1,
  topLayer: 2,
};
const DPI = window.devicePixelRatio;
const palletColor = '#A3866A';
const boxColor = '#BD9168';
const boxBorder = '#796046';
const labelColor = '#FFFFFF';
const labelBorder = '#7E878E';
const boxCollBorder = '#F44336';
const boxCollColor = '#F8E6E6';
const boxSelBorder = 'blue';
const boxSelColor = '#C2E1F6';
const boxSelnCollColor = '#DDE4EE';
const boxPlacingBorder = '#997A00';
const boxPlacingColor = '#FFCC00';
const boxPlacedBorder = '#004D1A';
const boxPlacedColor = '#00B33C';
const boxLostColor = '#FF0000';
const boxLostBorder = '#CC0000';
const palletTypes = [
  { length: 1200, width: 800, selected: 0, name: 'EUR1' },
  { length: 1200, width: 1000, selected: 1, name: 'EUR2 , UK' },
  { length: 800, width: 600, selected: 2, name: 'EUR6' },
  { length: 1100, width: 1100, selected: 3, name: 'Asia' },
  { length: 1219, width: 1016, selected: 4, name: 'US1' },
  { length: 1067, width: 1067, selected: 5, name: 'US2' },
  { length: 1219, width: 1219, selected: 6, name: 'US3' },
  { length: 1165, width: 1165, selected: 7, name: 'AU' },
  { length: 500, width: 500, selected: 8, name: 'Custom' },
];
const floatRegex = /^-?[0-9]+(\.[0-9]+)?$/;
const intRegex = /^-?[0-9]+$/;
const checkInputRange = (value, min, max) => {
  return parseFloat(value) <= max && parseFloat(value) >= min ? true : false;
};
const argRange = {
  boxLength: { min: 100, max: 2000 },
  boxWidth: { min: 100, max: 2000 },
  boxHeight: { min: 10, max: 1000 },
  boxWeight: { min: 0.1, max: 100 },
  palletLength: { min: 400, max: 2000 },
  palletWidth: { min: 400, max: 2000 },
  palletHeight: { min: 10, max: 400 },
  layerNo: { min: 1, max: 100 },
  stackHeight: { min: 10, max: 10000 },
  slStackHeight: { min: 10, max: 2000 },
  slipSThickness: { min: 0.1, max: 100 },
  acc: { min: 0, max: 100 },
  time: { min: 0, max: 20 },
  tune_range: [-20, 20],
};
const cmd = {
  none: 0,
  stopEndCycle: 1,
  stopEndPallet: 2,
  stopCancel: 3,
  homeRun: 4,
};

const statusProduction = {
  running: 3,
  homeRun: 4,
  endHome: 5,
  endCycle: 6,
  endPallet: 9,
};

export {
  linkTypes,
  gripperTypes,
  layerTypes,
  DPI,
  palletColor,
  boxColor,
  boxBorder,
  labelColor,
  labelBorder,
  boxCollBorder,
  boxCollColor,
  boxSelBorder,
  boxSelColor,
  boxSelnCollColor,
  boxPlacedBorder,
  boxPlacedColor,
  boxPlacingBorder,
  boxPlacingColor,
  boxLostColor,
  boxLostBorder,
  palletTypes,
  floatRegex,
  intRegex,
  checkInputRange,
  argRange,
  cmd,
  statusProduction,
  version,
  setupFile,
  palletizingFilesPath,
};
