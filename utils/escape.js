/**
 * ✅ HTML escaping utilities to prevent XSS attacks
 * Escapes HTML special characters to prevent script injection
 */

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * ✅ Safe sprintf-like function for HTML escaping template literals
 * Usage: safeHtml`<td>${userName}</td>` will escape userName
 */
function safeHtml(strings, ...values) {
  let result = strings[0];
  for (let i = 0; i < values.length; i++) {
    result += escapeHtml(values[i]) + strings[i + 1];
  }
  return result;
}

module.exports = {
  escapeHtml,
  safeHtml,
};
