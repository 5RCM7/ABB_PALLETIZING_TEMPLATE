import App from './app.js';
import { l } from './services/translation.js';

window.addEventListener('load', async function () {
  try {
    const language = await API.CONTROLLER.getLanguage();
    await l.setLanguage(language);
    // Create the app and render it
    const app = new App(document.getElementById('root'));
    app.render();
  } catch (e) {
    TComponents.Popup_A.error(e);
  }
});
