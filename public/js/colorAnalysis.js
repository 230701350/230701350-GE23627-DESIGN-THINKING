// ChromaVision Color Analysis
// Handles detailed pixel-level color information

class ColorAnalyzer {
    constructor() {
        // Color name mapping with RGB ranges
        this.colorNames = [
            // Reds
            { name: "Maroon", r: [128, 0, 0], range: 30 },
            { name: "Crimson", r: [220, 20, 60], range: 30 },
            { name: "Red", r: [255, 0, 0], range: 30 },
            { name: "Tomato", r: [255, 99, 71], range: 25 },
            { name: "Coral", r: [255, 127, 80], range: 25 },

            // Oranges
            { name: "Orange Red", r: [255, 69, 0], range: 25 },
            { name: "Dark Orange", r: [255, 140, 0], range: 25 },
            { name: "Orange", r: [255, 165, 0], range: 25 },

            // Yellows
            { name: "Gold", r: [255, 215, 0], range: 25 },
            { name: "Yellow", r: [255, 255, 0], range: 25 },
            { name: "Light Yellow", r: [255, 255, 224], range: 20 },

            // Greens
            { name: "Lawn Green", r: [124, 252, 0], range: 25 },
            { name: "Chartreuse", r: [127, 255, 0], range: 25 },
            { name: "Lime Green", r: [50, 205, 50], range: 25 },
            { name: "Forest Green", r: [34, 139, 34], range: 25 },
            { name: "Green", r: [0, 128, 0], range: 25 },
            { name: "Dark Green", r: [0, 100, 0], range: 25 },
            { name: "Olive", r: [128, 128, 0], range: 25 },

            // Cyans
            { name: "Teal", r: [0, 128, 128], range: 25 },
            { name: "Cyan", r: [0, 255, 255], range: 25 },
            { name: "Light Cyan", r: [224, 255, 255], range: 20 },

            // Blues
            { name: "Steel Blue", r: [70, 130, 180], range: 25 },
            { name: "Royal Blue", r: [65, 105, 225], range: 25 },
            { name: "Blue", r: [0, 0, 255], range: 25 },
            { name: "Navy", r: [0, 0, 128], range: 25 },
            { name: "Midnight Blue", r: [25, 25, 112], range: 25 },

            // Purples & Pinks
            { name: "Indigo", r: [75, 0, 130], range: 25 },
            { name: "Purple", r: [128, 0, 128], range: 25 },
            { name: "Fuchsia", r: [255, 0, 255], range: 25 },
            { name: "Pink", r: [255, 192, 203], range: 25 },
            { name: "Hot Pink", r: [255, 105, 180], range: 25 },

            // Browns
            { name: "Brown", r: [165, 42, 42], range: 25 },
            { name: "Chocolate", r: [210, 105, 30], range: 25 },
            { name: "Peru", r: [205, 133, 63], range: 25 },
            { name: "Sandy Brown", r: [244, 164, 96], range: 20 },

            // Whites & Grays
            { name: "White", r: [255, 255, 255], range: 15 },
            { name: "Snow", r: [255, 250, 250], range: 15 },
            { name: "Light Gray", r: [211, 211, 211], range: 20 },
            { name: "Silver", r: [192, 192, 192], range: 20 },
            { name: "Dark Gray", r: [169, 169, 169], range: 20 },
            { name: "Gray", r: [128, 128, 128], range: 25 },
            { name: "Dim Gray", r: [105, 105, 105], range: 20 },
            { name: "Black", r: [0, 0, 0], range: 25 }
        ];
    }

    // Get precise color name based on RGB values
    getColorName(r, g, b) {
        // Convert to array for distance calculation
        const targetColor = [r, g, b];

        // Find the closest color by Euclidean distance
        let closestColor = "Unknown";
        let minDistance = Infinity;

        this.colorNames.forEach(color => {
            const distance = this.colorDistance(targetColor, color.r);
            if (distance < minDistance && distance <= color.range) {
                minDistance = distance;
                closestColor = color.name;
            }
        });

        return closestColor;
    }

    // Calculate Euclidean distance between two colors
    colorDistance(color1, color2) {
        return Math.sqrt(
            Math.pow(color1[0] - color2[0], 2) +
            Math.pow(color1[1] - color2[1], 2) +
            Math.pow(color1[2] - color2[2], 2)
        );
    }

    // Analyze the color for educational purposes
    analyzeColorForCVD(r, g, b, cvdType) {
        let analysis = '';

        switch (cvdType) {
            case 'Protanopia':
                if (r > g && r > b) {
                    analysis = 'This red-dominant color may appear darker and more yellow-brown to someone with Protanopia.';
                } else if (g > r && g > b) {
                    analysis = 'This green-dominant color might be confused with yellowish colors by someone with Protanopia.';
                }
                break;

            case 'Deuteranopia':
                if (g > r && g > b) {
                    analysis = 'This green-dominant color may appear more beige or grayish to someone with Deuteranopia.';
                } else if (r > g && r > b) {
                    analysis = 'This red-dominant color might be confused with brown or yellow-green by someone with Deuteranopia.';
                }
                break;

            case 'Tritanopia':
                if (b > r && b > g) {
                    analysis = 'This blue-dominant color may appear greenish to someone with Tritanopia.';
                } else if (g > r && g > b) {
                    analysis = 'This green-dominant color might be confused with blue by someone with Tritanopia.';
                }
                break;
        }

        return analysis || 'This color might appear differently depending on the type of color vision deficiency.';
    }
}

// Initialize color analyzer
document.addEventListener('DOMContentLoaded', () => {
    window.colorAnalyzer = new ColorAnalyzer();

    // Override the simple color name function in imageProcessor with our detailed one
    if (window.imageProcessor) {
        window.imageProcessor.getApproximateColorName = function (r, g, b) {
            return window.colorAnalyzer.getColorName(r, g, b);
        };
    }
});

// Add this to your existing colorAnalysis.js file
// This will update the color boxes when a pixel is analyzed
function updateColorBoxes(originalColor, correctedColor) {
    const originalColorBox = document.getElementById('originalColorBox');
    const correctedColorBox = document.getElementById('correctedColorBox');

    if (originalColorBox && originalColor) {
        originalColorBox.style.backgroundColor = originalColor;
    }

    if (correctedColorBox && correctedColor) {
        correctedColorBox.style.backgroundColor = correctedColor;
    }
}

// Find where you update the color values in your existing code
// and add this line after you update the originalColorValue and correctedColorValue:
// updateColorBoxes(originalColorHex, correctedColorHex);

// Add this function to your colorAnalysis.js file
function updatePixelColorDisplay(originalRgb, correctedRgb) {
    // Get DOM elements
    const originalColorSample = document.getElementById('originalColorSample');
    const correctedColorSample = document.getElementById('correctedColorSample');
    const originalColorValue = document.getElementById('originalColorValue');
    const correctedColorValue = document.getElementById('correctedColorValue');
    const originalColorName = document.getElementById('originalColorName');
    const correctedColorName = document.getElementById('correctedColorName');

    if (!originalColorSample || !correctedColorSample) return;

    // Extract RGB values
    const origR = originalRgb[0], origG = originalRgb[1], origB = originalRgb[2];
    const corrR = correctedRgb[0], corrG = correctedRgb[1], corrB = correctedRgb[2];

    // Format RGB to hex
    const originalHex = rgbToHex(origR, origG, origB);
    const correctedHex = rgbToHex(corrR, corrG, corrB);

    // Get color names
    const originalName = window.colorAnalyzer.getColorName(origR, origG, origB);
    const correctedName = window.colorAnalyzer.getColorName(corrR, corrG, corrB);

    // Update color samples
    originalColorSample.style.backgroundColor = originalHex;
    correctedColorSample.style.backgroundColor = correctedHex;

    // Update color values
    originalColorValue.textContent = originalHex;
    correctedColorValue.textContent = correctedHex;

    // Update color names
    originalColorName.textContent = originalName;
    correctedColorName.textContent = correctedName;
}

// Helper function to convert RGB to hex
function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}