// // DOM Elements
// document.addEventListener('DOMContentLoaded', () => {
//     // Initialize the history page
//     initHistoryPage();
// });

// // Run batch operations setup
// document.addEventListener('DOMContentLoaded', () => {
//     setupBatchOperations();
// });


// public/js/history-client.js
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the history page
    initHistoryPage();
    // Setup batch operations
    setupBatchOperations();
});

// Function to initialize the history page
async function initHistoryPage() {
    const imageGallery = document.getElementById('imageGallery');
    const loadingSpinner = document.getElementById('loadingSpinner');

    if (!imageGallery) return;

    try {
        // Show loading spinner
        if (loadingSpinner) loadingSpinner.style.display = 'flex';

        // Fetch image history from the API
        const response = await fetch('/history/api/images');
        const data = await response.json();

        // Hide loading spinner
        if (loadingSpinner) loadingSpinner.style.display = 'none';

        if (data.success && data.images.length > 0) {
            // Render the images
            imageGallery.innerHTML = data.images.map(image => createImageCard(image)).join('');

            // Add event listeners for image cards
            setupImageCardListeners();
        } else {
            // Show no images message
            imageGallery.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info">
                        You haven't processed any images yet. Go to the Dashboard to process images.
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading image history:', error);

        // Hide loading spinner
        if (loadingSpinner) loadingSpinner.style.display = 'none';

        // Show error message
        imageGallery.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    Failed to load image history. Please try refreshing the page.
                </div>
            </div>
        `;
    }
}

// // Function to create an image card HTML
// function createImageCard(image) {
//     const processedDate = new Date(image.processedDate).toLocaleDateString();

//     return `
//         <div class="col-sm-6 col-md-4 col-lg-3 mb-4">
//             <div class="card h-100" data-image-id="${image._id}">
//                 <div class="card-img-top">
//                     <img src="${image.processedImageUrl}" alt="Processed Image">
//                 </div>
//                 <div class="card-body">
//                     <h5 class="card-title">
//                         ${image.metadata.title || 'Processed Image'}
//                     </h5>
//                     <p class="card-text">
//                         <small class="text-muted">
//                             Type: ${image.cvdType}<br>
//                             Date: ${processedDate}
//                         </small>
//                     </p>
//                 </div>
//                 <div class="card-footer d-flex justify-content-between align-items-center">
//                     <button class="btn btn-sm btn-primary view-image-btn">View</button>
//                     <div class="form-check">
//                         <input class="form-check-input select-image-check" type="checkbox" value="${image._id}">
//                         <label class="form-check-label">Select</label>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     `;
// }


function createImageCard(image) {
    const processedDate = new Date(image.processedDate).toLocaleDateString();

    return `
        <div class="col-sm-6 col-md-4 col-lg-3 mb-4">
            <div class="card h-100" data-image-id="${image._id}">
                <div class="card-img-top image-container">
                    <img src="${image.processedImageUrl}" 
                         alt="Processed Image" 
                         class="img-fluid"
                         onerror="this.onerror=null; this.src='/images/image-placeholder.png'; this.classList.add('img-error');"
                         onload="this.classList.add('img-loaded')">
                    <div class="image-loading-overlay">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <h5 class="card-title">
                        ${image.metadata && image.metadata.title ? image.metadata.title : 'Processed Image'}
                    </h5>
                    <p class="card-text">
                        <small class="text-muted">
                            Type: ${image.cvdType}<br>
                            Date: ${processedDate}
                        </small>
                    </p>
                </div>
                <div class="card-footer d-flex justify-content-between align-items-center">
                    <button class="btn btn-sm btn-primary view-image-btn">View</button>
                    <div class="form-check">
                        <input class="form-check-input select-image-check" type="checkbox" value="${image._id}">
                        <label class="form-check-label">Select</label>
                    </div>
                </div>
            </div>
        </div>
    `;
}


// Function to set up event listeners for image cards
function setupImageCardListeners() {
    // View image detail
    document.querySelectorAll('.view-image-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const imageId = e.target.closest('.card').dataset.imageId;
            showImageDetail(imageId);
        });
    });

    // Image card click (excluding checkbox and buttons)
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', (e) => {
            // If the click wasn't on a button, checkbox, or label
            if (!e.target.closest('button') &&
                !e.target.closest('.form-check-input') &&
                !e.target.closest('.form-check-label')) {
                const imageId = card.dataset.imageId;
                showImageDetail(imageId);
            }
        });
    });
}

// // Function to show image detail
// async function showImageDetail(imageId) {
//     try {
//         const response = await fetch(`/history/api/images/${imageId}`);
//         const data = await response.json();

//         if (data.success) {
//             const image = data.image;

//             // Populate modal with image details
//             document.getElementById('detailModalTitle').textContent =
//                 image.metadata.title || 'Processed Image';

//             document.getElementById('originalImage').src = image.originalImageUrl;
//             document.getElementById('processedImage').src = image.processedImageUrl;

//             document.getElementById('imageDetailType').textContent = image.cvdType;
//             document.getElementById('imageDetailDate').textContent =
//                 new Date(image.processedDate).toLocaleString();

//             // Set up download links
//             document.getElementById('downloadOriginal').href = image.originalImageUrl;
//             document.getElementById('downloadProcessed').href = image.processedImageUrl;

//             // Set delete button data
//             document.getElementById('deleteImageBtn').dataset.imageId = image._id;

//             // Show modal
//             const imageModal = new bootstrap.Modal(document.getElementById('imageDetailModal'));
//             imageModal.show();
//         } else {
//             alert('Failed to load image details');
//         }
//     } catch (error) {
//         console.error('Error loading image details:', error);
//         alert('Failed to load image details');
//     }
// }


function showImageDetail(imageId) {
    try {
        // Show loading spinner in modal
        const modal = document.getElementById('imageDetailModal');
        const loadingSpinner = modal.querySelector('.modal-loading') ||
            document.createElement('div');

        if (!modal.querySelector('.modal-loading')) {
            loadingSpinner.className = 'modal-loading position-absolute w-100 h-100 d-flex justify-content-center align-items-center bg-white bg-opacity-75';
            loadingSpinner.innerHTML = `
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            `;
            modal.querySelector('.modal-content').style.position = 'relative';
            modal.querySelector('.modal-content').appendChild(loadingSpinner);
        }

        // Show modal with loading state
        const imageModal = new bootstrap.Modal(modal);
        imageModal.show();

        // Fetch image details
        fetch(`/history/api/images/${imageId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load image (Status: ${response.status})`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    const image = data.image;

                    // Populate modal with image details
                    document.getElementById('detailModalTitle').textContent =
                        image.metadata && image.metadata.title ? image.metadata.title : 'Processed Image';

                    // Set up image elements with error handlers
                    const originalImage = document.getElementById('originalImage');
                    const processedImage = document.getElementById('processedImage');

                    // Add error handlers for images
                    originalImage.onerror = function () {
                        this.onerror = null;
                        this.src = '/images/image-placeholder.png';
                        showNotification('Original image could not be loaded', 'warning');
                    };

                    processedImage.onerror = function () {
                        this.onerror = null;
                        this.src = '/images/image-placeholder.png';
                        showNotification('Processed image could not be loaded', 'warning');
                    };

                    // Set image sources
                    originalImage.src = image.originalImageUrl;
                    processedImage.src = image.processedImageUrl;

                    // Set other details
                    document.getElementById('imageDetailType').textContent = image.cvdType;
                    document.getElementById('imageDetailDate').textContent =
                        new Date(image.processedDate).toLocaleString();

                    // Set download links
                    document.getElementById('downloadOriginal').href = image.originalImageUrl;
                    document.getElementById('downloadProcessed').href = image.processedImageUrl;

                    // Set delete button data
                    document.getElementById('deleteImageBtn').dataset.imageId = image._id;

                    // Hide loading spinner
                    loadingSpinner.style.display = 'none';
                } else {
                    throw new Error(data.message || 'Failed to load image details');
                }
            })
            .catch(error => {
                console.error('Error loading image details:', error);
                showNotification('Error loading image details: ' + error.message, 'error');

                // Hide loading, show error in modal
                loadingSpinner.style.display = 'none';
                document.getElementById('detailModalBody').innerHTML = `
                    <div class="alert alert-danger">
                        Failed to load image details. Please try again later.
                    </div>
                `;
            });
    } catch (error) {
        console.error('Error showing image detail modal:', error);
        showNotification('An unexpected error occurred', 'error');
    }
}



async function saveToHistory(originalImageFile, processedImageFile, cvdType, metadata = {}) {
    try {
        // Validate inputs
        if (!originalImageFile || !processedImageFile) {
            throw new Error('Missing image files');
        }

        if (!cvdType) {
            throw new Error('Missing CVD type');
        }

        // Create form data
        const formData = new FormData();
        formData.append('originalImage', originalImageFile);
        formData.append('processedImage', processedImageFile);
        formData.append('cvdType', cvdType);
        formData.append('metadata', JSON.stringify(metadata));

        // Show loading state
        const saveBtn = document.getElementById('saveToHistoryBtn');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = `
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Saving...
            `;
        }

        // Send request
        const response = await fetch('/history/save', {
            method: 'POST',
            body: formData,
        });

        // Parse response
        let data;
        try {
            data = await response.json();
        } catch (error) {
            throw new Error('Invalid response from server');
        }

        // Reset button state
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save to History';
        }

        // Handle errors
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to save to history');
        }

        // Success
        showNotification('Image saved to history successfully!', 'success');
        return data.imageId;
    } catch (error) {
        console.error('Error saving to history:', error);
        showNotification('Error saving to history: ' + error.message, 'error');
        throw error;
    }
}


// Function to show notifications to users

function showNotification(message, type = 'info', duration = 5000) {
    // Create notification container if it doesn't exist
    let notifContainer = document.getElementById('notificationContainer');
    if (!notifContainer) {
        notifContainer = document.createElement('div');
        notifContainer.id = 'notificationContainer';
        document.body.appendChild(notifContainer);
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
    notification.role = 'alert';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    // Add to container
    notifContainer.appendChild(notification);

    // Auto dismiss after duration
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 150);
    }, duration);
}

// Function to set up batch operations
function setupBatchOperations() {
    const selectAllCheckbox = document.getElementById('selectAllImages');
    const batchDeleteBtn = document.getElementById('batchDeleteBtn');

    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', () => {
            const isChecked = selectAllCheckbox.checked;
            document.querySelectorAll('.select-image-check').forEach(checkbox => {
                checkbox.checked = isChecked;
            });
            updateBatchOperationsStatus();
        });
    }

    // Individual checkbox change
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('select-image-check')) {
            updateBatchOperationsStatus();
        }
    });

    // Batch delete button
    if (batchDeleteBtn) {
        batchDeleteBtn.addEventListener('click', async () => {
            const selectedCheckboxes = document.querySelectorAll('.select-image-check:checked');

            if (selectedCheckboxes.length === 0) {
                console.log('No images selected');
                return;
            }

            if (confirm(`Are you sure you want to delete ${selectedCheckboxes.length} selected images? This action cannot be undone.`)) {
                const imageIds = Array.from(selectedCheckboxes).map(cb => cb.value);

                try {
                    const response = await fetch('/history/api/images/batch-delete', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ imageIds })
                    });

                    const data = await response.json();

                    if (data.success) {
                        // Remove deleted images from the UI
                        imageIds.forEach(id => {
                            const card = document.querySelector(`.card[data-image-id="${id}"]`);
                            if (card) {
                                card.closest('.col-sm-6').remove();
                            }
                        });

                        // Reset select all checkbox
                        if (selectAllCheckbox) {
                            selectAllCheckbox.checked = false;
                        }

                        updateBatchOperationsStatus();

                        // Show success message
                        alert(data.message);

                        // Reload the page if all images were deleted
                        const remainingImages = document.querySelectorAll('.card[data-image-id]');
                        if (remainingImages.length === 0) {
                            window.location.reload();
                        }
                    } else {
                        alert('Failed to delete selected images');
                    }
                } catch (error) {
                    console.error('Error deleting images:', error);
                    alert('Failed to delete selected images');
                }
            }
        });
    }
}

// Function to update batch operations status
function updateBatchOperationsStatus() {
    const selectedCheckboxes = document.querySelectorAll('.select-image-check:checked');
    const batchOperationsDiv = document.getElementById('batchOperations');
    const selectedCountSpan = document.getElementById('selectedImagesCount');

    if (selectedCheckboxes.length > 0) {
        if (batchOperationsDiv) {
            batchOperationsDiv.classList.remove('d-none');
        }
        if (selectedCountSpan) {
            selectedCountSpan.textContent = selectedCheckboxes.length;
        }
    } else {
        if (batchOperationsDiv) {
            batchOperationsDiv.classList.add('d-none');
        }
    }
}

// Function to delete a single image
async function deleteImage(imageId) {
    if (confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
        try {
            const response = await fetch(`/history/api/images/${imageId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                // Close the modal if open
                const modal = bootstrap.Modal.getInstance(document.getElementById('imageDetailModal'));
                if (modal) {
                    modal.hide();
                }

                // Remove the image card from the UI
                const card = document.querySelector(`.card[data-image-id="${imageId}"]`);
                if (card) {
                    card.closest('.col-sm-6').remove();
                }

                // Show success message
                alert('Image deleted successfully');

                // Check if there are any images left
                const remainingImages = document.querySelectorAll('.card[data-image-id]');
                if (remainingImages.length === 0) {
                    window.location.reload();
                }
            } else {
                alert('Failed to delete image');
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            alert('Failed to delete image');
        }
    }
}

// Set up delete button in the modal
document.addEventListener('DOMContentLoaded', () => {
    const deleteImageBtn = document.getElementById('deleteImageBtn');

    if (deleteImageBtn) {
        deleteImageBtn.addEventListener('click', (e) => {
            const imageId = e.target.dataset.imageId;
            if (imageId) {
                deleteImage(imageId);
            }
        });
    }
});


// js/history-client.js

document.addEventListener('DOMContentLoaded', function () {
    // Load the user's image history
    loadImageHistory();

    // Set up event listeners
    setupEventListeners();
});

//------------------------------------------------------
//copied from history.js

// Load user's image history
async function loadImageHistory() {
    try {
        // Show loading spinner
        document.getElementById('loadingSpinner').classList.remove('d-none');

        // Fetch image history from API
        const response = await fetch('/history/api/images');
        const data = await response.json();

        if (data.success) {
            renderImageGallery(data.images);
        } else {
            showAlert('Failed to load image history', 'danger');
        }
    } catch (error) {
        console.error('Error loading image history:', error);
        showAlert('An error occurred while loading images', 'danger');
    } finally {
        // Hide loading spinner
        document.getElementById('loadingSpinner').classList.add('d-none');
    }
}

// Render the image gallery
function renderImageGallery(images) {
    const gallery = document.getElementById('imageGallery');
    gallery.innerHTML = '';

    if (images.length === 0) {
        gallery.innerHTML = `
            <div class="col-12 text-center my-5">
                <p class="text-muted">No images in your history yet. Process some images to see them here.</p>
            </div>
        `;
        return;
    }

    // Create card for each image
    images.forEach(image => {
        const card = document.createElement('div');
        card.className = 'col-md-4 col-sm-6 mb-4';

        const date = new Date(image.processedDate).toLocaleDateString();

        card.innerHTML = `
            <div class="card h-100">
                <div class="card-img-top position-relative">
                    <img src="${image.processedImageUrl}" class="img-fluid" alt="Processed image">
                    <div class="position-absolute top-0 end-0 p-2">
                        <div class="form-check">
                            <input class="form-check-input image-select" type="checkbox" 
                                   data-id="${image._id}" id="check-${image._id}">
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <h5 class="card-title">${image.cvdType}</h5>
                    <p class="card-text">Processed on ${date}</p>
                </div>
                <div class="card-footer bg-white">
                    <button class="btn btn-sm btn-primary view-details" data-id="${image._id}">
                        View Details
                    </button>
                </div>
            </div>
        `;

        gallery.appendChild(card);
    });

    // Add event listeners to the newly created elements
    addGalleryEventListeners();
}

// Set up event listeners
function setupEventListeners() {
    // Select all checkbox
    const selectAllCheckbox = document.getElementById('selectAllImages');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function () {
            const checkboxes = document.querySelectorAll('.image-select');
            checkboxes.forEach(checkbox => {
                checkbox.checked = selectAllCheckbox.checked;
            });
            updateSelectedCount();
        });
    }

    // Batch delete button
    const batchDeleteBtn = document.getElementById('batchDeleteBtn');
    if (batchDeleteBtn) {
        batchDeleteBtn.addEventListener('click', batchDeleteImages);
    }

    // Delete single image button in modal
    const deleteImageBtn = document.getElementById('deleteImageBtn');
    if (deleteImageBtn) {
        deleteImageBtn.addEventListener('click', deleteImage);
    }
}

// Add event listeners to gallery items
function addGalleryEventListeners() {
    // View details buttons
    const viewButtons = document.querySelectorAll('.view-details');
    viewButtons.forEach(button => {
        button.addEventListener('click', function () {
            const imageId = this.getAttribute('data-id');
            showImageDetail(imageId);
        });
    });

    // Image select checkboxes
    const checkboxes = document.querySelectorAll('.image-select');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateSelectedCount);
    });
}

// Update selected images count
function updateSelectedCount() {
    const selectedCheckboxes = document.querySelectorAll('.image-select:checked');
    const count = selectedCheckboxes.length;

    document.getElementById('selectedImagesCount').textContent = count;

    // Show/hide batch operations section
    const batchOps = document.getElementById('batchOperations');
    if (count > 0) {
        batchOps.classList.remove('d-none');
    } else {
        batchOps.classList.add('d-none');
    }
}

// Show image detail in modal
async function showImageDetail(imageId) {
    try {
        const response = await fetch(`/history/api/images/${imageId}`);
        const data = await response.json();

        if (data.success) {
            const image = data.image;

            // Set image sources
            document.getElementById('originalImage').src = image.originalImageUrl;
            document.getElementById('processedImage').src = image.processedImageUrl;

            // Set image details
            document.getElementById('imageDetailType').textContent = image.cvdType;
            document.getElementById('imageDetailDate').textContent = new Date(image.processedDate).toLocaleString();

            // Set download links
            document.getElementById('downloadOriginal').href = image.originalImageUrl;
            document.getElementById('downloadProcessed').href = image.processedImageUrl;

            // Set delete button data
            document.getElementById('deleteImageBtn').setAttribute('data-id', image._id);

            // Show modal
            const modal = new bootstrap.Modal(document.getElementById('imageDetailModal'));
            modal.show();
        } else {
            showAlert('Failed to load image details', 'danger');
        }
    } catch (error) {
        console.error('Error loading image details:', error);
        showAlert('An error occurred while loading image details', 'danger');
    }
}

// Delete a single image
async function deleteImage() {
    const imageId = this.getAttribute('data-id');
    if (!imageId) return;

    if (confirm('Are you sure you want to delete this image?')) {
        try {
            const response = await fetch(`/history/api/images/${imageId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                // Close the modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('imageDetailModal'));
                modal.hide();

                // Reload image history
                loadImageHistory();

                showAlert('Image deleted successfully', 'success');
            } else {
                showAlert('Failed to delete image: ' + data.message, 'danger');
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            showAlert('An error occurred while deleting the image', 'danger');
        }
    }
}

// Batch delete images
async function batchDeleteImages() {
    const selectedCheckboxes = document.querySelectorAll('.image-select:checked');
    const imageIds = Array.from(selectedCheckboxes).map(checkbox => checkbox.getAttribute('data-id'));

    if (imageIds.length === 0) return;

    if (confirm(`Are you sure you want to delete ${imageIds.length} selected images?`)) {
        try {
            const response = await fetch('/history/api/images/batch-delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ imageIds })
            });

            const data = await response.json();

            if (data.success) {
                // Reload image history
                loadImageHistory();

                // Reset select all checkbox
                document.getElementById('selectAllImages').checked = false;

                // Hide batch operations
                document.getElementById('batchOperations').classList.add('d-none');

                showAlert(data.message, 'success');
            } else {
                showAlert('Failed to delete images: ' + data.message, 'danger');
            }
        } catch (error) {
            console.error('Error batch deleting images:', error);
            showAlert('An error occurred while deleting images', 'danger');
        }
    }
}

// Show alert message
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    // Insert at the top of the container
    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 150);
    }, 5000);
}