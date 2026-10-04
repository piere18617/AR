# Ocean Explorer web prototype

This static webpage shows the included `intro.jpg` ocean illustration in both halves of the screen, waits five seconds, then plays the included eight-second `ocean.mp4` in both halves. When the video ends, it returns to the image and repeats. The video is muted and uses inline playback for mobile Safari.

## Media files

The project includes:

- `intro.jpg` — the starting ocean illustration
- `ocean.mp4` — an animated underwater scene encoded as H.264 MP4

You can replace either file with your own media, keeping the same filename. Change `IMAGE_DURATION_SECONDS` near the top of `app.js` to adjust the delay.

## Serve it from Windows

Open PowerShell in this project folder and run:

```powershell
py -m http.server 8000 --bind 0.0.0.0
```

Find the PC's local IPv4 address with `ipconfig` (look under the active Wi-Fi or Ethernet adapter). On the iPhone, connected to the same home network, open:

```text
http://PC-IP-ADDRESS:8000
```

For example: `http://192.168.1.25:8000`. Allow Python through Windows Firewall on private networks if prompted.

## Try it in the goggles

Open the page in Safari, rotate the iPhone to landscape, and place it in the goggles. The page fills the screen and duplicates the full image/video into the left and right halves without cropping. Safari's own address bar is controlled by iOS; for a cleaner view, you can use Safari's **Share → Add to Home Screen**, then launch it from the Home Screen.

The two video elements are muted and `playsinline` for iPhone compatibility. If Safari blocks autoplay, tap **Tap to start video**. This prototype uses the same flat image/video for both eyes; it does not create stereoscopic depth.
