import { drawParticleHeart } from "./particles.js";
import { Gesture } from "./gestures";

const energyState = {
  visible: false,
  x: 0,
  y: 0,
  targetX: 0,
  targetY: 0,
  distance: 0,
  openness: 0,
  targetOpenness: 0,
  rotation: 0,
  rotationVelocity: 0,
  pointerAngle: null,
  hands: [],
  firstHand: null,
  secondHand: null
};

export function updateEnergyOrb(hands = []) {
  energyState.hands = hands;
  energyState.firstHand = hands[0]?.palmCenter || null;
  energyState.secondHand = hands[1]?.palmCenter || null;

  if (hands.length === 0) {
    energyState.visible = false;
    energyState.pointerAngle = null;
    energyState.rotationVelocity *= 0.9;
    energyState.openness = lerp(energyState.openness, 0, 0.12);
    return;
  }

  energyState.visible = true;

  if (hands.length >= 2) {
    updateFromTwoHands(hands[0], hands[1]);
  } else {
    updateFromOneHand(hands[0]);
  }

  energyState.x = lerp(energyState.x, energyState.targetX, 0.3);
  energyState.y = lerp(energyState.y, energyState.targetY, 0.3);
  energyState.openness = lerp(
    energyState.openness,
    energyState.targetOpenness,
    0.18
  );

  energyState.rotationVelocity *= 0.94;
  energyState.rotation += energyState.rotationVelocity;
}

function updateFromTwoHands(firstHand, secondHand) {
  const firstPalm = firstHand.palmCenter;
  const secondPalm = secondHand.palmCenter;

  energyState.targetX = (firstPalm.x + secondPalm.x) / 2;
  energyState.targetY = (firstPalm.y + secondPalm.y) / 2;

  energyState.distance = Math.hypot(
    secondPalm.x - firstPalm.x,
    secondPalm.y - firstPalm.y
  );

  energyState.targetOpenness = clamp(
    mapRange(energyState.distance, 70, 340, 0, 1),
    0,
    1
  );

  const pointingHand = [firstHand, secondHand]
    .find((hand) => hand.gesture === Gesture.POINT);

  updateFingerRotation(pointingHand);
}

function updateFromOneHand(hand) {
  const palm = hand.palmCenter;

  if (energyState.x === 0 && energyState.y === 0) {
    energyState.x = palm.x;
    energyState.y = palm.y;
  }

  energyState.targetX = palm.x;
  energyState.targetY = palm.y;

  if (hand.gesture === Gesture.OPEN_PALM) {
    energyState.targetOpenness = 1;
  } else if (
    hand.gesture === Gesture.FIST ||
    hand.gesture === Gesture.PINCH
  ) {
    energyState.targetOpenness = 0;
  }

  updateFingerRotation(
    hand.gesture === Gesture.POINT ? hand : null
  );
}

function updateFingerRotation(pointingHand) {
  if (!pointingHand?.indexTip) {
    energyState.pointerAngle = null;
    return;
  }

  const dx = pointingHand.indexTip.x - energyState.x;
  const dy = pointingHand.indexTip.y - energyState.y;
  const radius = Math.hypot(dx, dy);

  if (radius < 35) {
    energyState.pointerAngle = null;
    return;
  }

  const currentAngle = Math.atan2(dy, dx);

  if (energyState.pointerAngle !== null) {
    const delta = normalizeAngle(currentAngle - energyState.pointerAngle);

    if (Math.abs(delta) < 0.75) {
      energyState.rotationVelocity = lerp(
        energyState.rotationVelocity,
        delta * 0.9,
        0.45
      );
    }
  }

  energyState.pointerAngle = currentAngle;
}

export function drawEnergyOrb(context) {
  if (!context) {
    return;
  }

  drawParticleHeart(context, energyState);
}

export function getEnergyState() {
  return energyState;
}

function normalizeAngle(angle) {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function mapRange(value, inputMin, inputMax, outputMin, outputMax) {
  return outputMin +
    ((value - inputMin) / (inputMax - inputMin)) *
    (outputMax - outputMin);
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}