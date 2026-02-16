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

    // Honeypot check — if the hidden field is filled in, it's a bot
    if (data.website) {
      form.style.display = 'none';
      document.querySelector('.form-success').style.display = 'block';
      return;
    }
    delete data.website;

    try {
      const res = await fetch('https://ikqsrxpbhuaobztrnjqz.supabase.co/functions/v1/contact', {
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

// Intensive inquiry form handler
const intensiveForm = document.getElementById('intensive-form');
if (intensiveForm) {
  intensiveForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = intensiveForm.querySelector('button[type="submit"]');
    const original = btn.textContent;
    btn.textContent = 'Sending...';
    btn.disabled = true;

    const raw = Object.fromEntries(new FormData(intensiveForm));

    // Honeypot check
    if (raw.website) {
      intensiveForm.style.display = 'none';
      intensiveForm.closest('.content-narrow').querySelector('.form-success').style.display = 'block';
      return;
    }
    delete raw.website;

    // Format screening details into the message field for the existing contact endpoint
    const message = [
      '--- SELF-DISCOVERY INTENSIVE INQUIRY ---',
      '',
      'Location: ' + (raw.location || 'Not provided'),
      'Format Preference: ' + (raw.format_preference || 'Not provided'),
      'Age Range: ' + (raw.age_range || 'Not provided'),
      'Therapy History: ' + (raw.therapy_history || 'Not provided'),
      'Referral Source: ' + (raw.referral_source || 'Not provided'),
      'Preferred Dates: ' + (raw.availability || 'Not provided'),
      '',
      'What they hope to understand or work through:',
      raw.concerns || 'Not provided',
      '',
      'What a meaningful outcome would look like:',
      raw.goals || 'Not provided',
      '',
      'Additional notes:',
      raw.additional_notes || 'None',
    ].join('\n');

    const data = {
      name: raw.name,
      email: raw.email,
      phone: raw.phone || '',
      service: 'Self-Discovery Intensive',
      message: message
    };

    try {
      const res = await fetch('https://ikqsrxpbhuaobztrnjqz.supabase.co/functions/v1/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        intensiveForm.style.display = 'none';
        intensiveForm.closest('.content-narrow').querySelector('.form-success').style.display = 'block';
      } else {
        throw new Error('Failed');
      }
    } catch (err) {
      intensiveForm.closest('.content-narrow').querySelector('.form-error').style.display = 'block';
      btn.textContent = original;
      btn.disabled = false;
    }
  });
}
