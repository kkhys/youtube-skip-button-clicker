import { setupCounter } from "./counter";
import "./style.css";

const appElement = document.querySelector("#app");
if (appElement) {
  appElement.innerHTML = `
    <div>
      <h1>Hello CRXJS!</h1>
      <div class="card">
        <button id="counter" type="button"></button>
      </div>
      <p class="read-the-docs">
        Click on the CRXJS logo to learn more
      </p>
    </div>
  `;

  const counterElement = document.querySelector(
    "#counter",
  ) as HTMLButtonElement;
  if (counterElement) {
    setupCounter(counterElement);
  } else {
    console.error("Counter button element not found");
  }
} else {
  console.error("App element not found");
}
