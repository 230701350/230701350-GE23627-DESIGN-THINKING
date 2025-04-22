// ChromaVision Image Processor
// Handles CVD correction and simulation using color transformation matrices

// Color transformation matrices
const transformationMatrices = {
    // Correction matrices (based on scientific research)
    correction: {
        Protanopia: [
            [0, 2.02344, -2.52581],
            [0, 1, 0],
            [0, 0, 1]
        ],
        Deuteranopia: [
            [1, 0, 0],
            [0.494207, 0, 1.24827],
            [0, 0, 1]
        ],
        Tritanopia: [
            [1, 0, 0],
            [0, 1, 0],
            [-0.395913, 0.801109, 0]
        ]
    },
    // Simulation matrices (to simulate how people with CVD see)
    simulation: {
        Protanopia: [
            [0.567, 0.433, 0],
            [0.558, 0.442, 0],
            [0, 0.242, 0.758]
        ],
        Deuteranopia: [
            [0.625, 0.375, 0],
            [0.7, 0.3, 0],
            [0, 0.3, 0.7]
        ],
        Tritanopia: [
            [0.95, 0.05, 0],
            [0, 0.433, 0.567],
            [0, 0.475, 0.525]
        ]
    }
};

// Main processing class
class ImageProcessor {
    constructor() {
        this.cvdType = 'Deuteranopia';
        this.mode = 'correction';
        this.originalImage = null;
        this.processedImage = null;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');

        // Initialize event listeners
        this.initEventListeners();
    }

    initEventListeners() {
        // CVD Type selector
        document.getElementById('cvdTypeSelect').addEventListener('change', (e) => {
            this.cvdType = e.target.value;
            if (this.originalImage) {
                this.processImage();
            }
        });

        // Mode selection (correction or simulation)
        document.querySelectorAll('input[name="options"]').forEach(option => {
            option.addEventListener('change', (e) => {
                this.mode = e.target.id;
                if (this.originalImage) {
                    this.processImage();
                }
            });
        });

        // Image upload
        document.getElementById('imageUpload').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        this.originalImage = img;
                        this.displayOriginalImage();
                        this.processImage();
                        this.enableButtons();
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        // Download button
        document.getElementById('downloadButton').addEventListener('click', () => {
            this.downloadImage();
        });

        // Share button
        document.getElementById('shareButton').addEventListener('click', () => {
            this.shareImage();
        });

        // Pixel analysis through clicking on images
        document.getElementById('originalImage').addEventListener('click', (e) => {
            this.analyzePixel(e, 'original');
        });

        document.getElementById('processedImage').addEventListener('click', (e) => {
            this.analyzePixel(e, 'processed');
        });
    }

    displayOriginalImage() {
        const originalImageElement = document.getElementById('originalImage');
        originalImageElement.src = this.originalImage.src;
        originalImageElement.style.display = 'block';
    }

    processImage() {
        // Set canvas dimensions to match image
        this.canvas.width = this.originalImage.width;
        this.canvas.height = this.originalImage.height;

        // Draw original image on canvas
        this.ctx.drawImage(this.originalImage, 0, 0);

        // Get image data
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;

        // Select the appropriate transformation matrix
        const matrix = transformationMatrices[this.mode][this.cvdType];

        // Process each pixel
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Apply transformation matrix
            data[i] = this.clamp(r * matrix[0][0] + g * matrix[0][1] + b * matrix[0][2]);
            data[i + 1] = this.clamp(r * matrix[1][0] + g * matrix[1][1] + b * matrix[1][2]);
            data[i + 2] = this.clamp(r * matrix[2][0] + g * matrix[2][1] + b * matrix[2][2]);
            // Alpha channel remains unchanged
        }

        // Put processed image data back to canvas
        this.ctx.putImageData(imageData, 0, 0);

        // Display processed image
        const processedImage = document.getElementById('processedImage');
        processedImage.src = this.canvas.toDataURL('image/png');
        processedImage.style.display = 'block';

        // Store processed image for later use
        this.processedImage = processedImage.src;
    }

    // Helper function to keep RGB values within valid range
    clamp(value) {
        return Math.max(0, Math.min(255, Math.round(value)));
    }

    enableButtons() {
        document.getElementById('saveButton').disabled = false;
        document.getElementById('downloadButton').disabled = false;
        document.getElementById('shareButton').disabled = false;
        document.getElementById('addToHistoryBtn').disabled = false;

    }

    saveResult() {
        fetch('/dashboard/save-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                originalImage: this.originalImage.src,
                processedImage: this.processedImage,
                processType: this.cvdType,
                mode: this.mode
            })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Image saved to your history!');
                } else {
                    alert('Failed to save image. Please try again.');
                }
            })
            .catch(error => {
                console.error('Error saving image:', error);
                alert('An error occurred while saving the image.');
            });
    }

    downloadImage() {
        const link = document.createElement('a');
        link.download = `chromavision-${this.cvdType.toLowerCase()}-${this.mode}.png`;
        link.href = this.processedImage;
        link.click();
    }

    shareImage() {
        // Check if Web Share API is available
        if (navigator.share) {
            fetch(this.processedImage)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], `chromavision-${this.cvdType.toLowerCase()}-${this.mode}.png`, { type: 'image/png' });
                    navigator.share({
                        title: 'ChromaVision Image',
                        text: `Image processed with ChromaVision for ${this.cvdType}`,
                        files: [file]
                    })
                        .catch(err => {
                            console.error('Error sharing:', err);
                            this.fallbackShare();
                        });
                });
        } else {
            this.fallbackShare();
        }
    }

    fallbackShare() {
        // Fallback for browsers that don't support Web Share API
        const shareUrl = `mailto:?subject=ChromaVision Image&body=Check out this image I processed with ChromaVision for ${this.cvdType}.`;
        window.open(shareUrl);
    }

    analyzePixel(event, imageType) {
        const img = document.getElementById(imageType === 'original' ? 'originalImage' : 'processedImage');
        const rect = img.getBoundingClientRect();

        // Calculate click position on image
        const x = Math.floor((event.clientX - rect.left) * (img.naturalWidth / rect.width));
        const y = Math.floor((event.clientY - rect.top) * (img.naturalHeight / rect.height));

        // Create a temporary canvas to read pixel data
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = img.naturalWidth;
        tempCanvas.height = img.naturalHeight;
        tempCtx.drawImage(img, 0, 0);

        // Get pixel data
        const pixelData = tempCtx.getImageData(x, y, 1, 1).data;
        const r = pixelData[0];
        const g = pixelData[1];
        const b = pixelData[2];

        // Convert to hex and get color name
        const hexColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        const colorName = this.getApproximateColorName(r, g, b);

        // Display color information
        if (imageType === 'original') {
            const originalColorSample = document.getElementById('originalColorSample');
            originalColorSample.style.backgroundColor = hexColor;

            const originalColorValue = document.getElementById('originalColorValue');
            originalColorValue.textContent = `${colorName} (RGB: ${r},${g},${b}, Hex: ${hexColor})`;

            // If we already have a processed image, find the corresponding pixel
            if (this.processedImage) {
                // Create another temporary canvas for processed image
                const procImg = document.getElementById('processedImage');
                const procCanvas = document.createElement('canvas');
                const procCtx = procCanvas.getContext('2d');
                procCanvas.width = procImg.naturalWidth;
                procCanvas.height = procImg.naturalHeight;
                procCtx.drawImage(procImg, 0, 0);

                // Get pixel data from the same position
                const procPixelData = procCtx.getImageData(x, y, 1, 1).data;
                const procR = procPixelData[0];
                const procG = procPixelData[1];
                const procB = procPixelData[2];

                // Convert to hex and get color name
                const procHexColor = `#${procR.toString(16).padStart(2, '0')}${procG.toString(16).padStart(2, '0')}${procB.toString(16).padStart(2, '0')}`;
                const procColorName = this.getApproximateColorName(procR, procG, procB);

                // Display the processed color
                const correctedColorSample = document.getElementById('correctedColorSample');
                correctedColorSample.style.backgroundColor = procHexColor;

                const correctedColorValue = document.getElementById('correctedColorValue');
                correctedColorValue.textContent = `${procColorName} (RGB: ${procR},${procG},${procB}, Hex: ${procHexColor})`;
            }
        } else {
            // If we clicked on processed image, just update that part
            const correctedColorSample = document.getElementById('correctedColorSample');
            correctedColorSample.style.backgroundColor = hexColor;

            const correctedColorValue = document.getElementById('correctedColorValue');
            correctedColorValue.textContent = `${colorName} (RGB: ${r},${g},${b}, Hex: ${hexColor})`;
        }
    }

    // Simple color name approximation
    getApproximateColorName(r, g, b) {
        // Basic color detection - this can be expanded with more sophisticated color naming
        if (r < 30 && g < 30 && b < 30) return 'Black';
        if (r > 220 && g > 220 && b > 220) return 'White';

        if (r > 200 && g < 100 && b < 100) return 'Red';
        if (r < 100 && g > 200 && b < 100) return 'Green';
        if (r < 100 && g < 100 && b > 200) return 'Blue';

        if (r > 200 && g > 200 && b < 100) return 'Yellow';
        if (r > 200 && g < 100 && b > 200) return 'Magenta';
        if (r < 100 && g > 200 && b > 200) return 'Cyan';

        if (r > 180 && g > 100 && b < 100) return 'Orange';
        if (r > 100 && g < 100 && b > 180) return 'Purple';
        if (r < 100 && g > 100 && b < 100) return 'Forest Green';

        return 'Mixed Color';
    }
}

// Initialize the image processor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.imageProcessor = new ImageProcessor();
});