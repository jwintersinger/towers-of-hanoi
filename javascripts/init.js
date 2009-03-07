function init() {
  debug = new Debug(); // TODO: convert to singleton to eliminate global variable.
  new Game(4);
}
window.addEventListener('load', init, false);
