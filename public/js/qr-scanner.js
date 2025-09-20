// Simple QR scanner using camera and jsQR
let video;
let canvas;
let context;
let scanning = false;

function startScanner() {
	if (scanning) return;
	scanning = true;
	const qrDiv = document.getElementById('qrScanner');
	qrDiv.innerHTML = '<video id="qrVideo" width="320" height="240" autoplay></video><canvas id="qrCanvas" style="display:none;"></canvas><div id="qrResult"></div>';
	video = document.getElementById('qrVideo');
	canvas = document.getElementById('qrCanvas');
	context = canvas.getContext('2d');
	navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(stream => {
		video.srcObject = stream;
		video.setAttribute('playsinline', true);
		video.play();
		tick();
	});
}

function tick() {
	if (!scanning) return;
	if (video.readyState === video.HAVE_ENOUGH_DATA) {
		canvas.height = video.videoHeight;
		canvas.width = video.videoWidth;
		context.drawImage(video, 0, 0, canvas.width, canvas.height);
		const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
		const code = jsQR(imageData.data, imageData.width, imageData.height);
		if (code) {
			document.getElementById('qrResult').innerText = 'QR Code: ' + code.data;
			document.getElementById('totpSecret').value = code.data;
			stopScanner();
		}
	}
	requestAnimationFrame(tick);
}

function stopScanner() {
	scanning = false;
	if (video && video.srcObject) {
		video.srcObject.getTracks().forEach(track => track.stop());
	}
	document.getElementById('qrScanner').style.display = 'none';
}

window.startScanner = startScanner;
window.stopScanner = stopScanner;

document.getElementById('scanQrBtn')?.addEventListener('click', startScanner);