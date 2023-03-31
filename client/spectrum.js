const { ipcRenderer } = window;

// (async function() {
// 	const constraint = await ipcRenderer.invoke('audio-source')
//   setStream(constraints)
// })();

async function setDesktopStream() {
  const constraints = await ipcRenderer.invoke('audio-source')
  const stream = await navigator.mediaDevices.getUserMedia(constraints)
  return stream
  //createAudioContext(stream)
}

async function setMicStream() {
  const devices = await navigator.mediaDevices.enumerateDevices()

  const microphones = devices.filter(device => device.kind === 'audioinput');

  const constraints = {
    audio: {
      deviceId: {
        exact: 'fae2a7384af2aed55a6df41019102c52697f812f4ae3ff335f620cf3d97d248e'
      }
    }
  }

  const stream = await navigator.mediaDevices.getUserMedia(constraints)
  return stream
}

function createAudioContext(stream) {
  const audioContext = new AudioContext()
  const mediaStreamSource = audioContext.createMediaStreamSource(stream)
  const analyser = audioContext.createAnalyser()
  mediaStreamSource.connect(analyser)
  analyser.fftSize = 128

  return {audioContext: audioContext, analyser: analyser}
}

function createFFTData(audioContext, analyser) {
  requestAnimationFrame(() => createFFTData(audioContext, analyser))

  const frequencyData = new Uint8Array(128)
  const frequencyRange = audioContext.sampleRate / 128
  analyser.getByteFrequencyData(frequencyData)

  const fftData = new Float32Array(128)
  
  for (let i = 0; i < 64; i++) {
    const frequency = i * frequencyRange;
    const index = Math.round(frequency / audioContext.sampleRate * 128);
    const leftChannelVolume = frequencyData[index] / 255;
    fftData[i] = leftChannelVolume;
  }

  for (let i = 64; i < 128; i++) {
    const frequency = (i - 64) * frequencyRange;
    const index = Math.round(frequency / audioContext.sampleRate * 128);
    const rightChannelVolume = frequencyData[index] / 255;
    fftData[i] = rightChannelVolume;
  }

  console.log(fftData)

  window.fftData(fftData)
}

async function registerFFTDataListener() {
  const stream = await setMicStream()
  const audio = createAudioContext(stream)
  createFFTData(audio.audioContext, audio.analyser)
}