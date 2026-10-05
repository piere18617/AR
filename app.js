// Set how long the intro image stays on screen before the video starts.
const IMAGE_DURATION_SECONDS = 5;
const PANORAMA_FOV = 88;

const viewer = document.querySelector(".viewer");
const panoramaCanvas = document.querySelector(".panorama-scene");
const eyes = Array.from(document.querySelectorAll(".eye"));
const images = Array.from(document.querySelectorAll(".scene-image"));
const videos = Array.from(document.querySelectorAll(".scene-video"));
const message = document.querySelector(".message");
const messageText = document.querySelector(".message-text");
const startButton = document.querySelector(".start-button");
const motionButton = document.querySelector(".motion-button");
const slideshowButton = document.querySelector(".slideshow-button");

let imageTimer;
let motionTimer;
let hasStarted = false;
let isPanoramaActive = false;
let panoramaRenderer;
let sensorOrigin;
let lookYaw = 0;
let lookPitch = 0;
let dragOrigin;

function showMessage(text, canStartVideo = false) {
  messageText.textContent = text;
  message.hidden = false;
  startButton.hidden = !canStartVideo;
}

function hideMessage() {
  message.hidden = true;
  startButton.hidden = true;
}

function showImage() {
  eyes.forEach((eye) => {
    eye.classList.remove("show-video");
    eye.classList.add("show-image");
  });
}

function showVideo() {
  eyes.forEach((eye) => {
    eye.classList.remove("show-image");
    eye.classList.add("show-video");
  });
}

function returnToImage() {
  videos.forEach((video) => {
    video.pause();
    video.currentTime = 0;
  });
  showImage();
  window.clearTimeout(imageTimer);
  imageTimer = window.setTimeout(startVideo, IMAGE_DURATION_SECONDS * 1000);
}

async function startVideo() {
  showVideo();
  hideMessage();
  videos.forEach((video) => {
    video.currentTime = 0;
  });

  try {
    await Promise.all(videos.map((video) => video.play()));
  } catch {
    videos.forEach((video) => video.pause());
    if (isPanoramaActive) return;
    if (videos.some((video) => video.error)) {
      showMessage("Safari could not load ocean.mp4. Check the file and try a Safari-compatible MP4.");
    } else {
      showMessage("Tap below to start the video.", true);
    }
  }
}

function startExperience() {
  if (hasStarted) return;
  if (images.some((image) => !image.complete)) return;

  if (images.some((image) => image.naturalWidth === 0)) {
    showMessage("Could not load intro.jpg. Put the image beside index.html, then reload.");
    return;
  }

  hasStarted = true;
  hideMessage();
  showImage();
  imageTimer = window.setTimeout(startVideo, IMAGE_DURATION_SECONDS * 1000);
}

function createPanoramaTexture() {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 2048;
  textureCanvas.height = 1024;
  const context = textureCanvas.getContext("2d");
  const { width, height } = textureCanvas;

  const water = context.createLinearGradient(0, 0, 0, height);
  water.addColorStop(0, "#b4f1df");
  water.addColorStop(0.14, "#48b5b5");
  water.addColorStop(0.48, "#08708d");
  water.addColorStop(0.78, "#03405f");
  water.addColorStop(1, "#001326");
  context.fillStyle = water;
  context.fillRect(0, 0, width, height);

  const sunlight = context.createLinearGradient(0, 0, 0, height * 0.58);
  sunlight.addColorStop(0, "rgba(255,255,226,0.62)");
  sunlight.addColorStop(0.62, "rgba(116,238,226,0.16)");
  sunlight.addColorStop(1, "rgba(116,238,226,0)");
  context.fillStyle = sunlight;
  context.fillRect(0, 0, width, height * 0.58);

  context.save();
  context.globalAlpha = 0.14;
  context.strokeStyle = "#e0fff0";
  context.lineWidth = 18;
  for (let x = -160; x < width + 240; x += 230) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x + 310, height * 0.43);
    context.stroke();
  }
  context.restore();

  const sand = context.createLinearGradient(0, height * 0.76, 0, height);
  sand.addColorStop(0, "rgba(12,87,100,0)");
  sand.addColorStop(0.28, "rgba(16,94,100,0.72)");
  sand.addColorStop(1, "#092e42");
  context.fillStyle = sand;
  context.beginPath();
  context.moveTo(0, height * 0.83);
  for (let x = 0; x <= width; x += 32) {
    const y = height * (0.81 + 0.018 * Math.sin(x * 0.012) + 0.012 * Math.sin(x * 0.027));
    context.lineTo(x, y);
  }
  context.lineTo(width, height);
  context.lineTo(0, height);
  context.closePath();
  context.fill();

  const random = (seed) => {
    const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return value - Math.floor(value);
  };

  for (let i = 0; i < 85; i += 1) {
    const x = random(i + 1) * width;
    const y = height * (0.16 + random(i + 105) * 0.75);
    const radius = 3 + random(i + 205) * 11;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.strokeStyle = "rgba(214,249,242,0.47)";
    context.lineWidth = 2;
    context.stroke();
    context.beginPath();
    context.arc(x - radius * 0.28, y - radius * 0.32, Math.max(1, radius * 0.18), 0, Math.PI * 2);
    context.fillStyle = "rgba(242,255,250,0.56)";
    context.fill();
  }

  for (let i = 0; i < 34; i += 1) {
    const x = random(i + 305) * width;
    const y = height * (0.38 + random(i + 405) * 0.28);
    const scale = 0.55 + random(i + 505) * 0.8;
    context.save();
    context.translate(x, y);
    context.scale(scale, scale);
    context.fillStyle = "rgba(214,244,225,0.83)";
    context.beginPath();
    context.ellipse(0, 0, 15, 6, 0, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.moveTo(-12, 0);
    context.lineTo(-23, -8);
    context.lineTo(-23, 8);
    context.closePath();
    context.fill();
    context.restore();
  }

  for (let i = 0; i < 18; i += 1) {
    const x = 36 + i * 116;
    const baseY = height * (0.83 + random(i + 605) * 0.045);
    const topY = height * (0.68 + random(i + 705) * 0.1);
    context.strokeStyle = i % 3 === 0 ? "#ff947f" : i % 3 === 1 ? "#3fc2a7" : "#de84bb";
    context.lineWidth = 11 + random(i + 805) * 9;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(x, baseY);
    context.bezierCurveTo(x - 25, baseY - 60, x + 25, topY + 40, x + 5, topY);
    context.stroke();
    context.beginPath();
    context.moveTo(x + 3, topY + 42);
    context.lineTo(x - 17, topY + 19);
    context.moveTo(x + 3, topY + 57);
    context.lineTo(x + 24, topY + 34);
    context.stroke();
  }

  return textureCanvas;
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Could not create the panorama shader.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const error = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(error || "Could not compile the panorama shader.");
  }
  return shader;
}

function createPanoramaRenderer() {
  const gl = panoramaCanvas.getContext("webgl", { alpha: false, antialias: false });
  if (!gl) throw new Error("This browser could not create a WebGL panorama.");

  const vertex = compileShader(
    gl,
    gl.VERTEX_SHADER,
    "attribute vec2 position; varying vec2 uv; void main(){ uv=position*0.5+0.5; gl_Position=vec4(position,0.0,1.0); }",
  );
  const fragment = compileShader(
    gl,
    gl.FRAGMENT_SHADER,
    "precision mediump float;" +
      "varying vec2 uv; uniform sampler2D panorama; uniform float yaw; uniform float pitch;" +
      "uniform float aspect; uniform float fovScale;" +
      "void main(){" +
      "vec3 ray=normalize(vec3((uv.x*2.0-1.0)*aspect*fovScale,(uv.y*2.0-1.0)*fovScale,-1.0));" +
      "float cp=cos(pitch); float sp=sin(pitch);" +
      "ray=vec3(ray.x,ray.y*cp-ray.z*sp,ray.y*sp+ray.z*cp);" +
      "float cy=cos(yaw); float sy=sin(yaw);" +
      "ray=vec3(ray.x*cy+ray.z*sy,ray.y,-ray.x*sy+ray.z*cy);" +
      "vec2 sphereUv=vec2(atan(ray.z,ray.x)/6.2831853+0.5,asin(clamp(ray.y,-1.0,1.0))/3.14159265+0.5);" +
      "gl_FragColor=texture2D(panorama,sphereUv);" +
      "}",
  );

  const program = gl.createProgram();
  if (!program) throw new Error("Could not create the panorama renderer.");
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || "Could not link the panorama renderer.");
  }

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.useProgram(program);
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, createPanoramaTexture());
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  panoramaRenderer = {
    gl,
    program,
    yaw: gl.getUniformLocation(program, "yaw"),
    pitch: gl.getUniformLocation(program, "pitch"),
    aspect: gl.getUniformLocation(program, "aspect"),
    fovScale: gl.getUniformLocation(program, "fovScale"),
  };
}

function renderPanorama() {
  if (!panoramaRenderer || !isPanoramaActive) return;
  const { gl, program } = panoramaRenderer;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(panoramaCanvas.clientWidth * pixelRatio));
  const height = Math.max(1, Math.round(panoramaCanvas.clientHeight * pixelRatio));
  if (panoramaCanvas.width !== width || panoramaCanvas.height !== height) {
    panoramaCanvas.width = width;
    panoramaCanvas.height = height;
  }

  const leftWidth = Math.floor(width / 2);
  const rightWidth = width - leftWidth;
  const fovScale = Math.tan((PANORAMA_FOV * Math.PI) / 360);
  gl.useProgram(program);
  gl.uniform1f(panoramaRenderer.yaw, lookYaw);
  gl.uniform1f(panoramaRenderer.pitch, lookPitch);
  gl.uniform1f(panoramaRenderer.fovScale, fovScale);
  gl.enable(gl.SCISSOR_TEST);

  gl.viewport(0, 0, leftWidth, height);
  gl.scissor(0, 0, leftWidth, height);
  gl.uniform1f(panoramaRenderer.aspect, leftWidth / height);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  gl.viewport(leftWidth, 0, rightWidth, height);
  gl.scissor(leftWidth, 0, rightWidth, height);
  gl.uniform1f(panoramaRenderer.aspect, rightWidth / height);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.disable(gl.SCISSOR_TEST);
}

function multiplyQuaternions(a, b) {
  return {
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
  };
}

function orientationDirection(event) {
  const alpha = (event.alpha || 0) * (Math.PI / 180);
  const beta = (event.beta || 0) * (Math.PI / 180);
  const gamma = -(event.gamma || 0) * (Math.PI / 180);
  const halfX = beta / 2;
  const halfY = alpha / 2;
  const halfZ = gamma / 2;
  const c1 = Math.cos(halfX);
  const c2 = Math.cos(halfY);
  const c3 = Math.cos(halfZ);
  const s1 = Math.sin(halfX);
  const s2 = Math.sin(halfY);
  const s3 = Math.sin(halfZ);

  let rotation = {
    x: s1 * c2 * c3 + c1 * s2 * s3,
    y: c1 * s2 * c3 - s1 * c2 * s3,
    z: c1 * c2 * s3 - s1 * s2 * c3,
    w: c1 * c2 * c3 + s1 * s2 * s3,
  };
  rotation = multiplyQuaternions(rotation, {
    x: -Math.SQRT1_2,
    y: 0,
    z: 0,
    w: Math.SQRT1_2,
  });

  const screenAngle = ((screen.orientation && screen.orientation.angle) || window.orientation || 0) * (Math.PI / 180);
  rotation = multiplyQuaternions(rotation, {
    x: 0,
    y: 0,
    z: -Math.sin(screenAngle / 2),
    w: Math.cos(screenAngle / 2),
  });

  const x = -2 * (rotation.x * rotation.z + rotation.w * rotation.y);
  const y = -2 * (rotation.y * rotation.z - rotation.w * rotation.x);
  const z = -(1 - 2 * (rotation.x * rotation.x + rotation.y * rotation.y));
  return {
    yaw: Math.atan2(x, -z),
    pitch: Math.asin(Math.max(-1, Math.min(1, y))),
  };
}

function normalizeAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function handleDeviceOrientation(event) {
  if (!isPanoramaActive || event.alpha === null || event.beta === null || event.gamma === null) return;
  const direction = orientationDirection(event);

  if (!sensorOrigin) {
    sensorOrigin = direction;
    return;
  }

  lookYaw = normalizeAngle(direction.yaw - sensorOrigin.yaw);
  lookPitch = Math.max(
    -Math.PI * 0.48,
    Math.min(Math.PI * 0.48, direction.pitch - sensorOrigin.pitch),
  );
  window.clearTimeout(motionTimer);
  hideMessage();
  renderPanorama();
}

function handlePointerDown(event) {
  if (!isPanoramaActive) return;
  dragOrigin = { x: event.clientX, y: event.clientY };
  panoramaCanvas.setPointerCapture(event.pointerId);
}

function handlePointerMove(event) {
  if (!dragOrigin || !isPanoramaActive) return;
  const dx = event.clientX - dragOrigin.x;
  const dy = event.clientY - dragOrigin.y;
  const height = Math.max(panoramaCanvas.clientHeight, 1);
  lookYaw -= (dx / height) * (Math.PI / 2);
  lookPitch = Math.max(-Math.PI * 0.48, Math.min(Math.PI * 0.48, lookPitch + (dy / height) * Math.PI));
  dragOrigin = { x: event.clientX, y: event.clientY };
  renderPanorama();
}

function leavePanorama() {
  isPanoramaActive = false;
  window.clearTimeout(motionTimer);
  window.removeEventListener("deviceorientation", handleDeviceOrientation);
  viewer.classList.remove("panorama-active");
  motionButton.hidden = false;
  slideshowButton.hidden = true;
  sensorOrigin = null;
  dragOrigin = null;
  hideMessage();
}

async function enterPanorama() {
  window.clearTimeout(imageTimer);
  videos.forEach((video) => video.pause());
  motionButton.hidden = true;
  slideshowButton.hidden = false;
  viewer.classList.add("panorama-active");
  isPanoramaActive = true;
  sensorOrigin = null;
  lookYaw = 0;
  lookPitch = 0;

  try {
    if (!panoramaRenderer) createPanoramaRenderer();
    renderPanorama();
  } catch (error) {
    leavePanorama();
    showMessage(`Could not start the 360° scene: ${error.message}`);
    return;
  }

  showMessage("Move the phone to look around. Drag the scene if motion is unavailable.");
  motionTimer = window.setTimeout(() => {
    if (!sensorOrigin && isPanoramaActive) {
      showMessage("No motion reading yet. Drag the scene, or check Safari's motion permission.");
    }
  }, 2500);

  try {
    const orientationApi = window.DeviceOrientationEvent;
    if (orientationApi && typeof orientationApi.requestPermission === "function") {
      const permission = await orientationApi.requestPermission();
      if (permission !== "granted") {
        window.clearTimeout(motionTimer);
        showMessage("Motion access was not granted. Drag the scene to look around.");
        return;
      }
    }
    window.addEventListener("deviceorientation", handleDeviceOrientation, { passive: true });
  } catch {
    window.clearTimeout(motionTimer);
    showMessage("Motion access is unavailable. Drag the scene to look around.");
  }
}

function returnToSlideshow() {
  leavePanorama();
  showImage();
  imageTimer = window.setTimeout(startVideo, IMAGE_DURATION_SECONDS * 1000);
}

images.forEach((image) => {
  image.addEventListener("load", startExperience);
  image.addEventListener("error", () => {
    showMessage("Could not load intro.jpg. Put the image beside index.html, then reload.");
  });
});

videos.forEach((video) => {
  video.addEventListener("error", () => {
    window.clearTimeout(imageTimer);
    showImage();
    showMessage("Safari could not load ocean.mp4. Check that it is beside index.html and is a Safari-compatible MP4.");
  });
});

videos[0].addEventListener("timeupdate", () => {
  if (Math.abs(videos[0].currentTime - videos[1].currentTime) > 0.12) {
    videos[1].currentTime = videos[0].currentTime;
  }
});

videos[0].addEventListener("ended", returnToImage);
startButton.addEventListener("click", startVideo);
motionButton.addEventListener("click", enterPanorama);
slideshowButton.addEventListener("click", returnToSlideshow);
panoramaCanvas.addEventListener("pointerdown", handlePointerDown);
panoramaCanvas.addEventListener("pointermove", handlePointerMove);
panoramaCanvas.addEventListener("pointerup", () => {
  dragOrigin = null;
});
panoramaCanvas.addEventListener("pointercancel", () => {
  dragOrigin = null;
});
window.addEventListener("resize", renderPanorama);
window.addEventListener("orientationchange", renderPanorama);

eyes.forEach((eye) => eye.classList.add("show-image"));
startExperience();
