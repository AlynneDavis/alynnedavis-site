// Mobile nav toggle
const toggle = document.querySelector('.mobile-toggle');
const navLinks = document.querySelector('.nav-links');
if (toggle) {
  toggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    toggle.setAttribute('aria-expanded', navLinks.classList.contains('open'));
  });
}

// Mobile dropdown toggle
document.querySelectorAll('.dropdown-toggle').forEach(dt => {
  dt.addEventListener('click', (e) => {
    if (window.innerWidth <= 900) {
      e.preventDefault();
      dt.closest('.dropdown').classList.toggle('open');
    }
  });
});

// Header scroll effect
const header = document.querySelector('.site-header');
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

// Fade-in on scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// Contact form handler
const form = document.getElementById('contact-form');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const original = btn.textContent;
    btn.textContent = 'Sending...';
    btn.disabled = true;

    const data = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch('https://YOUR_SUPABASE_URL/functions/v1/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        form.style.display = 'none';
        document.querySelector('.form-success').style.display = 'block';
      } else {
        throw new Error('Failed');
      }
    } catch (err) {
      document.querySelector('.form-error').style.display = 'block';
      btn.textContent = original;
      btn.disabled = false;
    }
  });
}
