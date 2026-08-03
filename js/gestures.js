export const Gesture = Object.freeze({
  NONE: "NONE",
  OPEN_PALM: "OPEN_PALM",
  FIST: "FIST",
  PINCH: "PINCH",
  POINT: "POINT"
});

export function detectGesture(landmarks) {
  if (!landmarks || landmarks.length !== 21) {
    return Gesture.NONE;
  }

  const indexOpen = isFingerExtended(landmarks, 8, 6);
  const middleOpen = isFingerExtended(landmarks, 12, 10);
  const ringOpen = isFingerExtended(landmarks, 16, 14);
  const pinkyOpen = isFingerExtended(landmarks, 20, 18);

  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const pinchDistance = distance3D(thumbTip, indexTip);

  if (pinchDistance < 0.055) {
    return Gesture.PINCH;
  }

  if (indexOpen && !middleOpen && !ringOpen && !pinkyOpen) {
    return Gesture.POINT;
  }

  const extendedCount = [indexOpen, middleOpen, ringOpen, pinkyOpen]
    .filter(Boolean).length;

  if (extendedCount >= 3) {
    return Gesture.OPEN_PALM;
  }

  if (extendedCount === 0) {
    return Gesture.FIST;
  }

  return Gesture.NONE;
}

function isFingerExtended(landmarks, tipIndex, pipIndex) {
  const wrist = landmarks[0];
  const tip = landmarks[tipIndex];
  const pip = landmarks[pipIndex];

  const tipDistance = distance3D(tip, wrist);
  const pipDistance = distance3D(pip, wrist);

  return tipDistance > pipDistance * 1.16;
}

function distance3D(firstPoint, secondPoint) {
  return Math.hypot(
    firstPoint.x - secondPoint.x,
    firstPoint.y - secondPoint.y,
    (firstPoint.z || 0) - (secondPoint.z || 0)
  );
}