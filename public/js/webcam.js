// ChromaVision Webcam Handler
// Manages webcam capture functionality

class WebcamHandler {
    constructor() {
        this.video = document.getElementById('webcam');
        this.canvas = document.getElementById('webcamCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.streaming = false;
        this.stream = null;

        // Initialize event listeners
        this.initEventListeners();
    }

    initEventListeners() {
        // Webcam button click handler
        document.getElementById('webcamButton').addEventListener('click', () => {
            this.openWebcamModal();
        });

        // Capture button click handler
        document.getElementById('captureButton').addEventListener('click', () => {
            this.captureImage();
        });

        // Modal close handler to stop webcam
        $('#webcamModal').on('hidden.bs.modal', () => {
            this.stopWebcam();
        });
    }

    openWebcamModal() {
        // Show webcam modal
        $('#webcamModal').modal('show');

        // Start webcam
        this.startWebcam();
    }

    startWebcam() {
        const constraints = {
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'environment' // Use rear camera if available
            },
            audio: false
        };

        // Access webcam
        navigator.mediaDevices.getUserMedia(constraints)
            .then((stream) => {
                this.video.srcObject = stream;
                this.stream = stream;
                this.video.play();

                // Set video dimensions once metadata is loaded
                this.video.addEventListener('loadedmetadata', () => {
                    this.canvas.width = this.video.videoWidth;
                    this.canvas.height = this.video.videoHeight;
                    this.streaming = true;
                });
            })
            .catch((err) => {
                console.error('Error accessing webcam:', err);
                alert('Could not access webcam. Please check permissions and try again.');
            });
    }

    captureImage() {
        if (this.streaming) {
            // Draw current video frame to canvas
            this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

            // Convert canvas to data URL
            const imageDataURL = this.canvas.toDataURL('image/png');

            // Create image object for processing
            const img = new Image();
            img.onload = () => {
                // Pass image to image processor
                window.imageProcessor.originalImage = img;
                window.imageProcessor.displayOriginalImage();
                window.imageProcessor.processImage();
                window.imageProcessor.enableButtons();

                // Close modal
                $('#webcamModal').modal('hide');
            };
            img.src = imageDataURL;
        }
    }

    stopWebcam() {
        if (this.stream) {
            // Stop all tracks in the stream
            this.stream.getTracks().forEach(track => {
                track.stop();
            });
            this.stream = null;
            this.streaming = false;
        }
    }
}

// Initialize webcam handler when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.webcamHandler = new WebcamHandler();
});