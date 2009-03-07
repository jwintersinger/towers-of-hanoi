// Takes array containing separate integers for RGB values.
function Colour(rgb) {
  this.rgb = rgb;
}

Colour.prototype.toString = function() {
  return 'rgb(' + this.rgb.join() + ')';
}

// Two random colour generation methods follow, both of which are intended to generate vibrant, bright colours that
// contrast well with the black towers. I'm not sure which method I prefer, so both have been preserved.
//
// The following algorithm generates an HSV colour and then converts it to RGB. HSV is used based on the reasoning that
// it more easily allows one to get a colour with the desired properties, for one can keep the saturation and value
// within a narrow range while picking the hue at random.
Colour.random = function() {
  return Colour.convert_hsv_to_rgb([random_int(0, 359),
                                    random_int(40, 80)/80,
                                    random_int(40, 80)/80]);
}

// Here three integers are chosen, each within a fairly narrow range. Each integer is then assigned randomly to the
// R, G, or B channel.
Colour.random_alternative = function() {
  var rgb = [random_int(0, 127), random_int(64, 192), random_int(128, 255)];
  shuffle(rgb);
  return new Colour(rgb);
}

// h must be in interval [0, 360), and s and v in [0, 1].
Colour.convert_hsv_to_rgb = function(hsv) {
  // Algorithm used from http://en.wikipedia.org/wiki/HSL_color_space#Conversion_from_HSV_to_RGB and
  // http://www.cs.rit.edu/~ncs/color/t_convert.html.
  var h = hsv[0], s = hsv[1], v = hsv[2];
  h = (h/60) % 6;
  var h_i = Math.floor(h);
  var f = h - h_i;
  var p = v*(1 - s);
  var q = v*(1 - f*s);
  var t = v*(1 - (1 - f)*s);

  switch(h_i) {
    case 0:
      var rgb = [v, t, p];
      break;
    case 1:
      var rgb = [q, v, p];
      break;
    case 2:
      var rgb = [p, v, t];
      break;
    case 3:
      var rgb = [p, q, v];
      break;
    case 4:
      var rgb = [t, p, v];
      break;
    case 5:
      var rgb = [v, p, q];
      break;
  }
  return new Colour(rgb.map(function(a) { return Math.round(a*256); }));
}
