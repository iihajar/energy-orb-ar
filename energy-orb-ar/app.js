import { startCamera } from "./js/camera.js";
import {
  createHandTracker,
  startHandTracking
} from "./js/hand-tracking.js";

const camera = document.getElementById("camera");
const handCanvas = document.getElementById("hand-canvas");
const startButton = document.getElementById("start-camera");
const statusText = document.getElementById("status");

startButton.addEventListener("click", async () => {
  startButton.disabled = true;
  statusText.textContent = "Starting camera...";

  try {
    await startCamera(camera);
    await createHandTracker();

    startHandTracking(camera, handCanvas);

    statusText.textContent = "Hand tracking is running";
    startButton.style.display = "none";
  } catch (error) {
    console.error(error);

    statusText.textContent = "Could not start hand tracking";
    startButton.disabled = false;
  }
});