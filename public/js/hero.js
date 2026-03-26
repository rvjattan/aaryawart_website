// Apply background image from data attribute if present
document.addEventListener('DOMContentLoaded', function() {
  const heroSection = document.querySelector('.hero-section');
  if (heroSection && heroSection.dataset.bgImage) {
    heroSection.style.backgroundImage = "url('" + heroSection.dataset.bgImage + "')";
  }
});
