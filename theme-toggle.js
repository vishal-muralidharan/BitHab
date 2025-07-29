// Theme toggle logic
function setThemeFromStorage() {
  const savedTheme = localStorage.getItem('bitHabTheme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  document.getElementById('theme-toggle').innerHTML = savedTheme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('bitHabTheme', newTheme);
  document.getElementById('theme-toggle').innerHTML = newTheme === 'dark' ? '☀️' : '🌙';
}

document.addEventListener('DOMContentLoaded', function() {
  setThemeFromStorage();
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
});
