const MAX_PARTICLE_COUNT = 9000;
const MIN_PARTICLE_COUNT = 3500;
const FPS_SAMPLE_FRAMES = 45;

const particles = [];
const sprites = [];

let initialized = false;
let activeParticleCount = MAX_PARTICLE_COUNT;
let time = 0;
let lastFrameTime = performance.now();
let sampledFrames = 0;
let sampledTime = 0;

export function drawParticleHeart(context, energyState) {
  if (!energyState.visible) {
    return;
  }

  if (!initialized) {
    initializeEffect();
    initialized = true;
  }

  const now = performance.now();
  const elapsedMs = Math.max(now - lastFrameTime, 0.1);
  const deltaTime = Math.min(elapsedMs / 16.667, 2.2);
  lastFrameTime = now;
  time += 0.032 * deltaTime;

  updateAdaptiveParticleCount(elapsedMs);

  context.save();
  context.globalCompositeOperation = "lighter";

  drawAtmosphere(context, energyState);
  drawRotatingRings(context, energyState);

  for (let index = 0; index < activeParticleCount; index++) {
    const particle = particles[index];
    updateParticle(particle, energyState, deltaTime);
    drawParticle(context, particle, energyState);
  }

  drawHeartCore(context, energyState);
  context.restore();
}

function initializeEffect() {
  particles.length = 0;
  createParticleSprites();

  for (let index = 0; index < MAX_PARTICLE_COUNT; index++) {
    const heart = createHeartPosition();
    const cloud = createCloudPosition();

    particles.push({
      heartX: heart.x,
      heartY: heart.y,
      cloudX: cloud.x,
      cloudY: cloud.y,
      x: heart.x,
      y: heart.y,
      phase: Math.random() * Math.PI * 2,
      speed: randomBetween(0.055, 0.14),
      size: randomBetween(0.55, 1.65),
      brightness: randomBetween(0.45, 1),
      spriteIndex: Math.floor(Math.random() * sprites.length)
    });
  }
}

function createParticleSprites() {
  sprites.length = 0;

 const styles = [
  [255, 255, 255], // أبيض
  [29, 78, 216],   // #1D4ED8
  [34, 74, 160],   // #224aa0
  [30, 64, 175]    // #1e3b9a
];

  for (const [red, green, blue] of styles) {
    const canvas = document.createElement("canvas");
    canvas.width = 24;
    canvas.height = 24;
    const spriteContext = canvas.getContext("2d");

    const gradient = spriteContext.createRadialGradient(12, 12, 0, 12, 12, 12);
    gradient.addColorStop(0, `rgba(255,255,255,1)`);
    gradient.addColorStop(0.18, `rgba(37,99,235,0.95)`);
    gradient.addColorStop(0.48, `rgba(59,130,246,0.35)`);
    gradient.addColorStop(1, `rgba(13,27,76,0)`);

    spriteContext.fillStyle = gradient;
    spriteContext.fillRect(0, 0, 24, 24);
    sprites.push(canvas);
  }
}

function createHeartPosition() {
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.sqrt(Math.random());

  const baseX = 16 * Math.pow(Math.sin(angle), 3);
  const baseY =
    13 * Math.cos(angle) -
    5 * Math.cos(2 * angle) -
    2 * Math.cos(3 * angle) -
    Math.cos(4 * angle);

  const scale = 6.2 * radius;

  return {
    x: baseX * scale + randomBetween(-2.2, 2.2),
    y: -baseY * scale + randomBetween(-2.2, 2.2)
  };
}

function createCloudPosition() {
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.pow(Math.random(), 0.58) * randomBetween(125, 275);
  const ovalScale = randomBetween(0.72, 1.08);

  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius * ovalScale
  };
}

function updateParticle(particle, energyState, deltaTime) {
  const openness = smootherStep(energyState.openness);
  const heartPulse = 1 + Math.sin(time * 4.8 + particle.phase) * 0.035;

  const heartPoint = rotatePoint(
    particle.heartX * heartPulse,
    particle.heartY * heartPulse,
    energyState.rotation * 0.18
  );

  const cloudPoint = rotatePoint(
    particle.cloudX,
    particle.cloudY,
    energyState.rotation
  );

  let targetX = lerp(heartPoint.x, cloudPoint.x, openness);
  let targetY = lerp(heartPoint.y, cloudPoint.y, openness);

  const turbulence = 0.3 + openness * 5.8;
  targetX += Math.sin(time * 5.2 + particle.phase + particle.y * 0.012) * turbulence;
  targetY += Math.cos(time * 4.6 + particle.phase + particle.x * 0.011) * turbulence;

  const burst = Math.sin(openness * Math.PI) * 22;
  const distance = Math.hypot(targetX, targetY) || 1;
  targetX += (targetX / distance) * burst;
  targetY += (targetY / distance) * burst;

  const smoothing = 1 - Math.pow(1 - particle.speed, deltaTime);
  particle.x = lerp(particle.x, targetX, smoothing);
  particle.y = lerp(particle.y, targetY, smoothing);
}

function drawParticle(context, particle, energyState) {
  const pulse = 0.75 + Math.sin(time * 7 + particle.phase) * 0.25;
  const size = particle.size * pulse * (1 + energyState.openness * 0.35);
  const diameter = Math.max(2.5, size * 7.5);
  const alpha = particle.brightness * (0.55 + pulse * 0.45);

  context.globalAlpha = alpha;
  context.drawImage(
    sprites[particle.spriteIndex],
    energyState.x + particle.x - diameter / 2,
    energyState.y + particle.y - diameter / 2,
    diameter,
    diameter
  );
}

function drawAtmosphere(context, energyState) {
  const radius = lerp(85, 285, energyState.openness);
  const pulse = 1 + Math.sin(time * 2) * 0.04;

  const gradient = context.createRadialGradient(
    energyState.x,
    energyState.y,
    4,
    energyState.x,
    energyState.y,
    radius * pulse
  );

  gradient.addColorStop(0, "rgba(255,255,255,0.20)");
  gradient.addColorStop(0.14, "rgba(100,235,255,0.14)");
  gradient.addColorStop(0.48, "rgba(0,170,255,0.07)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");

  context.globalAlpha = 1;
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(energyState.x, energyState.y, radius * pulse, 0, Math.PI * 2);
  context.fill();
}

function drawRotatingRings(context, energyState) {
  context.save();
  context.translate(energyState.x, energyState.y);
  context.rotate(energyState.rotation);
  context.globalAlpha = 0.18 + energyState.openness * 0.2;
  context.strokeStyle = "rgba(37, 99, 235, 0.09)";
  context.shadowColor = "#2563EB";
  context.shadowBlur = 12;

  for (let ring = 0; ring < 3; ring++) {
    context.save();
    context.rotate(ring * 1.35);
    context.scale(1, 0.42 + ring * 0.07);
    context.beginPath();
    context.arc(
      0,
      0,
      lerp(78, 178, energyState.openness) + ring * 17,
      ring * 0.65,
      Math.PI * 1.45 + ring * 0.45
    );
    context.lineWidth = 1.4 - ring * 0.25;
    context.stroke();
    context.restore();
  }

  context.restore();
}

function drawHeartCore(context, energyState) {
  const coreRadius = lerp(18, 8, energyState.openness);
  const gradient = context.createRadialGradient(
    energyState.x,
    energyState.y,
    0,
    energyState.x,
    energyState.y,
    coreRadius * 3.2
  );

  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.22, "rgba(19, 73, 197, 0.85)");
  gradient.addColorStop(1, "rgba(37,99,235,0)");

  context.globalAlpha = 1 - energyState.openness * 0.55;
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(energyState.x, energyState.y, coreRadius * 3.2, 0, Math.PI * 2);
  context.fill();
}

function updateAdaptiveParticleCount(frameDuration) {
  sampledFrames += 1;
  sampledTime += frameDuration;

  if (sampledFrames < FPS_SAMPLE_FRAMES) {
    return;
  }

  const averageFrameTime = sampledTime / sampledFrames;
  const fps = 1000 / Math.max(averageFrameTime, 1);

  if (fps < 38 && activeParticleCount > MIN_PARTICLE_COUNT) {
    activeParticleCount = Math.max(
      MIN_PARTICLE_COUNT,
      activeParticleCount - 750
    );
  } else if (fps > 54 && activeParticleCount < MAX_PARTICLE_COUNT) {
    activeParticleCount = Math.min(
      MAX_PARTICLE_COUNT,
      activeParticleCount + 350
    );
  }

  sampledFrames = 0;
  sampledTime = 0;
}

function rotatePoint(x, y, angle) {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);

  return {
    x: x * cosine - y * sine,
    y: x * sine + y * cosine
  };
}

function smootherStep(value) {
  const clamped = clamp(value, 0, 1);
  return clamped * clamped * clamped *
    (clamped * (clamped * 6 - 15) + 10);
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function randomBetween(minimum, maximum) {
  return minimum + Math.random() * (maximum - minimum);
}