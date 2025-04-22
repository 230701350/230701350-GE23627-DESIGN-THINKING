/**
 * ChromaVision - Dashboard JavaScript
 * Handles the main functionality of the dashboard including image processing,
 * webcam integration, and color analysis
 */

// Global variables
let currentImage = null;
let correctedImage = null;
let currentCvdType = 'deuteranopia'; // Default CVD type
let correctionIntensity = 0.8; // Default correction intensity (0-1)
let webcamActive = false;
let webcamStream = null;
let processingActive = false;
let analysisActive = false;
let selectedPixelCoords = null;




const express = require('express');
const router = express.Router();

// router.get('/', (req, res) => {

//     const currentUser = req.user || {}; // fallback to empty object

//     if (!currentUser.preferences) {
//         currentUser.preferences = {
//             defaultCVDType: 'Protanopia' // or any sensible default
//         };
//     }

//     res.render('dashboard', {
//         currentUser: req.user
//     });
// });

router.get('/', (req, res) => {
    const fallbackUser = {
        preferences: {
            defaultCVDType: 'Protanopia' // fallback value
        }
    };

    const currentUser = req.user || fallbackUser;

    // If req.user exists but doesn't have preferences, apply fallback
    if (req.user && !req.user.preferences) {
        currentUser.preferences = fallbackUser.preferences;
    }

    res.render('dashboard', {
        currentUser
    });
});


router.get('/', async (req, res) => {
    const currentUser = req.session.user;

    // Add this check here 👇
    if (!currentUser.preferences) {
        currentUser.preferences = {
            defaultCVDType: 'Protanopia'
        };
    }

    res.render('dashboard', { currentUser });
});


// Other routes for image processing, etc.

module.exports = router;



/**
 * Initialize all event listeners for dashboard controls
 */
function initEventListeners() {
    // Image upload handling
    imageUpload.addEventListener('change', handleImageUpload);

    // Drag and drop functionality
    const dropArea = document.getElementById('dropArea');
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    dropArea.addEventListener('drop', handleDrop, false);

    // CVD type selection
    cvdTypeButtons.forEach(button => {
        button.addEventListener('click', () => {
            cvdTypeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentCvdType = button.dataset.cvdType;

            if (currentImage) {
                processImage();
            }
        });
    });

    // Correction intensity slider
    intensitySlider.addEventListener('input', () => {
        updateCorrectionIntensity();
        if (currentImage) {
            processImage();
        }
    });

    // Image processing buttons
    processBtn.addEventListener('click', processImage);
    saveBtn.addEventListener('click', saveImage);
    resetBtn.addEventListener('click', resetImage);
    addToHistoryBtn.addEventListener('click', saveToHistory)

    // processBtn.addEventListener('click', () => {
    //     // Your existing processing code...

    //     // After processing is complete and correctedImage is set:
    //     addToHistoryBtn.disabled = false; // Enable the add to history button
    // });

    // resetBtn.addEventListener('click', () => {
    //     // Your existing reset code...

    //     // When the image is reset:
    //     addToHistoryBtn.disabled = true; // Disable the add to history button
    // });

    // Webcam controls
    startWebcamBtn.addEventListener('click', startWebcam);
    captureWebcamBtn.addEventListener('click', captureFromWebcam);
    stopWebcamBtn.addEventListener('click', stopWebcam);

    // Color analysis
    toggleAnalysisBtn.addEventListener('click', toggleColorAnalysis);

    // Click event listeners for images (for color analysis)
    originalImageContainer.addEventListener('click', handleImageClick);
    correctedImageContainer.addEventListener('click', handleImageClick);
}

/**
 * Check for URL query parameters that might indicate an image to load
 * This is used when coming from the history page to edit a previous image
 */
function checkForQueryParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const imageId = urlParams.get('image');

    if (imageId) {
        // Load image from history based on ID
        fetch(`/api/history/${imageId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Image not found');
                }
                return response.json();
            })
            .then(data => {
                loadImageFromURL(data.originalUrl);
                // Set the CVD type and intensity from the saved settings
                currentCvdType = data.cvdType || 'deuteranopia';
                correctionIntensity = data.intensity || 0.8;

                // Update UI to match these settings
                cvdTypeButtons.forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.cvdType === currentCvdType) {
                        btn.classList.add('active');
                    }
                });

                intensitySlider.value = correctionIntensity * 100;
                updateCorrectionIntensity();
            })
            .catch(error => {
                showToast('Error loading image: ' + error.message, 'error');
            });
    }
}

/**
 * Prevent default browser behavior for drag and drop events
 */
function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

/**
 * Highlight the drop area when dragging over
 */
function highlight() {
    document.getElementById('dropArea').classList.add('active');
}

/**
 * Remove highlight from the drop area
 */
function unhighlight() {
    document.getElementById('dropArea').classList.remove('active');
}

/**
 * Handle file drop event
 */
function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;

    if (files.length) {
        handleFiles(files);
    }
}

/**
 * Handle files from either drag-drop or file input
 */
function handleFiles(files) {
    if (files.length === 0) return;

    const file = files[0];
    // Check if file is an image
    if (!file.type.match('image.*')) {
        showToast('Please select an image file', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        loadImageFromDataURL(e.target.result);
    };
    reader.readAsDataURL(file);
}

/**
 * Handle image upload from the file input
 */
function handleImageUpload(e) {
    handleFiles(e.target.files);
    // Reset file input so the same file can be selected again
    e.target.value = '';
}

/**
 * Load image from a URL (used when loading from history)
 */
function loadImageFromURL(url) {
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // Enable CORS for the image
    img.onload = () => {
        currentImage = img;
        displayImage(img, originalImageContainer);
        updateImageInfo(img);
        processImage();
    };
    img.onerror = () => {
        showToast('Error loading image', 'error');
    };
    img.src = url;
}

/**
 * Load image from a data URL (used for uploaded files and webcam captures)
 */
function loadImageFromDataURL(dataUrl) {
    const img = new Image();
    img.onload = () => {
        currentImage = img;
        displayImage(img, originalImageContainer);
        updateImageInfo(img);
        processImage();

        // Make sure the image display area is visible
        document.getElementById('imageDisplaySection').classList.remove('d-none');
        // Hide webcam if it was active
        if (webcamActive) {
            toggleWebcamDisplay(false);
        }
    };
    img.src = dataUrl;
}

/**
 * Display an image in the specified container
 */
function displayImage(img, container) {
    // Create a canvas to properly display the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions to match container size while maintaining aspect ratio
    const containerWidth = container.clientWidth;
    const scaleFactor = containerWidth / img.width;

    canvas.width = containerWidth;
    canvas.height = img.height * scaleFactor;

    // Clear previous content
    container.innerHTML = '';

    // Draw image on canvas
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Add canvas to container
    canvas.classList.add('img-fluid');
    container.appendChild(canvas);
}

/**
 * Update the image information display
 */
function updateImageInfo(img) {
    const width = img.width;
    const height = img.height;
    const aspectRatio = (width / height).toFixed(2);
    const size = `${width} × ${height} pixels`;

    imageInfo.innerHTML = `
        <div class="d-flex justify-content-around text-center">
            <div>
                <small class="text-muted">Dimensions</small>
                <p class="mb-0">${size}</p>
            </div>
            <div>
                <small class="text-muted">Aspect Ratio</small>
                <p class="mb-0">${aspectRatio}</p>
            </div>
        </div>
    `;
}

/**
 * Update the correction intensity display
 */
function updateCorrectionIntensity() {
    correctionIntensity = intensitySlider.value / 100;
    intensityValue.textContent = `${intensitySlider.value}%`;
}

/**
 * Process the current image based on selected CVD type and correction intensity
 */
function processImage() {
    if (!currentImage || processingActive) return;

    processingActive = true;
    processingIndicator.classList.remove('d-none');

    // Small delay to allow UI to update before processing starts
    setTimeout(() => {
        try {
            // Create a canvas for processing
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = currentImage.width;
            canvas.height = currentImage.height;
            ctx.drawImage(currentImage, 0, 0);

            // Get image data for processing
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // Process the image data based on CVD type
            const correctedData = applyColorCorrection(imageData, currentCvdType, correctionIntensity);

            // Put processed data back on canvas
            ctx.putImageData(correctedData, 0, 0);

            // Convert canvas to image
            const correctedImg = new Image();
            correctedImg.onload = () => {
                correctedImage = correctedImg;
                displayImage(correctedImg, correctedImageContainer);

                // Update selected pixel color if analysis is active
                if (analysisActive && selectedPixelCoords) {
                    updateSelectedPixelColors(selectedPixelCoords.x, selectedPixelCoords.y);
                }

                processingActive = false;
                processingIndicator.classList.add('d-none');

                // Enable save button
                saveBtn.disabled = false;
            };
            correctedImg.src = canvas.toDataURL('image/png');

        } catch (error) {
            console.error('Error processing image:', error);
            showToast('Error processing image: ' + error.message, 'error');
            processingActive = false;
            processingIndicator.classList.add('d-none');
        }
    }, 50);
}

/**
 * Apply color correction algorithm to image data
 * This is where the core CVD correction logic happens
 */
function applyColorCorrection(imageData, cvdType, intensity) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // Create a copy of the image data
    const correctedData = new ImageData(
        new Uint8ClampedArray(data),
        width,
        height
    );

    // Get transformation matrices based on CVD type
    const matrices = getCvdTransformationMatrices(cvdType);

    // Start performance measurement
    const startTime = performance.now();

    // Process each pixel
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Convert RGB to LMS color space
        const l = matrices.rgbToLms[0][0] * r + matrices.rgbToLms[0][1] * g + matrices.rgbToLms[0][2] * b;
        const m = matrices.rgbToLms[1][0] * r + matrices.rgbToLms[1][1] * g + matrices.rgbToLms[1][2] * b;
        const s = matrices.rgbToLms[2][0] * r + matrices.rgbToLms[2][1] * g + matrices.rgbToLms[2][2] * b;

        // Simulate CVD in LMS space
        let lp, mp, sp;
        if (cvdType === 'protanopia') {
            lp = matrices.protanopia[0][0] * l + matrices.protanopia[0][1] * m + matrices.protanopia[0][2] * s;
            mp = matrices.protanopia[1][0] * l + matrices.protanopia[1][1] * m + matrices.protanopia[1][2] * s;
            sp = matrices.protanopia[2][0] * l + matrices.protanopia[2][1] * m + matrices.protanopia[2][2] * s;
        } else if (cvdType === 'deuteranopia') {
            lp = matrices.deuteranopia[0][0] * l + matrices.deuteranopia[0][1] * m + matrices.deuteranopia[0][2] * s;
            mp = matrices.deuteranopia[1][0] * l + matrices.deuteranopia[1][1] * m + matrices.deuteranopia[1][2] * s;
            sp = matrices.deuteranopia[2][0] * l + matrices.deuteranopia[2][1] * m + matrices.deuteranopia[2][2] * s;
        } else if (cvdType === 'tritanopia') {
            lp = matrices.tritanopia[0][0] * l + matrices.tritanopia[0][1] * m + matrices.tritanopia[0][2] * s;
            mp = matrices.tritanopia[1][0] * l + matrices.tritanopia[1][1] * m + matrices.tritanopia[1][2] * s;
            sp = matrices.tritanopia[2][0] * l + matrices.tritanopia[2][1] * m + matrices.tritanopia[2][2] * s;
        }

        // Calculate difference between original and simulated
        const dl = l - lp;
        const dm = m - mp;
        const ds = s - sp;

        // Apply correction based on the difference and intensity
        const lc = l + dl * intensity;
        const mc = m + dm * intensity;
        const sc = s + ds * intensity;

        // Convert back to RGB
        let rc = matrices.lmsToRgb[0][0] * lc + matrices.lmsToRgb[0][1] * mc + matrices.lmsToRgb[0][2] * sc;
        let gc = matrices.lmsToRgb[1][0] * lc + matrices.lmsToRgb[1][1] * mc + matrices.lmsToRgb[1][2] * sc;
        let bc = matrices.lmsToRgb[2][0] * lc + matrices.lmsToRgb[2][1] * mc + matrices.lmsToRgb[2][2] * sc;

        // Clamp values to valid RGB range
        rc = Math.max(0, Math.min(255, Math.round(rc)));
        gc = Math.max(0, Math.min(255, Math.round(gc)));
        bc = Math.max(0, Math.min(255, Math.round(bc)));

        // Set corrected RGB values
        correctedData.data[i] = rc;
        correctedData.data[i + 1] = gc;
        correctedData.data[i + 2] = bc;
        // Alpha channel stays the same
    }

    // End performance measurement
    const endTime = performance.now();
    console.log(`Image processing took ${(endTime - startTime).toFixed(2)}ms`);

    return correctedData;
}

/**
 * Get color transformation matrices for different CVD types
 */
function getCvdTransformationMatrices(cvdType) {
    // RGB to LMS transformation matrix
    const rgbToLms = [
        [17.8824, 43.5161, 4.11935],
        [3.45565, 27.1554, 3.86714],
        [0.0299566, 0.184309, 1.46709]
    ];

    // LMS to RGB transformation matrix (inverse of rgbToLms)
    const lmsToRgb = [
        [0.0809444479, -0.130504409, 0.116721066],
        [-0.0102485335, 0.0540193266, -0.113614708],
        [-0.000365296938, -0.00412161469, 0.693511405]
    ];

    // Protanopia simulation matrix in LMS space
    const protanopia = [
        [0, 2.02344, -2.52581],
        [0, 1, 0],
        [0, 0, 1]
    ];

    // Deuteranopia simulation matrix in LMS space
    const deuteranopia = [
        [1, 0, 0],
        [0.494207, 0, 1.24827],
        [0, 0, 1]
    ];

    // Tritanopia simulation matrix in LMS space
    const tritanopia = [
        [1, 0, 0],
        [0, 1, 0],
        [-0.395913, 0.801109, 0]
    ];

    return {
        rgbToLms,
        lmsToRgb,
        protanopia,
        deuteranopia,
        tritanopia
    };
}

/**
 * Save the processed image
 */
function saveImage() {
    if (!correctedImage) {
        showToast('No processed image to save', 'error');
        return;
    }

    // Create a canvas to get the image data
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = correctedImage.width;
    canvas.height = correctedImage.height;
    ctx.drawImage(correctedImage, 0, 0);

    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/png');

    // Save to history via API
    const imageData = {
        originalImage: currentImage.src,
        correctedImage: dataUrl,
        cvdType: currentCvdType,
        intensity: correctionIntensity,
        date: new Date().toISOString()
    };

    fetch('/api/history', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(imageData)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to save image');
            }
            return response.json();
        })
        .then(data => {
            showToast('Image saved successfully', 'success');
        })
        .catch(error => {
            console.error('Error saving image:', error);
            showToast('Error saving image: ' + error.message, 'error');
        });

    // Also provide download functionality
    const downloadLink = document.createElement('a');
    downloadLink.href = dataUrl;
    downloadLink.download = `chromavision_${currentCvdType}_${new Date().getTime()}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

/**
 * Reset the current image processing
 */
function resetImage() {
    if (!currentImage) return;

    // Redisplay the original image
    displayImage(currentImage, originalImageContainer);
    correctedImageContainer.innerHTML = '';
    correctedImage = null;

    // Reset analysis if active
    if (analysisActive) {
        selectedPixelCoords = null;
        updateColorBoxes('transparent', 'transparent');
        updateColorInfo('', '', '', '', '', '');
    }

    // Disable save button
    saveBtn.disabled = true;
}

/**
 * Start webcam capture
 */
function startWebcam() {
    if (webcamActive) return;

    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            webcamStream = stream;
            webcamVideo.srcObject = stream;
            webcamVideo.play();
            webcamActive = true;
            toggleWebcamDisplay(true);

            // Update button states
            startWebcamBtn.disabled = true;
            captureWebcamBtn.disabled = false;
            stopWebcamBtn.disabled = false;

            // Hide image display section if it was visible
            document.getElementById('imageDisplaySection').classList.add('d-none');
        })
        .catch(error => {
            console.error('Error accessing webcam:', error);
            showToast('Error accessing webcam: ' + error.message, 'error');
        });
}

/**
 * Toggle between webcam display and image display
 */
function toggleWebcamDisplay(show) {
    if (show) {
        webcamContainer.classList.remove('d-none');
    } else {
        webcamContainer.classList.add('d-none');
    }
}

/**
 * Capture image from webcam
 */
function captureFromWebcam() {
    if (!webcamActive) return;

    const context = webcamCanvas.getContext('2d');

    // Set canvas dimensions to match video
    webcamCanvas.width = webcamVideo.videoWidth;
    webcamCanvas.height = webcamVideo.videoHeight;

    // Draw the current video frame on the canvas
    context.drawImage(webcamVideo, 0, 0, webcamCanvas.width, webcamCanvas.height);

    // Convert canvas to image
    const capturedImage = webcamCanvas.toDataURL('image/png');

    // Load the captured image
    loadImageFromDataURL(capturedImage);

    // Stop webcam after capture
    stopWebcam();
}

/**
 * Stop webcam capture
 */
function stopWebcam() {
    if (!webcamActive) return;

    // Stop all video tracks
    webcamStream.getTracks().forEach(track => track.stop());
    webcamVideo.srcObject = null;
    webcamActive = false;

    // Update button states
    startWebcamBtn.disabled = false;
    captureWebcamBtn.disabled = true;
    stopWebcamBtn.disabled = true;

    // Hide webcam container
    toggleWebcamDisplay(false);
}

/**
 * Toggle color analysis mode
 */
function toggleColorAnalysis() {
    analysisActive = !analysisActive;

    if (analysisActive) {
        toggleAnalysisBtn.textContent = 'Disable Color Analysis';
        toggleAnalysisBtn.classList.remove('btn-primary');
        toggleAnalysisBtn.classList.add('btn-secondary');
        colorAnalysisContainer.classList.remove('d-none');

        // Add cursor indicators to images
        originalImageContainer.classList.add('analysis-cursor');
        correctedImageContainer.classList.add('analysis-cursor');
    } else {
        toggleAnalysisBtn.textContent = 'Enable Color Analysis';
        toggleAnalysisBtn.classList.remove('btn-secondary');
        toggleAnalysisBtn.classList.add('btn-primary');
        colorAnalysisContainer.classList.add('d-none');

        // Remove cursor indicators from images
        originalImageContainer.classList.remove('analysis-cursor');
        correctedImageContainer.classList.remove('analysis-cursor');

        // Reset color analysis display
        selectedPixelCoords = null;
        updateColorBoxes('transparent', 'transparent');
        updateColorInfo('', '', '', '', '', '');
    }
}

/**
 * Handle click on image for color analysis
 */
function handleImageClick(e) {
    if (!analysisActive || !currentImage || !correctedImage) return;

    const canvas = e.target;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Store selected coordinates for later use
    selectedPixelCoords = { x, y };

    // Update color analysis display
    updateSelectedPixelColors(x, y);
}

/**
 * Update the color boxes and text with selected pixel colors
 */
function updateSelectedPixelColors(x, y) {
    // Get original image pixel color
    const originalCanvas = originalImageContainer.querySelector('canvas');
    const originalCtx = originalCanvas.getContext('2d');
    const originalPixel = originalCtx.getImageData(x, y, 1, 1).data;
    const originalColor = `rgb(${originalPixel[0]}, ${originalPixel[1]}, ${originalPixel[2]})`;
    const originalHex = rgbToHex(originalPixel[0], originalPixel[1], originalPixel[2]);

    // Get corrected image pixel color
    const correctedCanvas = correctedImageContainer.querySelector('canvas');
    const correctedCtx = correctedCanvas.getContext('2d');
    const correctedPixel = correctedCtx.getImageData(x, y, 1, 1).data;
    const correctedColor = `rgb(${correctedPixel[0]}, ${correctedPixel[1]}, ${correctedPixel[2]})`;
    const correctedHex = rgbToHex(correctedPixel[0], correctedPixel[1], correctedPixel[2]);

    // Update color boxes
    updateColorBoxes(originalColor, correctedColor);

    // Update color information text
    const originalColorNameText = getApproximateColorName(originalPixel[0], originalPixel[1], originalPixel[2]);
    const correctedColorNameText = getApproximateColorName(correctedPixel[0], correctedPixel[1], correctedPixel[2]);

    updateColorInfo(
        originalHex,
        `RGB(${originalPixel[0]}, ${originalPixel[1]}, ${originalPixel[2]})`,
        originalColorNameText,
        correctedHex,
        `RGB(${correctedPixel[0]}, ${correctedPixel[1]}, ${correctedPixel[2]})`,
        correctedColorNameText
    );
}

/**
 * Update the color boxes with the selected colors
 */
function updateColorBoxes(originalColor, correctedColor) {
    originalColorBox.style.backgroundColor = originalColor;
    correctedColorBox.style.backgroundColor = correctedColor;
}

/**
 * Update the color information text
 */
function updateColorInfo(origHex, origRgb, origName, corrHex, corrRgb, corrName) {
    originalColorHex.textContent = origHex;
    originalColorRgb.textContent = origRgb;
    originalColorName.textContent = origName;

    correctedColorHex.textContent = corrHex;
    correctedColorRgb.textContent = corrRgb;
    correctedColorName.textContent = corrName;
}

/**
 * Convert RGB values to hex color code
 */
function rgbToHex(r, g, b) {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

/**
 * Get an approximate color name from RGB values
 * This is a simplified version - a full implementation would use a color database
 */
function getApproximateColorName(r, g, b) {
    // Basic color detection
    if (r < 30 && g < 30 && b < 30) {
        return 'Black';
    } else if (r > 200 && g > 200 && b > 200) {
        return 'White';
    } else if (r > 200 && g < 70 && b < 70) {
        return 'Red';
    } else if (r < 70 && g > 200 && b < 70) {
        return 'Green';
    } else if (r < 70 && g < 70 && b > 200) {
        return 'Blue';
    } else if (r > 200 && g > 200 && b < 70) {
        return 'Yellow';
    } else if (r > 200 && g < 130 && b > 200) {
        return 'Magenta';
    } else if (r < 70 && g > 200 && b > 200) {
        return 'Cyan';
    } else if (r > 130 && g > 70 && b < 70) {
        return 'Orange';
    } else if (r > 130 && g < 70 && b > 130) {
        return 'Purple';
    } else if (Math.abs(r - g) < 30 && Math.abs(r - b) < 30) {
        return 'Gray';
    } else {
        return 'Unknown';
    }
}

/**
 * Show a toast notification
 */
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');

    // Toast content
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;

    // Add toast to container
    toastContainer.appendChild(toast);

    // Initialize and show the toast
    const bsToast = new bootstrap.Toast(toast, {
        autohide: true,
        delay: 3000
    });
    bsToast.show();

    // Remove toast from DOM after it's hidden
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

/**
 * Export image to different formats
 * Currently only supports PNG, but could be expanded
 */
function exportImage(format = 'png') {
    if (!correctedImage) {
        showToast('No processed image to export', 'error');
        return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = correctedImage.width;
    canvas.height = correctedImage.height;
    ctx.drawImage(correctedImage, 0, 0);

    let mimeType, extension;
    switch (format.toLowerCase()) {
        case 'jpeg':
        case 'jpg':
            mimeType = 'image/jpeg';
            extension = 'jpg';
            break;
        case 'webp':
            mimeType = 'image/webp';
            extension = 'webp';
            break;
        case 'png':
        default:
            mimeType = 'image/png';
            extension = 'png';
            break;
    }

    const dataUrl = canvas.toDataURL(mimeType);
    const downloadLink = document.createElement('a');
    downloadLink.href = dataUrl;
    downloadLink.download = `chromavision_${currentCvdType}_${new Date().getTime()}.${extension}`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

/**
 * Share image via Web Share API if available
 */
function shareImage() {
    if (!correctedImage || !navigator.share) {
        showToast('Sharing not supported on this browser', 'error');
        return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = correctedImage.width;
    canvas.height = correctedImage.height;
    ctx.drawImage(correctedImage, 0, 0);

    canvas.toBlob(blob => {
        const file = new File([blob], `chromavision_${currentCvdType}.png`, { type: 'image/png' });
        navigator.share({
            title: 'ChromaVision Corrected Image',
            text: `Image corrected for ${currentCvdType} with ${Math.round(correctionIntensity * 100)}% intensity`,
            files: [file]
        })
            .then(() => showToast('Image shared successfully', 'success'))
            .catch(error => {
                console.error('Error sharing image:', error);
                showToast('Error sharing image', 'error');
            });
    }, 'image/png');
}

/**
 * Apply a preset correction setting
 */
function applyPreset(preset) {
    switch (preset) {
        case 'deuteranopia-moderate':
            currentCvdType = 'deuteranopia';
            correctionIntensity = 0.6;
            break;
        case 'deuteranopia-strong':
            currentCvdType = 'deuteranopia';
            correctionIntensity = 0.9;
            break;
        case 'protanopia-moderate':
            currentCvdType = 'protanopia';
            correctionIntensity = 0.6;
            break;
        case 'protanopia-strong':
            currentCvdType = 'protanopia';
            correctionIntensity = 0.9;
            break;
        case 'tritanopia-moderate':
            currentCvdType = 'tritanopia';
            correctionIntensity = 0.6;
            break;
        case 'tritanopia-strong':
            currentCvdType = 'tritanopia';
            correctionIntensity = 0.9;
            break;
        default:
            // Default preset
            currentCvdType = 'deuteranopia';
            correctionIntensity = 0.8;
    }

    // Update UI to match preset
    cvdTypeButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.cvdType === currentCvdType) {
            btn.classList.add('active');
        }
    });

    intensitySlider.value = correctionIntensity * 100;
    updateCorrectionIntensity();

    // Process the image with new settings
    if (currentImage) {
        processImage();
    }
}

/**
 * Generate a CVD simulation of the current image
 * Shows how a person with CVD would see the original image
 */
function generateCvdSimulation() {
    if (!currentImage) {
        showToast('No image to simulate', 'error');
        return;
    }

    // Create a canvas for processing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = currentImage.width;
    canvas.height = currentImage.height;
    ctx.drawImage(currentImage, 0, 0);

    // Get image data for processing
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Process the image data for CVD simulation (without correction)
    const simulatedData = simulateCvd(imageData, currentCvdType);

    // Put processed data back on canvas
    ctx.putImageData(simulatedData, 0, 0);

    // Convert canvas to image
    const simulatedImg = new Image();
    simulatedImg.onload = () => {
        // Display simulated image
        const simulationContainer = document.getElementById('simulationContainer');
        if (!simulationContainer) {
            // Create container if it doesn't exist
            const container = document.createElement('div');
            container.id = 'simulationContainer';
            container.className = 'mt-4';
            container.innerHTML = `
                <h4>CVD Simulation (${currentCvdType})</h4>
                <p class="small text-muted">This shows how a person with ${currentCvdType} would see the original image</p>
                <div id="simulationImage" class="border rounded overflow-hidden"></div>
            `;
            document.getElementById('imageDisplaySection').appendChild(container);
        }

        // Display simulated image
        displayImage(simulatedImg, document.getElementById('simulationImage') || simulationContainer);
    };
    simulatedImg.src = canvas.toDataURL('image/png');
}

/**
 * Simulate how a person with CVD would see an image
 */
function simulateCvd(imageData, cvdType) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // Create a copy of the image data
    const simulatedData = new ImageData(
        new Uint8ClampedArray(data),
        width,
        height
    );

    // Get transformation matrices
    const matrices = getCvdTransformationMatrices(cvdType);

    // Process each pixel
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Convert RGB to LMS color space
        const l = matrices.rgbToLms[0][0] * r + matrices.rgbToLms[0][1] * g + matrices.rgbToLms[0][2] * b;
        const m = matrices.rgbToLms[1][0] * r + matrices.rgbToLms[1][1] * g + matrices.rgbToLms[1][2] * b;
        const s = matrices.rgbToLms[2][0] * r + matrices.rgbToLms[2][1] * g + matrices.rgbToLms[2][2] * b;

        // Simulate CVD in LMS space
        let lp, mp, sp;
        if (cvdType === 'protanopia') {
            lp = matrices.protanopia[0][0] * l + matrices.protanopia[0][1] * m + matrices.protanopia[0][2] * s;
            mp = matrices.protanopia[1][0] * l + matrices.protanopia[1][1] * m + matrices.protanopia[1][2] * s;
            sp = matrices.protanopia[2][0] * l + matrices.protanopia[2][1] * m + matrices.protanopia[2][2] * s;
        } else if (cvdType === 'deuteranopia') {
            lp = matrices.deuteranopia[0][0] * l + matrices.deuteranopia[0][1] * m + matrices.deuteranopia[0][2] * s;
            mp = matrices.deuteranopia[1][0] * l + matrices.deuteranopia[1][1] * m + matrices.deuteranopia[1][2] * s;
            sp = matrices.deuteranopia[2][0] * l + matrices.deuteranopia[2][1] * m + matrices.deuteranopia[2][2] * s;
        } else if (cvdType === 'tritanopia') {
            lp = matrices.tritanopia[0][0] * l + matrices.tritanopia[0][1] * m + matrices.tritanopia[0][2] * s;
            mp = matrices.tritanopia[1][0] * l + matrices.tritanopia[1][1] * m + matrices.tritanopia[1][2] * s;
            sp = matrices.tritanopia[2][0] * l + matrices.tritanopia[2][1] * m + matrices.tritanopia[2][2] * s;
        }

        // Convert back to RGB
        let rs = matrices.lmsToRgb[0][0] * lp + matrices.lmsToRgb[0][1] * mp + matrices.lmsToRgb[0][2] * sp;
        let gs = matrices.lmsToRgb[1][0] * lp + matrices.lmsToRgb[1][1] * mp + matrices.lmsToRgb[1][2] * sp;
        let bs = matrices.lmsToRgb[2][0] * lp + matrices.lmsToRgb[2][1] * mp + matrices.lmsToRgb[2][2] * sp;

        // Clamp values to valid RGB range
        rs = Math.max(0, Math.min(255, Math.round(rs)));
        gs = Math.max(0, Math.min(255, Math.round(gs)));
        bs = Math.max(0, Math.min(255, Math.round(bs)));

        // Set simulated RGB values
        simulatedData.data[i] = rs;
        simulatedData.data[i + 1] = gs;
        simulatedData.data[i + 2] = bs;
        // Alpha channel stays the same
    }

    return simulatedData;
}

/**
 * Bulk process multiple images with the same settings
 */
function bulkProcess() {
    const bulkUpload = document.createElement('input');
    bulkUpload.type = 'file';
    bulkUpload.multiple = true;
    bulkUpload.accept = 'image/*';

    bulkUpload.onchange = (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Create modal to show progress
        const modalId = 'bulkProcessModal';
        let modal = document.getElementById(modalId);

        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal fade';
            modal.tabIndex = -1;
            modal.innerHTML = `
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Bulk Processing</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="progress mb-3">
                                <div id="bulkProgressBar" class="progress-bar" role="progressbar" style="width: 0%"></div>
                            </div>
                            <div id="bulkStatus">Processing 0/${files.length} images...</div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // Show modal
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();

        // Process images one by one
        const progressBar = document.getElementById('bulkProgressBar');
        const statusText = document.getElementById('bulkStatus');
        const processedImages = [];
        let processedCount = 0;

        // Process each image
        Array.from(files).forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    // Create canvas for processing
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);

                    // Get image data
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

                    // Process the image
                    const correctedData = applyColorCorrection(imageData, currentCvdType, correctionIntensity);

                    // Put processed data back
                    ctx.putImageData(correctedData, 0, 0);

                    // Save processed image
                    const processedDataUrl = canvas.toDataURL('image/png');
                    processedImages.push({
                        original: event.target.result,
                        corrected: processedDataUrl,
                        name: file.name
                    });

                    // Update progress
                    processedCount++;
                    const progress = Math.round((processedCount / files.length) * 100);
                    progressBar.style.width = `${progress}%`;
                    progressBar.textContent = `${progress}%`;
                    statusText.textContent = `Processing ${processedCount}/${files.length} images...`;

                    // When all images are processed
                    if (processedCount === files.length) {
                        statusText.textContent = 'All images processed! Preparing download...';

                        // Prepare zip file if JSZip is available
                        if (typeof JSZip !== 'undefined') {
                            const zip = new JSZip();
                            processedImages.forEach(img => {
                                // Convert base64 to blob
                                const imageContent = img.corrected.split(',')[1];
                                zip.file(
                                    img.name.replace(/\.[^/.]+$/, '') + `_${currentCvdType}.png`,
                                    imageContent,
                                    { base64: true }
                                );
                            });

                            // Generate zip file
                            zip.generateAsync({ type: 'blob' }).then(content => {
                                const zipUrl = URL.createObjectURL(content);
                                const downloadLink = document.createElement('a');
                                downloadLink.href = zipUrl;
                                downloadLink.download = `chromavision_bulk_${currentCvdType}.zip`;
                                document.body.appendChild(downloadLink);
                                downloadLink.click();
                                document.body.removeChild(downloadLink);

                                // Close modal
                                bsModal.hide();
                                showToast('Bulk processing complete!', 'success');
                            });
                        } else {
                            // If JSZip is not available, provide individual downloads
                            processedImages.forEach(img => {
                                const downloadLink = document.createElement('a');
                                downloadLink.href = img.corrected;
                                downloadLink.download = img.name.replace(/\.[^/.]+$/, '') + `_${currentCvdType}.png`;
                                downloadLink.style.display = 'none';
                                document.body.appendChild(downloadLink);
                                downloadLink.click();
                                document.body.removeChild(downloadLink);
                            });

                            // Close modal
                            bsModal.hide();
                            showToast('Bulk processing complete!', 'success');
                        }
                    }
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    };

    bulkUpload.click();
}


const { isLoggedIn } = require('../middleware');
const ImageHistory = require('../models/imagehistory');
const path = require('path');
const fs = require('fs');
// You may need other imports depending on your setup

// Example dashboard route
router.get('/', isLoggedIn, async (req, res) => {
    try {
        const reprocessImageId = req.query.reprocess;
        let imageToReprocess = null;

        if (reprocessImageId) {
            imageToReprocess = await ImageHistory.findById(reprocessImageId);

            if (!imageToReprocess || imageToReprocess.userId.toString() !== req.user._id.toString()) {
                req.flash('error', 'Image not found or unauthorized');
                return res.redirect('/dashboard');
            }
        }

        res.render('dashboard', {
            title: 'Dashboard',
            activeTab: 'dashboard',
            imageToReprocess,
            currentUser: req.user
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Failed to load dashboard');
        res.redirect('/');
    }
});



// Process image and save to history
router.post('/process-image', isLoggedIn, async (req, res) => {
    try {
        // Your existing image processing logic
        const { originalImageUrl, processedImageUrl, cvdType, metadata } = req.body;

        // Save to history
        const imageHistory = new ImageHistory({
            userId: req.user._id,
            originalImageUrl,
            processedImageUrl,
            cvdType,
            metadata
        });

        await imageHistory.save();

        res.json({
            success: true,
            processedImageUrl,
            historyId: imageHistory._id
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Failed to process image'
        });
    }
});

const imageController = require('../controllers/imageController');
// // Middleware to check if user is logged in
// function isLoggedIn(req, res, next) {
//     if (!req.isAuthenticated()) {
//         req.flash('error', 'You must be signed in');
//         return res.redirect('/login');
//     }
//     next();
// }

// Show dashboard
router.get('/', isLoggedIn, (req, res) => {
    res.render('dashboard');
});

// API endpoint to save processed image
router.post('/save-image', isLoggedIn, imageController.saveProcessedImage);



// Function to save the images to history
async function saveToHistory() {
    try {
        // Check if we have both images
        const originalImage = document.getElementById('originalImage');
        const processedImage = document.getElementById('processedImage');

        if (originalImage.src.includes('placeholder-image.jpg') ||
            processedImage.src.includes('placeholder-image.jpg')) {
            alert('Please process an image first');
            return;
        }

        // Get selected CVD type
        const cvdTypeSelect = document.getElementById('cvdTypeSelect');
        const cvdType = cvdTypeSelect.value;

        // Convert images to blobs and create FormData
        const formData = new FormData();

        // Get original image
        const originalBlob = await fetch(originalImage.src).then(r => r.blob());
        formData.append('originalImage', new File([originalBlob], 'original.jpg', { type: 'image/jpeg' }));

        // Get processed image
        const processedBlob = await fetch(processedImage.src).then(r => r.blob());
        formData.append('processedImage', new File([processedBlob], 'processed.jpg', { type: 'image/jpeg' }));

        // Add other required data
        formData.append('cvdType', cvdType);

        // Optional metadata
        const metadata = {
            mode: document.getElementById('correction').checked ? 'correction' : 'simulation'
        };
        formData.append('metadata', JSON.stringify(metadata));

        // Display loading indicator
        const saveButton = document.getElementById('saveButton');
        const originalText = saveButton.textContent;
        saveButton.disabled = true;
        saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';

        // Send the request
        const response = await fetch('/history/save', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            alert('Image saved to history successfully!');
        } else {
            alert('Failed to save image: ' + result.message);
        }
    } catch (error) {
        console.log(error);
    }
}

module.exports = router;
