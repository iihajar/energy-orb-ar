import {
  FilesetResolver,
  HandLandmarker
} from "@mediapipe/tasks-vision";
import { detectGesture } from "./gestures";
import { updateEnergyOrb, drawEnergyOrb } from "./energy-orb";

let handLandmarker = null;
let lastVideoTime = -1;

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17]
];

export async function createHandTracker() {
  if (handLandmarker) {
    return handLandmarker;
  }

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
  );

  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"
    },
    runningMode: "VIDEO",
    numHands: 2,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  console.log("Hand Landmarker Ready");
  return handLandmarker;
}

export function startHandTracking(videoElement, canvasElement) {
  if (!handLandmarker) {
    throw new Error("Hand Landmarker is not ready.");
  }

  const context = canvasElement.getContext("2d");

  if (!context) {
    throw new Error("Could not create canvas context.");
  }

  function detectHands() {
    if (
      videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
      videoElement.currentTime !== lastVideoTime
    ) {
      lastVideoTime = videoElement.currentTime;
      resizeCanvasToVideo(videoElement, canvasElement);

      const results = handLandmarker.detectForVideo(
        videoElement,
        performance.now()
      );

      context.clearRect(0, 0, canvasElement.width, canvasElement.height);

      processAndDrawHands(
        context,
        results.landmarks,
        canvasElement.width,
        canvasElement.height
      );
    }

    requestAnimationFrame(detectHands);
  }

  detectHands();
}

function resizeCanvasToVideo(videoElement, canvasElement) {
  if (
    canvasElement.width !== videoElement.videoWidth ||
    canvasElement.height !== videoElement.videoHeight
  ) {
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
  }
}

function processAndDrawHands(context, hands, width, height) {
  if (!hands?.length) {
    updateEnergyOrb([]);
    drawEnergyOrb(context);
    return;
  }

  const trackedHands = [];

  for (const landmarks of hands) {
    drawConnections(context, landmarks, width, height);
    drawLandmarks(context, landmarks, width, height);

    trackedHands.push({
      gesture: detectGesture(landmarks),
      palmCenter: getPalmCenter(landmarks, width, height),
      indexTip: getCanvasPoint(landmarks[8], width, height),
      wrist: getCanvasPoint(landmarks[0], width, height)
    });
  }

  updateEnergyOrb(trackedHands);
  drawEnergyOrb(context);
}

function getPalmCenter(landmarks, width, height) {
  const palmIndexes = [0, 5, 9, 13, 17];
  let totalX = 0;
  let totalY = 0;

  for (const index of palmIndexes) {
    totalX += landmarks[index].x * width;
    totalY += landmarks[index].y * height;
  }

  return {
    x: totalX / palmIndexes.length,
    y: totalY / palmIndexes.length
  };
}

function getCanvasPoint(point, width, height) {
  return {
    x: point.x * width,
    y: point.y * height
  };
}

function drawConnections(context, landmarks, width, height) {
  context.save();
  context.strokeStyle = "#ffffff";
  context.lineWidth = 3;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.shadowColor = "#ffffff";
  context.shadowBlur = 8;

  for (const [startIndex, endIndex] of HAND_CONNECTIONS) {
    const startPoint = landmarks[startIndex];
    const endPoint = landmarks[endIndex];

    if (!startPoint || !endPoint) {
      continue;
    }

    context.beginPath();
    context.moveTo(startPoint.x * width, startPoint.y * height);
    context.lineTo(endPoint.x * width, endPoint.y * height);
    context.stroke();
  }

  context.restore();
}

function drawLandmarks(context, landmarks, width, height) {
  context.save();

  for (const [index, point] of landmarks.entries()) {
    const x = point.x * width;
    const y = point.y * height;
    const isFingerTip = [4, 8, 12, 16, 20].includes(index);

    context.beginPath();
    context.arc(x, y, isFingerTip ? 7 : 5, 0, Math.PI * 2);
    context.fillStyle = isFingerTip ? "#ffffff" : "#241b53";
    context.shadowColor = isFingerTip ? "#ffffff" : "#1f1f4d";
    context.shadowBlur = isFingerTip ? 14 : 9;
    context.fill();
  }

  context.restore();
}