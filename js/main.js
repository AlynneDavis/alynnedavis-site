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
}, { threshold: 0, rootMargin: '0px 0px -40px 0px' });

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

// Bot time trap. A human cannot read and complete these forms in under three
// seconds; automated submissions routinely do. Measured from page load.
const formPageLoadedAt = Date.now();
const MIN_FILL_MS = 3000;
function tooFastToBeHuman() { return Date.now() - formPageLoadedAt < MIN_FILL_MS; }

// ---- Consultation screening form ----
// Posts twice on submit: once to Zoho CRM (creates the Lead, which is what fires
// Alynne's autoresponder), and once to Zoho Campaigns if the newsletter box is
// checked. The two are separate Zoho products and do not sync on their own.
const NEWSLETTER_LIST_ID = '112b6b96937c6fa86';   // Zoho Campaigns list (zcld)
const NEWSLETTER_HOST = 'zujep-zgph.maillist-manage.net';

// Fires the Campaigns web-optin the same way Zoho's own embed does: a real form
// POST into a hidden iframe. A fetch() gets blocked by CORS on this endpoint.
function subscribeToNewsletter(email, name) {
  try {
    let frame = document.getElementById('zc-optin-sink');
    if (!frame) {
      frame = document.createElement('iframe');
      frame.id = 'zc-optin-sink';
      frame.name = 'zc-optin-sink';
      frame.style.display = 'none';
      document.body.appendChild(frame);
    }
    const f = document.createElement('form');
    f.method = 'POST';
    f.action = 'https://' + NEWSLETTER_HOST + '/weboptin.zc';
    f.target = 'zc-optin-sink';
    f.style.display = 'none';
    const fields = {
      CONTACT_EMAIL: email,
      LASTNAME: name || '',
      zcld: NEWSLETTER_LIST_ID,
      zctd: '112b6b96937a107a9',
      zx: '133b9bf30',
      zcvers: '3.0',
      submitType: 'optinCustomView',
      mode: 'OptinCreateView',
      formType: 'QuickForm',
      zc_trackCode: 'ZCFORMVIEW',
      oldListIds: '',
      emailReportId: '',
      document_domain: '',
      zc_Url: NEWSLETTER_HOST,
      new_optin_response_in: '0',
      duplicate_optin_response_in: '0'
    };
    for (const [k, v] of Object.entries(fields)) {
      const i = document.createElement('input');
      i.type = 'hidden'; i.name = k; i.value = v;
      f.appendChild(i);
    }
    document.body.appendChild(f);
    f.submit();
    setTimeout(() => f.remove(), 2000);
  } catch (err) {
    // A failed newsletter signup must never cost Alynne the lead itself.
  }
}

const form = document.getElementById('contact-form');
if (form) {
  const inquiryType = form.querySelector('#inquiry_type');
  const stateField = form.querySelector('#state');
  const stateNote = form.querySelector('#state-note');
  const paymentNote = form.querySelector('#payment-note');

  // Groups shown only to people seeking care, not to clinicians booking consultation.
  const clientOnly = ['grp-focus', 'grp-readiness', 'grp-format', 'grp-history', 'grp-payment'];
  const professionalOnly = ['grp-consult-type'];
  // Fields that are required, but only while their group is visible. A hidden
  // required field blocks submit with no visible message, so visibility and
  // the required flag have to move together.
  const requiredWhenVisible = { 'grp-focus': '#focus', 'grp-readiness': '#readiness', 'grp-consult-type': '#consult_type' };

  function setGroup(id, visible) {
    const el = document.getElementById(id);
    if (!el) return;
    el.hidden = !visible;
    // Disabled controls are skipped by validation and left out of FormData.
    el.querySelectorAll('input, select, textarea').forEach(c => { c.disabled = !visible; });
    const sel = requiredWhenVisible[id];
    if (sel) {
      const field = el.querySelector(sel);
      if (field) field.required = visible;
    }
    if (id === 'grp-payment') {
      el.querySelectorAll('input[type="radio"]').forEach(r => { r.required = visible; });
    }
  }

  function applyRouting() {
    const isProfessional = inquiryType.value === 'Professional consultation';
    clientOnly.forEach(id => setGroup(id, !isProfessional));
    professionalOnly.forEach(id => setGroup(id, isProfessional));

    // Therapy is limited to NC and SC by licensure, and an Intensive is therapy.
    // Coaching and clinician-to-clinician consultation carry no such limit.
    const LICENSED_ONLY = ['Therapy for myself', 'Therapy for a couple or family', 'Intensive'];
    const wantsTherapy = LICENSED_ONLY.includes(inquiryType.value);
    const outOfState = stateField.value === 'Another state or country';
    if (stateNote) stateNote.hidden = !(wantsTherapy && outOfState);
  }

  inquiryType.addEventListener('change', applyRouting);
  stateField.addEventListener('change', applyRouting);
  applyRouting();

  form.querySelectorAll('input[name="payment"]').forEach(r => {
    r.addEventListener('change', () => {
      if (paymentNote) paymentNote.hidden = r.value !== 'Asking about sliding scale';
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const original = btn.textContent;
    btn.textContent = 'Sending...';
    btn.disabled = true;

    const data = Object.fromEntries(new FormData(form));

    // Honeypot check and time trap. Both show the normal success state so bots
    // get no signal they were caught.
    if (data.website || tooFastToBeHuman()) {
      form.style.display = 'none';
      document.querySelector('.form-success').style.display = 'block';
      return;
    }
    delete data.website;

    // The decision-making answers go first so Alynne can triage at a glance.
    const line = (label, val) => val ? label + ': ' + val + '\n' : '';
    let body = '';
    body += line('INQUIRY TYPE', data.inquiry_type);
    body += line('CONSULTATION TYPE', data.consult_type);
    body += line('LOCATED IN', data.state);
    body += line('READINESS', data.readiness);
    body += line('PAYMENT', data.payment);
    body += '\n';
    body += line('FOCUS', data.focus);
    body += line('FORMAT', data.format);
    body += line('THERAPY HISTORY', data.history);
    body += line('FOUND ME VIA', data.referral_source);
    body += line('NEWSLETTER OPT-IN', data.newsletter);
    if (data.outcome) body += '\nWHAT THEY WANT TO BE DIFFERENT IN SIX MONTHS:\n' + data.outcome + '\n';
    if (data.notes) body += '\nANYTHING ELSE:\n' + data.notes + '\n';

    try {
      const { first, last } = splitName(data.name || '');
      await postToZoho({
        'First Name': first,
        'Last Name': last || data.name,
        'Email': data.email || '',
        'Phone': data.phone || '',
        'Description': body
      });

      if (data.newsletter) subscribeToNewsletter(data.email, data.name);

      form.style.display = 'none';
      document.querySelector('.form-success').style.display = 'block';
      // GA4 conversion: screened consultation inquiry
      if (typeof gtag === 'function') {
        gtag('event', 'generate_lead', {
          form_name: 'consultation_screening',
          inquiry_type: data.inquiry_type || '',
          readiness: data.readiness || '',
          payment_fit: data.payment || ''
        });
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

    // Honeypot check, plus the time trap. Both fail silently.
    if (raw.website || tooFastToBeHuman()) {
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
      // GA4 conversion: intensive inquiry lead
      if (typeof gtag === 'function') gtag('event', 'generate_lead', { form_name: 'intensive_inquiry' });
    } catch (err) {
      intensiveForm.closest('.content-narrow').querySelector('.form-error').style.display = 'block';
      btn.textContent = original;
      btn.disabled = false;
    }
  });
}

/* ---- Track phone and text link clicks in GA4 ----
   Fires on any tel: or sms: link sitewide, so calls and texts show up
   alongside form submissions instead of being invisible. */
document.addEventListener('click', function (e) {
  const link = e.target.closest('a[href^="tel:"], a[href^="sms:"]');
  if (!link || typeof gtag !== 'function') return;
  const method = link.getAttribute('href').startsWith('sms:') ? 'text' : 'phone';
  gtag('event', 'contact_click', {
    method: method,
    page_path: window.location.pathname
  });
});


/* ---- fade-in safety net ----
   If the observer never fires, for any reason, content must still be
   readable. Nothing on the page should depend on JavaScript to be seen. */
window.addEventListener('load', function () {
  setTimeout(function () {
    document.querySelectorAll('.fade-in:not(.visible)').forEach(function (el) {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight) el.classList.add('visible');
    });
  }, 1200);
});
