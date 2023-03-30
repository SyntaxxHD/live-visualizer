const { ipcRenderer } = window;

// (async function() {
// 	const constraint = await ipcRenderer.invoke('audio-source')
//   setStream(constraints)
// })();

async function setDesktopStream() {
  const constraints = await ipcRenderer.invoke('audio-source')
  const stream = await navigator.mediaDevices.getUserMedia(constraints)
  createAudioContext(stream)
}

async function setMicStream() {
  const devices = await navigator.mediaDevices.enumerateDevices()

  const microphones = devices.filter(device => device.kind === 'audioinput');
  console.log(microphones)

  const constraints = {
    audio: {
      deviceId: {
        exact: 'fae2a7384af2aed55a6df41019102c52697f812f4ae3ff335f620cf3d97d248e'
      }
    }
  }

  const stream = await navigator.mediaDevices.getUserMedia(constraints)
  
  const mediaElement = document.querySelector('audio')
  mediaElement.srcObject = stream
  mediaElement.play()
}

function createAudioContext(stream) {
  const audioContext = new AudioContext()
  const mediaStreamSource = audioContext.createMediaStreamSource(stream)
  const analyser = audioContext.createAnalyser()
  mediaStreamSource.connect(analyser)
  analyser.fftSize = 2048

  return {audioContext, analyser}
}

function createFFTData(audioContext, analyser) {
  const frequencyData = new Uint8Array(analyser.frequencyBinCount)
  requestAnimationFrame(() => createFFTData(audioContext, analyser))

  analyser.getByteFrequencyData(frequencyData)

  const fftData = new Uint8Array(128)
  fftData.set(frequencyData.subarray(0, 32), 0)
  fftData.set(frequencyData.subarray(64, 96), 32)
  fftData.set(frequencyData.subarray(32, 64), 64)
  fftData.set(frequencyData.subarray(96, 128), 96)
}

setDesktopStream()