document.getElementById('fileInput').addEventListener('change', handleFileSelect, false);

let imageUrls = [];

document.querySelectorAll('#backgroundColor, #hOffset, #vOffset, #blur, #border').forEach(input => {
    input.addEventListener('input', () => {
        if (imageUrls.length > 0) {
            displayPreviews(imageUrls);
        }
    });
});

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imageUrls = e.target.result.split('\n').map(url => url.trim()).filter(url => url);
            displayPreviews(imageUrls);
        };
        reader.readAsText(file);
    }
}

function displayPreviews(urls) {
    const container = document.getElementById('imageContainer');
    container.innerHTML = ''; // Clear previous images
    
    const backgroundColor = document.getElementById('backgroundColor').value;
    const hOffset = parseInt(document.getElementById('hOffset').value);
    const vOffset = parseInt(document.getElementById('vOffset').value);
    const blur = parseInt(document.getElementById('blur').value);
    const borderSize = parseInt(document.getElementById('border').value);
    const previewSize = 500;
    const finalSize = 1036;

    urls.forEach(url => {
        const wrapper = document.createElement('div');
        wrapper.className = 'image-wrapper';

        const img = new Image();
        img.src = url;
        img.crossOrigin = 'anonymous'; // Enable cross-origin for image manipulation
        img.onload = () => {
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
            previewContext.shadowOffsetX = hOffset * (previewSize / finalSize);
            previewContext.shadowOffsetY = vOffset * (previewSize / finalSize);
            previewContext.shadowBlur = blur * (previewSize / finalSize);
            previewContext.shadowColor = 'rgba(0, 0, 0, 0.5)';

            // Draw image for preview with borders and centered
            const previewBorderSize = borderSize * (previewSize / finalSize);
            const previewXOffset = (previewSize - scaledWidth * (previewSize / finalSize)) / 2;
            const previewYOffset = (previewSize - scaledHeight * (previewSize / finalSize)) / 2;
            previewContext.drawImage(img, previewXOffset, previewYOffset, scaledWidth * (previewSize / finalSize), scaledHeight * (previewSize / finalSize));

            // Append preview canvas to container
            wrapper.appendChild(previewCanvas);
            container.appendChild(wrapper);
        };
    });
    document.getElementById('downloadAllLink').style.display = 'block';
}

document.getElementById('downloadAllLink').addEventListener('click', () => {
    if (imageUrls.length > 0) {
        generateFinalImages(imageUrls);
    }
});

function generateFinalImages(urls) {
    const zip = new JSZip();
    const imagesFolder = zip.folder("images");

    const backgroundColor = document.getElementById('backgroundColor').value;
    const hOffset = parseInt(document.getElementById('hOffset').value);
    const vOffset = parseInt(document.getElementById('vOffset').value);
    const blur = parseInt(document.getElementById('blur').value);
    const borderSize = parseInt(document.getElementById('border').value);
    const finalSize = 1036;

    let processedImages = 0;
    const totalImages = urls.length;

    urls.forEach(url => {
        const img = new Image();
        img.src = url;
        img.crossOrigin = 'anonymous'; // Enable cross-origin for image manipulation
        img.onload = () => {
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
            downloadContext.shadowOffsetX = hOffset;
            downloadContext.shadowOffsetY = vOffset;
            downloadContext.shadowBlur = blur;
            downloadContext.shadowColor = 'rgba(0, 0, 0, 0.5)';

            // Draw image for download with borders and centered
            downloadContext.drawImage(img, xOffset, yOffset, scaledWidth, scaledHeight);

            // Convert download canvas to blob and add to zip
            downloadCanvas.toBlob(blob => {
                const fileName = url.split('/').pop().replace(/\.[^/.]+$/, "") + ".png"; // Ensure PNG extension
                imagesFolder.file(fileName, blob, { type: 'image/png' }); // Ensure lossless PNG format
                processedImages++;
                if (processedImages === totalImages) {
                    zip.generateAsync({ type: "blob" }).then(content => {
                        saveAs(content, "images.zip");
                    });
                }
            }, 'image/png'); // Ensure lossless PNG format
        };

        img.onerror = () => {
            console.error(`Failed to load image from URL: ${url}`);
            processedImages++;
            if (processedImages === totalImages) {
                zip.generateAsync({ type: "blob" }).then(content => {
                    saveAs(content, "images.zip");
                });
            }
        };
    });
}
