const {ipcRenderer} = require("electron");

ipcRenderer.on('audio-source', (event, messsage) => {
  setStream(messsage)
})

async function setStream(constraint) {
  const stream = await navigator.mediaDevices.getUserMedia(constraint)

  const mediaElement = document.querySelector('video')
  mediaElement.srcObject = stream
  mediaElement.play()
}