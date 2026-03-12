// Navbar hamburger: ensure mobile menu toggle works (Bootstrap 5 + fallback)
document.addEventListener('DOMContentLoaded', () => {
  const toggler = document.querySelector('.navbar-toggler[data-bs-target="#mainNav"]');
  const mainNav = document.getElementById('mainNav');
  if (!toggler || !mainNav) return;

  if (typeof bootstrap !== 'undefined' && bootstrap.Collapse) {
    const collapse = new bootstrap.Collapse(mainNav, { toggle: false });
    toggler.addEventListener('click', () => {
      collapse.toggle();
      toggler.setAttribute('aria-expanded', mainNav.classList.contains('show'));
    });
  } else {
    toggler.addEventListener('click', () => {
      const isExpanded = mainNav.classList.contains('show');
      mainNav.classList.toggle('show', !isExpanded);
      toggler.setAttribute('aria-expanded', !isExpanded);
    });
  }
});

// Volunteer Registration Form
document.addEventListener('DOMContentLoaded', () => {
  const volunteerForm = document.getElementById('volunteer-form');
  if (volunteerForm) {
    volunteerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(volunteerForm);
      const data = Object.fromEntries(formData);
      
      try {
        const response = await fetch('/api/volunteers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        
        const result = await response.json();
        const alertEl = document.getElementById('volunteer-alert');
        
        if (result.success) {
          alertEl.className = 'alert alert-success';
          alertEl.textContent = 'Thank you for registering! We will contact you soon.';
          volunteerForm.reset();
        } else {
          alertEl.className = 'alert alert-danger';
          alertEl.textContent = 'Error: ' + (result.message || 'Failed to submit form');
        }
        alertEl.classList.remove('d-none');
      } catch (err) {
        const alertEl = document.getElementById('volunteer-alert');
        alertEl.className = 'alert alert-danger';
        alertEl.textContent = 'Network error: ' + err.message;
        alertEl.classList.remove('d-none');
      }
    });
  }
});

// Animate impact counters
function animateCounter(element, target, duration = 2000) {
  const start = 0;
  const step = target / (duration / 50);
  let current = start;
  
  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    element.textContent = Math.floor(current).toLocaleString();
  }, 50);
}

// Load stats on home page
async function loadStats() {
  try {
    const response = await fetch('/api/stats');
    const result = await response.json();
    
    if (result.success) {
      const counters = [
        { id: 'counter-volunteers', key: 'volunteers_registered' },
        { id: 'counter-projects', key: 'projects_completed' },
        { id: 'counter-lives', key: 'lives_impacted' },
      ];
      
      counters.forEach(({ id, key }) => {
        const el = document.getElementById(id);
        if (el) {
          animateCounter(el, result.data[key] || 0);
        }
      });
    }
  } catch (err) {
    console.warn('Error loading stats:', err);
  }
}

// Auto-load stats if on home page
if (document.querySelector('.impact-card')) {
  loadStats();
}
