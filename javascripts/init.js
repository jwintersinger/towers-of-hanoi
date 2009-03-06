function init() {
  debug = new Debug(); // TODO: convert to singleton to eliminate global variable.
  new Game(2);
}
window.addEventListener('load', init, false);
