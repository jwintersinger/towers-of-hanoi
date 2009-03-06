function ElementCoordinateFinder(element) {
  this.element = element;
}

ElementCoordinateFinder.prototype.get_mouse_coordinates = function(event) {
  return new Point(event.pageX - this.get_offset_x(), event.pageY - this.get_offset_y());
}

ElementCoordinateFinder.prototype.get_offset = function(type) {
  var offset_property = (type == 'x' ? 'offsetLeft' : 'offsetTop');
  var result = this.element[offset_property];
  for(var parent = this.element; parent = parent.offSetParent; parent != null) {
    result += parent[offset_property];
  }
  return result;
}

ElementCoordinateFinder.prototype.get_offset_x = function() {
  return this.get_offset('x');
}

ElementCoordinateFinder.prototype.get_offset_y = function() {
  return this.get_offset('y');
}
