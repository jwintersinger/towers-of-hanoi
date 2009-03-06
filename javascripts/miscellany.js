// Returns random integer in range [min, max].
function random_int(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function shuffle(arr) {
  arr.sort(function(a, b) { return Math.random() - 0.5; });
}

function generate_random_colour() {
  // Colour choice isn't completely random -- don't want dark colours that lack contrast against towers.
  var rgb = [random_int(0, 127), random_int(64, 192), random_int(128, 255)];
  shuffle(rgb);
  return 'rgb(' + rgb.join() + ')';
}
