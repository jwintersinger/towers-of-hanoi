function Canvas(canvas_id) {
  this.canvas_id = canvas_id;
  this.recreate();
  this.resize_to_client_width();
}

Canvas.prototype.load_canvas = function() {
  this.canvas = document.getElementById(this.canvas_id);
  this.ctx = this.canvas.getContext('2d');
}

Canvas.prototype.resize_to_client_width = function() {
  this.canvas.width = window.innerWidth;
}


Canvas.prototype.clear = function() {
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
}

// Necessary to quash bug in which redraw of old game state occurs after victory, redrawing old game state over new,
// rendering the new game invisible until player forces redraw by clicking on disk. For details, see comment beginning
// "All right, prepare for things to get downright wacky" in InputHandler.prototype.on_canvas_mouseup.
Canvas.prototype.recreate = function() {
  this.load_canvas();
  var canvas_prime = this.canvas.cloneNode(false);
  this.canvas.parentNode.replaceChild(canvas_prime, this.canvas);
  this.load_canvas();
}
