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

// Submit form data to Zoho CRM Web-to-Lead
function postToZoho(fields) {
  const fd = new FormData();
  fd.append('xnQsjsdp', '438ba04b77681d7713f5393235a0faf3068b83adb61a6a1ace2f45e1481e5088');
  fd.append('xmIwtLD', 'f8c5b63d6cca8ce26432ba5b108efac4dc5a45bedeb6cb42fa5ca20f1115127b2eb84c2804a12b7c7a8e1d423de13ea5');
  fd.append('actionType', 'TGVhZHM=');
  fd.append('returnURL', 'null');
  for (const [key, val] of Object.entries(fields)) fd.append(key, val);
  return fetch('https://crm.zoho.com/crm/WebToLeadForm', { method: 'POST', body: fd });
}

function splitName(fullName) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { first: '', last: parts[0] };
  return { first: parts.slice(0, -1).join(' '), last: parts[parts.length - 1] };
}

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
      const { first, last } = splitName(data.name || '');
      await postToZoho({
        'First Name': first,
        'Last Name': last || data.name,
        'Email': data.email || '',
        'Phone': data.phone || '',
        'Description': (data.service ? 'Service: ' + data.service + '\n\n' : '') + (data.message || '')
      });
      form.style.display = 'none';
      document.querySelector('.form-success').style.display = 'block';
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

    const description = [
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

    try {
      const { first, last } = splitName(raw.name || '');
      await postToZoho({
        'First Name': first,
        'Last Name': last || raw.name,
        'Email': raw.email || '',
        'Phone': raw.phone || '',
        'Description': description
      });
      intensiveForm.style.display = 'none';
      intensiveForm.closest('.content-narrow').querySelector('.form-success').style.display = 'block';
    } catch (err) {
      intensiveForm.closest('.content-narrow').querySelector('.form-error').style.display = 'block';
      btn.textContent = original;
      btn.disabled = false;
    }
  });
}
