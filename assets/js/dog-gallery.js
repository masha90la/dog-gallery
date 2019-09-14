// Image modal
var imageModal = document.getElementById("image-modal-placeholder"); 
// Content of the image modal
var modalImgFullView = document.getElementById("image-full-view"); 
// Close button in image modal 
var modalCloseButton = document.getElementById("modal-close-button");
/* Change this variable to set how many photos should be displayed on window load
	and how many more images to load when user clicks "load more" button */
var maxNumberToShow = 12;
// Processing state to throttle function calls
var lazyLoadThrottle;
// Lazy images on the page 
// (there are 0 of them until the data from JSON file is extracted)
var lazyImages;


window.onload = function() {
	// Variable for photo gallery placeholder
	var galleryPlaceholder = document.getElementById('dog-gallery-placeholder');
	// Parse JSON data and build HTML for photo gallery based on the available data
	loadJSONFile(function(response) {
		var dogsObject = JSON.parse(response);
		buildPhotoGallery(dogsObject.dogs, galleryPlaceholder);
		// select all images with a class 'lazy' for lazy loading
		lazyImages = document.querySelectorAll('img.lazy-load-images');
		// run images lazy load function after the content from JSON is loaded
		lazyLoadImages();
		// add event listeners for images lazy loading
		documentLazyLoadEvListener();
	});
}

// Close image modal on the close button click
modalCloseButton.addEventListener('click', closeImageModal);

// Close image modal if user clicks anywhere on the screen outside full size photo
window.onclick = function(event) {
	if (event.target == imageModal[0] && event.target != modalImgFullView[0]) {
		closeImageModal();
	}
};

// Get Contents from JSON file
function loadJSONFile(callback) {   
	var xhr = new XMLHttpRequest();
	xhr.overrideMimeType("application/json");
	xhr.open('GET', '/assets/data/dogs.json', true); 
	xhr.onreadystatechange = function () {
	  if (xhr.readyState == 4 && xhr.status == "200") {
	    callback(xhr.responseText);
		}
	};
	xhr.send(null);
}


// Build photo gallery items from the object contents
function buildPhotoGallery(imgObj, htmlSource) {
	// Variable containing HTML to insert in the photo gallery placeholder element
	var galleryHTML = '';
	// Set the number after which image the rest of the images should be lazy loading
	var lazyLoadStart = 6; 

	// if a number of images to show is not divisible by 4, increment it the number that can be divided
	if (maxNumberToShow % 4 !== 0 ) {
		maxNumberToShow = Math.ceil(maxNumberToShow/4)*4;
	}
	// loop through data from json file and create gallery element for each record
	for (var i = 0; i < imgObj.length; i++) {
		var galleryImg2x = imgObj[i].image + '.' + imgObj[i].image_format;
		var galleryImg1x = imgObj[i].image + '_sm.' + imgObj[i].image_format;
		
		/* Add 'src' and 'srcset' attributtes to the first X number images
		   And add 'data-src' and 'data-srcset' attributes to the rest of the images
		   so that these attributes can be used for lazy loading later */
		if (i >= lazyLoadStart) {
			var srcAttr = 'data-src';
			var srcSetAttr = 'data-srcset';
		}
		else {
			var srcAttr = 'src';
			var srcSetAttr = 'srcset';
		}		
		// wrap every X number of photos around div (number depends on 'maxNumberToShow' variable)
		if (i == 0) {
			galleryHTML += '<div class="group-images">';
		}
		else if (i % maxNumberToShow == 0) {
			// add 'load more' button after the image block
			galleryHTML += '<div class="display-more-images" onclick="displayMoreImages(this);">Load More</div>';
			// add closing tag for the previous 'div.group-images'
			galleryHTML += '</div>';
			galleryHTML += '<div class="group-images">';
		}
		// build photo thumbnails
		galleryHTML += '<div class="photo-thumbnail">';
		galleryHTML += '<img ' +  srcSetAttr + '="' + galleryImg2x + ' 2x, ' + galleryImg1x + ' 1x"';
		galleryHTML += ' ' + srcAttr + '="' + galleryImg2x + '"';
		galleryHTML += ' alt="' + imgObj[i].description + ' thumbnail" onclick="openImageModal(this);"';
		if (i >= lazyLoadStart) {
			galleryHTML += ' class="lazy-load-images"';
		}
		galleryHTML +=  '/></div>';
	}
	// Add new html content to the gallery placeholder element
	galleryHTML += '</div>';
	htmlSource.innerHTML = galleryHTML;
}

// Open image modal (image full view)
function openImageModal(img) {
	imageModal.style.display = 'block';
	if (!img.src) {
	    // if thumbnail image doesn't have 'src' attribute (due to lazy loading), get the image source from data src
		modalImgFullView.src = img.dataset.src;
	}
	else {
		modalImgFullView.src = img.src;
	}
	// get alt text for full size photo from thumbnail alt text
	var modalImgAltText = img.alt.replace(/ thumbnail/gi, '');
	modalImgFullView.alt = modalImgAltText;
}

// Close image modal
function closeImageModal() {
  var timeOut = 0;
  var zoomOut = setInterval(zoomOutModal, 10);
  // enable zooming out 'animation' when the modal is closed
  function zoomOutModal() {
    if (timeOut == 50) {
      clearInterval(zoomOut);
      imageModal.classList.remove('zoom-out-on-close');
      imageModal.style.display = 'none';
    } else {
      timeOut++; 
      imageModal.classList.add('zoom-out-on-close');
    }
  }
}

// When 'Load more' button is clicked, hide it and show the next block of images
function displayMoreImages(displayButton) {
	var nextDivToShow = displayButton.parentElement.nextSibling;
	displayButton.style.display = 'none'; // hide load more button
	nextDivToShow.style.display = 'block'; // load the next block of pictures
}

// Add event listener to document and window for lazy loading
function documentLazyLoadEvListener() {
	document.addEventListener("scroll", lazyLoadImages); // lazy load on scroll
	window.addEventListener("resize", lazyLoadImages); // lazy load on screen resizing
	window.addEventListener("orientationChange", lazyLoadImages); // lazy load when device gets rotated
}

// Lazy loading images
function lazyLoadImages() {
	if (lazyLoadThrottle) {
	  clearTimeout(lazyLoadThrottle);
	}    
	    
	lazyLoadThrottle = setTimeout(function() {
		var scrollTop = window.pageYOffset;
		for (var i = 0; i < lazyImages.length; i++) {
				var lazyImg = lazyImages[i];
				if (lazyImg.parentElement.offsetTop < (window.innerHeight + scrollTop)) {
			// if an image is within the user's view, add image attributes to show the image
			  lazyImg.src = lazyImg.dataset.src;
			  lazyImg.srcset = lazyImg.dataset.srcset;
			  lazyImg.classList.remove('lazy-load-images'); 
			}
		}

		// if there are no more lazy images to display, remove event listener for lazy loading
		if (lazyImages.length == 0) { 
		  document.removeEventListener("scroll", lazyLoadImages);
		  window.removeEventListener("resize", lazyLoadImages);
		  window.removeEventListener("orientationChange", lazyLoadImages);
		}
	}, 30);
}
