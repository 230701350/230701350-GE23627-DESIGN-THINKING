// DOM Elements
const imageUpload = document.getElementById('imageUpload');
const originalImageContainer = document.getElementById('originalImage');
const correctedImageContainer = document.getElementById('correctedImage');
const webcamContainer = document.getElementById('webcamContainer');
const webcamVideo = document.getElementById('webcamVideo');
const webcamCanvas = document.getElementById('webcamCanvas');
const startWebcamBtn = document.getElementById('startWebcam');
const captureWebcamBtn = document.getElementById('captureWebcam');
const stopWebcamBtn = document.getElementById('stopWebcam');
const cvdTypeButtons = document.querySelectorAll('.cvd-type-btn');
const intensitySlider = document.getElementById('intensitySlider');
const intensityValue = document.getElementById('intensityValue');
const processBtn = document.getElementById('processImage');
const saveBtn = document.getElementById('saveImage');
const resetBtn = document.getElementById('resetImage');
const toggleAnalysisBtn = document.getElementById('toggleAnalysis');
const colorAnalysisContainer = document.getElementById('colorAnalysis');
const originalColorBox = document.getElementById('originalColorBox');
const correctedColorBox = document.getElementById('correctedColorBox');
const originalColorHex = document.getElementById('originalColorHex');
const originalColorRgb = document.getElementById('originalColorRgb');
const originalColorName = document.getElementById('originalColorName');
const correctedColorHex = document.getElementById('correctedColorHex');
const correctedColorRgb = document.getElementById('correctedColorRgb');
const correctedColorName = document.getElementById('correctedColorName');
const processingIndicator = document.getElementById('processingIndicator');
const imageInfo = document.getElementById('imageInfo');
const addToHistoryBtn = document.getElementById('addToHistoryBtn');

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    updateCorrectionIntensity();
    checkForQueryParams();
});

/**
 * Keyboard shortcut handler for common actions
 */
document.addEventListener('keydown', (e) => {
    // Only process if no modal is open and no input is focused
    if (document.querySelector('.modal.show') ||
        document.activeElement.tagName === 'INPUT' ||
        document.activeElement.tagName === 'TEXTAREA') {
        return;
    }

    // Process image - Ctrl+P
    if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        processImage();
    }

    // Save image - Ctrl+S
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveImage();
    }

    // Reset image - Ctrl+R
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        resetImage();
    }

    // Toggle webcam - W
    if (e.key === 'w' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        if (webcamActive) {
            stopWebcam();
        } else {
            startWebcam();
        }
    }

    // Toggle color analysis - A
    if (e.key === 'a' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        toggleColorAnalysis();
    }
});

// Additional UI elements initialization if needed
document.addEventListener('DOMContentLoaded', () => {
    // Initialize any tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize any popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Add export format selector event listeners if they exist
    const exportFormatSelect = document.getElementById('exportFormat');
    if (exportFormatSelect) {
        exportFormatSelect.addEventListener('change', (e) => {
            const format = e.target.value;
            document.getElementById('exportBtn').onclick = () => exportImage(format);
        });
    }

    const addToHistoryBtn = document.getElementById('addToHistoryBtn');
    if (addToHistoryBtn) {
        addToHistoryBtn.addEventListener('click', async () => {
            await saveToHistory();
        });
    }

    // Add share button event listener if it exists
    const shareBtn = document.getElementById('shareImage');
    if (shareBtn) {
        // Only show share button if Web Share API is available
        if (navigator.share) {
            shareBtn.classList.remove('d-none');
            shareBtn.addEventListener('click', shareImage);
        } else {
            shareBtn.classList.add('d-none');
        }
    }

    // Add simulation button event listener if it exists
    const simulateBtn = document.getElementById('simulateCvd');
    if (simulateBtn) {
        simulateBtn.addEventListener('click', generateCvdSimulation);
    }

    // Add bulk processing button event listener if it exists
    const bulkProcessBtn = document.getElementById('bulkProcess');
    if (bulkProcessBtn) {
        bulkProcessBtn.addEventListener('click', bulkProcess);
    }

    // Add preset buttons event listeners if they exist
    const presetButtons = document.querySelectorAll('.preset-btn');
    presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            applyPreset(btn.dataset.preset);
        });
    });
});



// Initialize ResizeObserver to handle canvas resizing
const resizeObserver = new ResizeObserver(entries => {
    entries.forEach(entry => {
        const container = entry.target;

        // Only process if container has a canvas and an image is loaded
        const canvas = container.querySelector('canvas');
        if (canvas && (container.id === 'originalImage' ? currentImage : correctedImage)) {
            const img = container.id === 'originalImage' ? currentImage : correctedImage;
            if (img) {
                // Redraw the canvas to fit the new container size
                const containerWidth = container.clientWidth;
                const scaleFactor = containerWidth / img.width;

                canvas.width = containerWidth;
                canvas.height = img.height * scaleFactor;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Update selected pixel colors if analysis is active
                if (analysisActive && selectedPixelCoords) {
                    updateSelectedPixelColors(selectedPixelCoords.x, selectedPixelCoords.y);
                }
            }
        }
    });
});

// Observe the image containers for resize
resizeObserver.observe(originalImageContainer);
resizeObserver.observe(correctedImageContainer);

// Add this function to your dashboard-client.js file

/**
 * Save the processed image to user history
 * @param {string} originalImageUrl - Data URL of the original image
 * @param {string} processedImageUrl - Data URL of the processed image
 * @param {string} cvdType - Type of color vision deficiency correction applied
 */
/**
 * Save the processed image to user history
 */
async function saveToHistory() {
    try {
        // Make sure we have processed images
        if (!correctedImage) {
            alert('Please process an image first');
            return;
        }

        // Show processing indicator
        if (processingIndicator) {
            processingIndicator.textContent = 'Saving to history...';
            processingIndicator.style.display = 'block';
        }

        // Get canvases
        const originalCanvas = originalImageContainer.querySelector('canvas');
        const processedCanvas = correctedImageContainer.querySelector('canvas');

        if (!originalCanvas || !processedCanvas) {
            console.error("Canvas elements not found");
            return;
        }

        // Convert canvases to data URLs
        const originalImageUrl = originalCanvas.toDataURL('image/jpeg');
        const processedImageUrl = processedCanvas.toDataURL('image/jpeg');

        // Get selected CVD type
        let selectedCvdType = 'Other';
        cvdTypeButtons.forEach(button => {
            if (button.classList.contains('active')) {
                selectedCvdType = button.dataset.cvdType || 'Other';
            }
        });

        // Create metadata
        const metadata = {
            title: 'Processed Image', // You could add a field for users to enter a title
            intensity: intensitySlider.value,
            dimensions: {
                width: correctedImage.width,
                height: correctedImage.height
            }
        };

        // Send to server
        const response = await fetch('/history/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                originalImageUrl,
                processedImageUrl,
                cvdType: selectedCvdType,
                metadata
            })
        });

        const data = await response.json();

        if (data.success) {
            alert('Image saved to history successfully');
        } else {
            console.error('Failed to save image:', data.message);
            alert('Failed to save image to history: ' + data.message);
        }
    } catch (error) {
        console.error('Error saving image to history:', error);
        alert('Error saving image to history');
    } finally {
        // Hide indicator
        if (processingIndicator) {
            processingIndicator.style.display = 'none';
        }
    }
}

// Then call this function after successfully processing an image
// For example, add this to your existing processImage function:

async function processImage() {
    // Your existing image processing code...

    // After processing is complete:
    const originalImageCanvas = originalImageContainer.querySelector('canvas');
    const correctedImageCanvas = correctedImageContainer.querySelector('canvas');

    // Get the selected CVD type
    let selectedCvdType = 'Other';
    cvdTypeButtons.forEach(button => {
        if (button.classList.contains('active')) {
            selectedCvdType = button.dataset.cvdType;
        }
    });

    // Get data URLs from canvases
    const originalImageUrl = originalImageCanvas.toDataURL('image/jpeg');
    const processedImageUrl = correctedImageCanvas.toDataURL('image/jpeg');

    // Save to history
    await saveToHistory(originalImageUrl, processedImageUrl, selectedCvdType);
}


/**
 * Save the processed image to user history using file upload
 */
async function saveToHistory(originalCanvas, processedCanvas, cvdType) {
    try {
        // Show a saving indicator if you have one
        if (processingIndicator) {
            processingIndicator.textContent = 'Saving to history...';
            processingIndicator.style.display = 'block';
        }

        // Convert canvases to blobs
        const originalBlob = await new Promise(resolve => {
            originalCanvas.toBlob(resolve, 'image/jpeg');
        });

        const processedBlob = await new Promise(resolve => {
            processedCanvas.toBlob(resolve, 'image/jpeg');
        });

        // Create form data
        const formData = new FormData();
        formData.append('originalImage', originalBlob, 'original.jpg');
        formData.append('processedImage', processedBlob, 'processed.jpg');
        formData.append('cvdType', cvdType);

        // Add metadata
        const metadata = {
            title: 'Processed Image',
            intensity: intensitySlider.value,
            dimensions: {
                width: correctedImage.width,
                height: correctedImage.height
            }
        };
        formData.append('metadata', JSON.stringify(metadata));

        // Send to server
        const response = await fetch('/history/save', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            // Show success message
            alert('Image saved to history successfully');
        } else {
            console.error('Failed to save image:', data.message);
            alert('Failed to save image to history');
        }
    } catch (error) {
        console.error('Error saving image:', error);
    } finally {
        // Hide indicator
        if (processingIndicator) {
            processingIndicator.style.display = 'none';
        }
    }
}

// Update your processImage function:
async function processImage() {
    // Your existing code...

    // After processing:
    const originalCanvas = originalImageContainer.querySelector('canvas');
    const processedCanvas = correctedImageContainer.querySelector('canvas');

    // Get selected CVD type
    let selectedCvdType = 'Other';
    cvdTypeButtons.forEach(button => {
        if (button.classList.contains('active')) {
            selectedCvdType = button.dataset.cvdType;
        }
    });

    // Save to history
    await saveToHistory(originalCanvas, processedCanvas, selectedCvdType);
}

// Add this to your dashboard-client.js file

document.addEventListener('DOMContentLoaded', function () {
    // Handle Add to History button click
    const addToHistoryBtn = document.getElementById('addToHistoryBtn');
    if (addToHistoryBtn) {
        addToHistoryBtn.addEventListener('click', saveToHistory);
    }
});