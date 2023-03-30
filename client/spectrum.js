const { ipcRenderer } = window;

(async function() {
	const constraint = await ipcRenderer.invoke('audio-source')
  setStream(constraint)
})();

async function setStream(constraint) {
  const stream = await navigator.mediaDevices.getUserMedia(constraint)

  const mediaElement = document.querySelector('video')
  mediaElement.srcObject = stream
  mediaElement.play()
  console.log(2)
}