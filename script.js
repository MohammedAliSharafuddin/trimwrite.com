const WAITLIST_ENDPOINT =
  window.TRIMWRITE_WAITLIST_ENDPOINT || '';
const WAITLIST_EMAIL = 'support@trimwrite.dev';

const observer = new IntersectionObserver(
  entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }
  },
  {
    threshold: 0.18,
    rootMargin: '0px 0px -40px 0px'
  }
);

document.querySelectorAll('[data-reveal]').forEach((element, index) => {
  element.style.transitionDelay = `${index * 90}ms`;
  observer.observe(element);
});

const form = document.getElementById('notify-form');
const message = document.getElementById('notify-message');

async function submitToEndpoint(payload) {
  const response = await fetch(WAITLIST_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Waitlist request failed with ${response.status}`);
  }
}

function openMailto(payload) {
  const subject = encodeURIComponent(
    `TrimWrite beta request: ${payload.interest}`
  );
  const body = encodeURIComponent(
    [
      'Beta request from trimwrite.com',
      '',
      `Email: ${payload.email}`,
      `Interest: ${payload.interest}`,
      `Context: ${payload.context || 'Not provided'}`,
      `Submitted at: ${payload.submittedAt}`
    ].join('\n')
  );

  window.location.href = `mailto:${WAITLIST_EMAIL}?subject=${subject}&body=${body}`;
}

if (form && message) {
  form.addEventListener('submit', async event => {
    event.preventDefault();

    const submitButton = form.querySelector('button[type="submit"]');
    const payload = {
      email: form.elements.email.value.trim(),
      interest: form.elements.interest.value,
      context: form.elements.context.value.trim(),
      source: 'trimwrite.com',
      submittedAt: new Date().toISOString()
    };

    submitButton.disabled = true;
    message.textContent = WAITLIST_ENDPOINT
      ? 'Submitting beta request...'
      : 'Opening your email app...';

    try {
      if (WAITLIST_ENDPOINT) {
        await submitToEndpoint(payload);
        form.reset();
        message.textContent =
          'Thanks. Your beta request has been recorded.';
      } else {
        openMailto(payload);
        form.reset();
        message.textContent =
          'Your email app should open with a prefilled beta request.';
      }
    } catch (error) {
      message.textContent =
        'Could not route the request automatically. Email support@trimwrite.dev instead.';
      console.error(error);
    } finally {
      submitButton.disabled = false;
    }
  });
}
