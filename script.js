document.getElementById('fileInput').addEventListener('change', handleFileSelect, false);

let imageUrls = [];
let cachedImages = {}; // Object to store loaded images

document.querySelectorAll('#backgroundColor, #hOffset, #vOffset, #blur, #border, #roundCorners, #roundness').forEach(input => {
    input.addEventListener('input', () => {
        updateSliderValues();
        if (imageUrls.length > 0) {
            displayPreviews();
        }
    });
});

document.getElementById('roundCorners').addEventListener('change', () => {
    const roundnessGroup = document.getElementById('roundnessGroup');
    if (document.getElementById('roundCorners').checked) {
        roundnessGroup.style.display = 'flex';
    } else {
        roundnessGroup.style.display = 'none';
    }
    if (imageUrls.length > 0) {
        displayPreviews();
    }
});

function updateSliderValues() {
    document.getElementById('hOffsetValue').innerText = document.getElementById('hOffset').value;
    document.getElementById('vOffsetValue').innerText = document.getElementById('vOffset').value;
    document.getElementById('blurValue').innerText = document.getElementById('blur').value;
    document.getElementById('borderValue').innerText = document.getElementById('border').value;
    document.getElementById('roundnessValue').innerText = document.getElementById('roundness').value;
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imageUrls = e.target.result.split('\n').map(url => url.trim()).filter(url => url);
            loadAllImages().then(() => displayPreviews());
        };
        reader.readAsText(file);
    }
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function loadImage(url) {
    return new Promise((resolve, reject) => {
        if (cachedImages[url]) {
            resolve(cachedImages[url]);
        } else {
            const img = new Image();
            img.crossOrigin = 'anonymous'; // Enable cross-origin for image manipulation
            img.src = url;
            img.onload = () => {
                cachedImages[url] = img;
                resolve(img);
            };
            img.onerror = () => reject(`Failed to load image from URL: ${url}`);
        }
    });
}

async function loadAllImages() {
    const loadPromises = imageUrls.map(url => loadImage(url));
    await Promise.all(loadPromises);
}

async function displayPreviews() {
    const container = document.getElementById('imageContainer');
    container.innerHTML = ''; // Clear previous images
    
    const backgroundColor = document.getElementById('backgroundColor').value;
    const hOffset = parseInt(document.getElementById('hOffset').value);
    const vOffset = parseInt(document.getElementById('vOffset').value);
    const blur = parseInt(document.getElementById('blur').value);
    const borderSize = parseInt(document.getElementById('border').value);
    const roundCorners = document.getElementById('roundCorners').checked;
    const roundness = parseInt(document.getElementById('roundness').value);
    const previewSize = 500;
    const finalSize = 1036;

    for (const url of imageUrls) {
        try {
            const img = await loadImage(url);

            // Calculate dimensions while maintaining aspect ratio
            const scale = Math.min((finalSize - 2 * borderSize) / img.width, (finalSize - 2 * borderSize) / img.height);
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;

            // Create canvas for preview
            const previewCanvas = document.createElement('canvas');
            const previewContext = previewCanvas.getContext('2d');
            
            // Set preview canvas size
            previewCanvas.width = previewSize;
            previewCanvas.height = previewSize;

            // Enable high-quality image smoothing
            previewContext.imageSmoothingEnabled = true;
            previewContext.imageSmoothingQuality = 'high';

            // Fill background color for preview
            previewContext.fillStyle = backgroundColor;
            previewContext.fillRect(0, 0, previewCanvas.width, previewCanvas.height);

            // Draw shadow for preview
            previewContext.save();
            previewContext.shadowOffsetX = hOffset * (previewSize / finalSize);
            previewContext.shadowOffsetY = vOffset * (previewSize / finalSize);
            previewContext.shadowBlur = blur * (previewSize / finalSize);
            previewContext.shadowColor = 'rgba(0, 0, 0, 0.5)';
            previewContext.fillStyle = 'white';
            const previewBorderSize = borderSize * (previewSize / finalSize);
            const previewXOffset = (previewSize - scaledWidth * (previewSize / finalSize)) / 2;
            const previewYOffset = (previewSize - scaledHeight * (previewSize / finalSize)) / 2;

            if (roundCorners) {
                drawRoundedRect(previewContext, previewXOffset, previewYOffset, scaledWidth * (previewSize / finalSize), scaledHeight * (previewSize / finalSize), roundness * (previewSize / finalSize));
            } else {
                previewContext.fillRect(previewXOffset, previewYOffset, scaledWidth * (previewSize / finalSize), scaledHeight * (previewSize / finalSize));
            }
            previewContext.fill();
            previewContext.restore();

            // Draw image for preview with borders and centered
            if (roundCorners) {
                drawRoundedRect(previewContext, previewXOffset, previewYOffset, scaledWidth * (previewSize / finalSize), scaledHeight * (previewSize / finalSize), roundness * (previewSize / finalSize));
                previewContext.clip();
            }

            previewContext.drawImage(img, previewXOffset, previewYOffset, scaledWidth * (previewSize / finalSize), scaledHeight * (previewSize / finalSize));

            // Append preview canvas to container
            const wrapper = document.createElement('div');
            wrapper.className = 'image-wrapper';
            wrapper.appendChild(previewCanvas);
            container.appendChild(wrapper);

        } catch (error) {
            console.error(error);
        }
    }

    document.getElementById('downloadAllLink').style.display = 'block';
}

document.getElementById('downloadAllLink').addEventListener('click', () => {
    if (imageUrls.length > 0) {
        generateFinalImages();
    }
});

async function generateFinalImages() {
    const zip = new JSZip();
    const imagesFolder = zip.folder("images");

    const backgroundColor = document.getElementById('backgroundColor').value;
    const hOffset = parseInt(document.getElementById('hOffset').value);
    const vOffset = parseInt(document.getElementById('vOffset').value);
    const blur = parseInt(document.getElementById('blur').value);
    const borderSize = parseInt(document.getElementById('border').value);
    const roundCorners = document.getElementById('roundCorners').checked;
    const roundness = parseInt(document.getElementById('roundness').value);
    const finalSize = 1036;

    let processedImages = 0;
    const totalImages = imageUrls.length;

    for (const url of imageUrls) {
        try {
            const img = await loadImage(url);

            // Calculate dimensions while maintaining aspect ratio
            const scale = Math.min((finalSize - 2 * borderSize) / img.width, (finalSize - 2 * borderSize) / img.height);
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;
            const xOffset = (finalSize - scaledWidth) / 2;
            const yOffset = (finalSize - scaledHeight) / 2;

            // Create canvas for download
            const downloadCanvas = document.createElement('canvas');
            const downloadContext = downloadCanvas.getContext('2d');
            
            // Set download canvas size
            downloadCanvas.width = finalSize;
            downloadCanvas.height = finalSize;

            // Enable high-quality image smoothing
            downloadContext.imageSmoothingEnabled = true;
            downloadContext.imageSmoothingQuality = 'high';

            // Fill background color for download
            downloadContext.fillStyle = backgroundColor;
            downloadContext.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);

            // Draw shadow for download
            downloadContext.save();
            downloadContext.shadowOffsetX = hOffset;
            downloadContext.shadowOffsetY = vOffset;
            downloadContext.shadowBlur = blur;
            downloadContext.shadowColor = 'rgba(0, 0, 0, 0.5)';
            downloadContext.fillStyle = 'white';
            if (roundCorners) {
                drawRoundedRect(downloadContext, xOffset, yOffset, scaledWidth, scaledHeight, roundness);
            } else {
                downloadContext.fillRect(xOffset, yOffset, scaledWidth, scaledHeight);
            }
            downloadContext.fill();
            downloadContext.restore();

            // Draw image for download with borders and centered
            if (roundCorners) {
                drawRoundedRect(downloadContext, xOffset, yOffset, scaledWidth, scaledHeight, roundness);
                downloadContext.clip();
            }

            downloadContext.drawImage(img, xOffset, yOffset, scaledWidth, scaledHeight);

            // Convert download canvas to blob and add to zip
            const blob = await new Promise(resolve => downloadCanvas.toBlob(resolve, 'image/png'));
            const fileName = url.split('/').pop().replace(/\.[^/.]+$/, "") + ".png"; // Ensure PNG extension
            imagesFolder.file(fileName, blob, { type: 'image/png' }); // Ensure lossless PNG format

            processedImages++;
            if (processedImages === totalImages) {
                const content = await zip.generateAsync({ type: "blob" });
                saveAs(content, "images.zip");
            }
        } catch (error) {
            console.error(error);
            processedImages++;
            if (processedImages === totalImages) {
                const content = await zip.generateAsync({ type: "blob" });
                saveAs(content, "images.zip");
            }
        }
    }
}
