const {ipcRenderer} = window;

async function setDesktopStream() {
  const constraints = {
    audio: {
      mandatory: {
        chromeMediaSource: 'desktop'
      }
    },
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
      }
    }
  }

  return await navigator.mediaDevices.getUserMedia(constraints)
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

const audioContext = new AudioContext()
const splitter = audioContext.createChannelSplitter()
const analyserLeft = audioContext.createAnalyser()
const analyserRight = audioContext.createAnalyser()
const TDBL = analyserLeft.maxDecibels - analyserLeft.minDecibels
const TDBR = analyserRight.maxDecibels - analyserRight.minDecibels
let raito = 0.6

analyserLeft.smoothingTimeConstant = 0
analyserRight.smoothingTimeConstant = 0
analyserLeft.fftSize = 2048
analyserRight.fftSize = 2048

const getRawLeft = i => (i + TDBL) / TDBL
const getRawRight = i => (i + TDBR) / TDBR
const sum = (l, r) => l + r

function createAudioContext(stream) {
  const mediaStreamSource = audioContext.createMediaStreamSource(stream)
  mediaStreamSource.connect(analyserLeft)
  mediaStreamSource.connect(analyserRight)
}

function createFFTData() {
  requestAnimationFrame(() => createFFTData())

  const f32arrayLeft = new Float32Array(analyserLeft.frequencyBinCount)
  const f32arrayRight = new Float32Array(analyserRight.frequencyBinCount)
  analyserLeft.getFloatFrequencyData(f32arrayLeft)
  analyserRight.getFloatFrequencyData(f32arrayRight)

  const tarrLeft = Array
    .from(f32arrayLeft)
    .slice(0, 512)
    .map(getRawLeft)

  const tarrRight = Array
    .from(f32arrayRight)
    .slice(0, 512)
    .map(getRawRight)

  const arrayLeft = []
  const arrayRight = []

  for (let i = 0; i < 256; i += 4) {
    arrayLeft.push(tarrLeft.slice(i, i + 4)
      .reduce(sum) / 4 * Math.pow(0.9 + 4 * i / f32arrayLeft.length, 2) * raito)
    arrayRight.push(tarrRight.slice(i, i + 8)
      .reduce(sum) / 4 * Math.pow(0.9 + 4 * i / f32arrayRight.length, 2) * raito)
  }

  const outputData = arrayLeft.concat(arrayRight)
    .map(item => {
      if (item < 0 || item == Infinity) return 0
      return item
    })

  window.dispatchEvent(new CustomEvent('fftDataEvent', { detail: outputData }))
}

(async () => {
  const stream = await setMicStream()
  createAudioContext(stream)
  createFFTData()
})();

function registerFFTDataListener(callback) {
  return window.addEventListener('fftDataEvent', event => callback(event.detail))
}

function getGlobalFile(filename) {
  return ipcRenderer.sendSync('get-global-file', filename)
}

(() => {
  const errors = ipcRenderer.sendSync('get-global-errors')
  for (const error of errors) {
    console.error(error, error.stack)
  }
})();

ipcRenderer.on('error-message', (event, error) => {
  console.error(error, error.stack)
})