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
// Nine service paths share one form. Every block carries data-show-for with a
// pipe-separated list of the services it belongs to; blocks with no attribute
// are shown to everyone. Hidden blocks are disabled as well as hidden, because
// a hidden required field blocks submit with no visible message.
//
// Posts twice: once to Zoho CRM (creating the Lead, which is what fires the
// autoresponder), and once to Zoho Campaigns if the newsletter box is checked.
// The two are separate Zoho products and do not sync on their own.
// Zoho Campaigns, "Newsletter sign ups" list. Note this list lives on the .com
// host; the three lead-magnet lists are on .net. Values taken from the live
// embed code for the Website Newsletter Signup form.
const NEWSLETTER_LIST_ID = '112b6b96937a57851';
const NEWSLETTER_HOST = 'zujep-zgpm.maillist-manage.com';
const NEWSLETTER_FORM_IX = '3z6c6ea014af9749962d49456d4bc37d63766785112500f72d2b6c203d38bd8e8c';

// Services that are psychotherapy, and therefore limited to NC and SC by licensure.
const LICENSED_ONLY = ['Individual psychotherapy', 'Couples or relationship therapy', 'Therapy intensive', 'Adolescent or family therapy'];

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
      CONTACT_EMAIL: email, LASTNAME: name || '',
      zcld: NEWSLETTER_LIST_ID, zctd: '112b6b96937a107a9', zx: '133b9bf30',
      zc_formIx: NEWSLETTER_FORM_IX, viewFrom: 'URL_ACTION',
      zcvers: '3.0', submitType: 'optinCustomView', mode: 'OptinCreateView',
      formType: 'QuickForm', zc_trackCode: 'ZCFORMVIEW', oldListIds: '',
      emailReportId: '', document_domain: '', zc_Url: NEWSLETTER_HOST,
      new_optin_response_in: '0', duplicate_optin_response_in: '0'
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
  const service = form.querySelector('#service');
  const stateField = form.querySelector('#state');
  const conditionals = [...form.querySelectorAll('[data-show-for]')];

  function setVisible(el, visible) {
    el.hidden = !visible;
    el.querySelectorAll('input, select, textarea').forEach(c => {
      if (c.name === 'website') return;              // honeypot stays as it is
      if (!visible && c.required) { c.dataset.wasRequired = '1'; c.required = false; }
      else if (visible && c.dataset.wasRequired) { c.required = true; }
      c.disabled = !visible;
    });
  }

  // A radio group is required only as a group, so it cannot use the required
  // attribute per input without demanding all four. Validated by hand instead.
  function radioGroupsIn(scope) {
    const names = new Set();
    scope.querySelectorAll('input[type="radio"][data-req]').forEach(r => {
      if (!r.disabled && !r.closest('[hidden]')) names.add(r.name);
    });
    return [...names];
  }

  function applyRouting() {
    const chosen = service.value;
    conditionals.forEach(el => {
      const list = el.dataset.showFor.split('|');
      setVisible(el, list.includes(chosen));
    });

    // Therapy is limited to NC and SC. Everything else travels.
    const note = document.getElementById('state-note');
    if (note) note.hidden = !(LICENSED_ONLY.includes(chosen) && stateField.value === 'Another state or country');
  }

  service.addEventListener('change', applyRouting);
  stateField.addEventListener('change', applyRouting);

  // Conditional follow-ups that depend on an answer rather than on the service.
  function toggle(id, on) { const e = document.getElementById(id); if (e) e.hidden = !on; }
  form.addEventListener('change', (e) => {
    const t = e.target;
    if (t.name === 'fees_workable') toggle('fees-note', t.value !== 'Yes');
    if (t.name === 'payment') toggle('payment-note', t.value === 'Hoping to use insurance');
    // Alynne's adolescent work is with older teens only.
    if (t.id === 'teen_age') toggle('teen-age-note', ['12 or younger', '13 to 15'].includes(t.value));
    // Medical clearance is a prerequisite, not a preference. Say so early
    // rather than discovering it on the call.
    if (t.id === 'teen_medical') {
      toggle('teen-medical-note', ['No physician yet, can arrange it', 'No physician yet, unsure where to start'].includes(t.value));
    }
    // A formal diagnosis goes to the partner assessment; self-understanding is therapy.
    if (t.id === 'assess_purpose') {
      const formal = ['Formal diagnosis for a prescriber', 'Documentation for school or work accommodations'];
      toggle('assess-formal-note', formal.includes(t.value));
      toggle('assess-therapy-note', t.value === 'Understanding myself, diagnosis not the point');
    }
    // The partner assessment does not cover eating concerns. That work is Alynne's own.
    if (t.name === 'assess_areas') {
      const ed = form.querySelector('input[name="assess_areas"][value="Eating or food concerns"]');
      toggle('assess-ed-note', !!(ed && ed.checked));
    }
    if (t.name === 'referral_source') {
      toggle('grp-referral_name', t.value === 'Referred by another therapist or healthcare provider');
      toggle('grp-referral_other', t.value === 'Somewhere else');
    }
  });
  toggle('grp-referral_name', false);
  toggle('grp-referral_other', false);
  applyRouting();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Radio and checkbox groups cannot express "one of these" with the required
    // attribute without demanding all of them, so they are checked by hand.
    // A group only counts if it is genuinely on screen: the wrapper itself is
    // never hidden, its parent fieldset is, and hidden inputs are disabled.
    const errBox = document.querySelector('.form-error');
    errBox.style.display = 'none';
    const isLive = (el) => !el.closest('[hidden]') && !el.querySelector('input').disabled;
    const fail = (el, what) => {
      errBox.textContent = 'Just one thing before this can send: ' + what;
      errBox.style.display = 'block';
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    };

    for (const name of radioGroupsIn(form)) {
      if (form.querySelector('input[name="' + name + '"]:checked')) continue;
      const grp = form.querySelector('input[name="' + name + '"]').closest('.form-group');
      fail(grp, 'please choose one of the options highlighted below.');
      return;
    }
    for (const grp of form.querySelectorAll('.check-grid-wrap')) {
      if (!isLive(grp)) continue;
      const label = grp.querySelector('.radio-group-label');
      if (!label || !label.querySelector('span[aria-hidden]')) continue;   // not required
      if (grp.querySelector('input:checked')) continue;
      fail(grp, 'please tick at least one box below.');
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    const original = btn.textContent;
    btn.textContent = 'Sending...';
    btn.disabled = true;

    // Checkbox groups share a name, so collect every value rather than the last.
    const fd = new FormData(form);
    const data = {};
    for (const key of new Set(fd.keys())) {
      const all = fd.getAll(key).filter(v => v !== '');
      // Joined with a slash, not a comma: several option values contain commas.
      data[key] = all.length > 1 ? all.join(' / ') : (all[0] || '');
    }

    if (data.website || tooFastToBeHuman()) {
      form.style.display = 'none';
      const ok = document.querySelector('.form-success');
      ok.style.display = 'block';
      ok.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    delete data.website;

    // Triage answers first so Alynne can sort a lead at a glance, then the rest
    // in the order it was asked, then the long-form answers.
    const LABELS = {
      service: 'INTERESTED IN', state: 'LOCATED IN', readiness: 'TIMELINE',
      fees_workable: 'FEES WORKABLE', payment: 'PAYMENT METHOD', format: 'FORMAT',
      availability: 'AVAILABLE DAYS', times: 'TIMES', therapy_history: 'THERAPY HISTORY',
      therapy_concerns: 'CONCERNS', therapist_priority: 'PRIORITIES WHEN CHOOSING',
      intensive_current_therapist: 'CURRENT THERAPIST', intensive_scope: 'INTENSIVE SCOPE',
      teen_age: 'TEEN AGE', teen_initiator: 'WHO IS LEADING', teen_medical: 'MEDICAL FOLLOW-UP',
      teen_history: 'TEEN TREATMENT HISTORY', teen_caregivers: 'CAREGIVER ALIGNMENT',
      teen_parent_capacity: 'PARENT CAPACITY',
      assess_purpose: 'ASSESSMENT PURPOSE', assess_areas: 'ASSESSMENT AREAS',
      case_role: 'ROLE OR LICENSE', case_areas: 'CONSULT AREAS', case_cadence: 'CADENCE',
      prac_stage: 'PRACTICE STAGE', prac_support: 'WANTS SUPPORT WITH',
      group_interest: 'GROUP INTEREST', group_format: 'GROUP FORMAT', group_notify: 'NOTIFY ABOUT GROUPS',
      workshop_role: 'WORKSHOP ROLE', workshop_topics: 'WORKSHOP TOPICS', workshop_org: 'ORGANIZATION',
      workshop_size: 'GROUP SIZE', workshop_when: 'TIMEFRAME', workshop_format: 'WORKSHOP FORMAT',
      workshop_location: 'LOCATION', workshop_budget: 'BUDGET',
      retreat_interest: 'RETREAT INTEREST', retreat_notify: 'NOTIFY ABOUT RETREATS',
      referral_source: 'FOUND ME VIA', referral_name: 'REFERRED BY', referral_other: 'FOUND ME VIA (OTHER)',
      newsletter: 'NEWSLETTER OPT-IN'
    };
    const LONG = {
      unsure_notes: 'WHAT THEY ARE LOOKING FOR', therapy_bringing: 'WHAT BRINGS THEM NOW',
      therapy_different: 'WHAT THEY WANT TO BE DIFFERENT', therapy_prior: 'PRIOR THERAPY, HELPFUL OR NOT',
      intensive_focus: 'INTENSIVE FOCUS', intensive_why: 'WHY A LONGER SESSION',
      teen_situation: 'WHAT IS GOING ON WITH THE TEEN', assess_context: 'WHAT PROMPTED THE ASSESSMENT', case_issue: 'CASE OR CLINICAL QUESTION', prac_success: 'WHAT SUCCESS LOOKS LIKE',
      group_hope: 'HOPES FOR A GROUP', retreat_hope: 'HOPES FOR A RETREAT',
      anything_else: 'ANYTHING ELSE'
    };
    // Zoho's Web-to-Lead notification email is HTML, so plain newlines in the
    // Description collapse into spaces by the time it reaches Alynne's inbox.
    // Each line therefore carries its own visible marker, which keeps the block
    // scannable in the email AND as a list in the CRM record, where the
    // newlines do survive.
    let body = '';
    for (const k of Object.keys(LABELS)) if (data[k]) body += '\u2022 ' + LABELS[k] + ': ' + data[k] + '\n';
    for (const k of Object.keys(LONG)) if (data[k]) body += '\n\u25B8 ' + LONG[k] + ': ' + data[k] + '\n';

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
      const ok = document.querySelector('.form-success');
      ok.style.display = 'block';
      // The form can be long, so the confirmation may be well above where they
      // pressed submit. Take them to it.
      ok.scrollIntoView({ block: 'center', behavior: 'smooth' });
      if (typeof gtag === 'function') {
        gtag('event', 'generate_lead', {
          form_name: 'consultation_screening',
          service: data.service || '',
          readiness: data.readiness || '',
          fees_workable: data.fees_workable || ''
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
