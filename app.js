// Set how long the intro image stays on screen before the video starts.
const IMAGE_DURATION_SECONDS = 5;

const eyes = Array.from(document.querySelectorAll(".eye"));
const images = Array.from(document.querySelectorAll(".scene-image"));
const videos = Array.from(document.querySelectorAll(".scene-video"));
const message = document.querySelector(".message");
const messageText = document.querySelector(".message-text");
const startButton = document.querySelector(".start-button");

let imageTimer;
let hasStarted = false;

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
    showMessage("Add intro.jpg to this folder, then reload the page.");
    return;
  }

  hasStarted = true;
  hideMessage();
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

// Keep the two independent video elements aligned for the left and right eyes.
videos[0].addEventListener("timeupdate", () => {
  if (Math.abs(videos[0].currentTime - videos[1].currentTime) > 0.12) {
    videos[1].currentTime = videos[0].currentTime;
  }
});

videos[0].addEventListener("ended", returnToImage);
startButton.addEventListener("click", startVideo);

eyes.forEach((eye) => eye.classList.add("show-image"));
startExperience();
