function Point(x, y) {
  this.x = x;
  this.y = y;
}

// Does not operate in-place -- returns new Point.
// I'd like to implement it as an operator, but no operator overloading until Javascript 2, alas.
Point.prototype.subtract = function(point) {
  return new Point(this.x - point.x, this.y - point.y);
}

Point.prototype.distance_to = function(other) {
  return Math.sqrt(Math.pow(other.x - this.x, 2) + Math.pow(other.y - this.y, 2));
}

Point.prototype.toString = function() {
  return '(' + this.x + ', ' + this.y + ')';
}
