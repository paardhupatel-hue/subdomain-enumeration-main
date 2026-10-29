const domainInput = document.querySelector('#domain');
const enumerateButton = document.querySelector('#enumerate');
const message = document.querySelector('#message');
const resultsSection = document.querySelector('#results');
const resultRows = document.querySelector('#result-rows');

function setMessage(text, type = '') {
  message.textContent = text;
  message.className = `message ${type}`;
}

function isValidDomain(value) {
  const domain = value.toLowerCase().replace(/\.$/, '');
  if (domain.length === 0 || domain.length > 253 || domain.includes(' ')) return false;
  if (/^\d+(\.\d+){3}$/.test(domain)) return false;
  const labels = domain.split('.');
  return labels.length >= 2 && labels.every((label) => (
    label.length > 0 && !label.startsWith('-') && !label.endsWith('-')
    && /^[a-z0-9-]+$/.test(label)
  ));
}

function renderResults(data) {
  document.querySelector('#target-label').textContent = data.domain;
  document.querySelector('#total').textContent = data.total;
  document.querySelector('#found').textContent = data.found;
  document.querySelector('#not-found').textContent = data.not_found;
  resultRows.innerHTML = data.results.map((item) => `
    <tr>
      <td>${item.subdomain}</td>
      <td><span class="result-status ${item.status === 'Found' ? 'is-found' : 'is-missing'}">${item.status}</span></td>
      <td class="ip">${item.ip}</td>
    </tr>
  `).join('');
  resultsSection.hidden = false;
}

async function enumerate() {
  const domain = domainInput.value.trim();
  if (!domain) {
    setMessage('Enter a domain before starting the scan.', 'error');
    domainInput.focus();
    return;
  }
  if (!isValidDomain(domain)) {
    setMessage('Enter a valid domain such as example.com.', 'error');
    domainInput.focus();
    return;
  }

  enumerateButton.disabled = true;
  enumerateButton.querySelector('span:first-child').textContent = 'CHECKING...';
  setMessage('Resolving the built-in wordlist...', 'loading');
  try {
    const response = await fetch('/api/enumerate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'The lookup could not be completed.');
    renderResults(data);
    setMessage(`${data.total} DNS records checked for ${data.domain}.`, 'success');
  } catch (error) {
    setMessage(error.message, 'error');
    resultsSection.hidden = true;
  } finally {
    enumerateButton.disabled = false;
    enumerateButton.querySelector('span:first-child').textContent = 'ENUMERATE';
  }
}

enumerateButton.addEventListener('click', enumerate);
domainInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') enumerate();
});
