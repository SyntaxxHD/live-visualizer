const { ipcRenderer } = window;

// (async function() {
// 	const constraint = await ipcRenderer.invoke('audio-source')
//   setStream(constraints)
// })();

async function setStream(constraints) {
  const stream = await navigator.mediaDevices.getUserMedia(constraints)

  const mediaElement = document.querySelector('audio')
  mediaElement.srcObject = stream
  mediaElement.play()
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

setMicStream()