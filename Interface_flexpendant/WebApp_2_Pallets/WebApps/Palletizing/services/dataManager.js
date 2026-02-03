const taskName = 'T_ROB1';

export async function fetchData(moduleName, varName) {
  const dataPromise = await RWS.Rapid.getData(taskName, moduleName, varName);
  const value = await dataPromise.getValue();
  return { dataPromise, value };
}
