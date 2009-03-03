function init() {
  var ctx = document.getElementById('canvas').getContext('2d');
  var towers = new Towers(ctx);
  var mover = new DiskMover(ctx, towers);
}
window.addEventListener('load', init, false);


//===========
// Miscellany
//===========
function debug(message) {
  document.getElementById('debug').innerHTML += '<p>' + message + '</p>';
}


//===============
// Event handling
//===============
function DiskMover(ctx, towers) {
  this.ctx = ctx;
  this.towers = towers;
  this.canvas = ctx.canvas;
  this.coordinate_finder = new ElementCoordinateFinder(this.canvas);
  this.configure_event_handlers();
}

DiskMover.prototype.configure_event_handlers = function() {
  // Must use 'self', for when event handler is called, 'this' will refer not to the DiskMover instance I expect,
  // but to the element on which the event occurred -- in this case, the canvas element.
  var self = this;
  this.canvas.addEventListener('mousedown', function(event) { self.on_canvas_mousedown(event); }, false);
  this.canvas.addEventListener('mousemove', function(event) { self.on_canvas_mousemove(event); }, false);
  this.canvas.addEventListener('mouseup',   function(event) { self.on_canvas_mouseup(event); },   false);
}

DiskMover.prototype.on_canvas_mousedown = function(event) {
  var coords = this.coordinate_finder.get_mouse_coordinates(event);
  this.disk = this.towers.get_clicked_disk(coords.x, coords.y);
  if(!this.disk) return;

  this.dx = coords.x - this.disk.x;
  this.dy = coords.y - this.disk.y;
  this.dragging = true;
}

DiskMover.prototype.on_canvas_mousemove = function(event) {
  if(!this.dragging) return;
  var coords = this.coordinate_finder.get_mouse_coordinates(event);
  this.disk.x = coords.x - this.dx;
  this.disk.y = coords.y - this.dy;
  this.towers.draw();
}

DiskMover.prototype.on_canvas_mouseup = function(event) {
  this.dragging = false;
}


//========================
// ElementCoordinateFinder
//========================
function ElementCoordinateFinder(element) {
  this.element = element;
}

ElementCoordinateFinder.prototype.get_mouse_coordinates = function(event) {
  return {'x': event.pageX - this.get_offset_x(),
          'y': event.pageY - this.get_offset_y()};
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


//=======
// Towers
//=======
function Towers(ctx) {
  this.count = 3;
  this.ctx = ctx;
  this.towers = [];

  this.create();
  this.towers[0].add_disk(new Disk());
  this.draw();
}

Towers.prototype.draw = function() {
  this.clear_canvas();
  for(i in this.towers) {
    this.towers[i].draw();
  }
}

Towers.prototype.create = function() {
  var x = 0;
  for(var i = 0; i < this.count; i++) {
    var tower = new Tower(x, 0, this.ctx);
    this.towers.push(tower);
    x += (11/10)*tower.base.width;
  }
}

Towers.prototype.get_clicked_disk = function(x, y) {
  for(i in this.towers) {
    var disks = this.towers[i].disks;
    for(j in disks) {
      if(disks[j].clicked_on(x, y)) return disks[j];
    }
  }
}

Towers.prototype.clear_canvas = function() {
  this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
}


//=======
// Tower
//=======
function Tower(x, y, ctx) {
  this.x = x;
  this.y = y;
  this.ctx = ctx;
  this.disks = [];

  this.base = {'width': 160, 'height': 20};
  this.stem = {'width': 20, 'height': 100};

  this.base.x = this.x;
  this.base.y = this.y + this.stem.height;
  this.stem.x = this.x + (this.base.width/2 - this.stem.width/2);
  this.stem.y = this.y;
}

Tower.prototype.add_disk = function(disk) {
  disk.set_tower(this);
  this.disks.push(disk);
}

Tower.prototype.draw = function() {
  this.draw_self();
  this.draw_disks();
}

Tower.prototype.draw_self = function() {
  this.ctx.save();
  // Draw towers behind existing content, such as the disks of other towers.
  this.ctx.globalCompositeOperation = 'destination-over';
  this.ctx.beginPath();
  this.ctx.rect(this.base.x, this.base.y, this.base.width, this.base.height);
  this.ctx.rect(this.stem.x, this.stem.y, this.stem.width, this.stem.height);
  this.ctx.closePath();
  this.ctx.fill();
  this.ctx.restore();
}

Tower.prototype.draw_disks = function() {
  for(i in this.disks) {
    this.disks[i].draw();
  }
}


//=====
// Disk
//=====
function Disk() { }

Disk.prototype.set_tower = function(tower) {
  this.tower = tower;
  this.update_position_and_size();
}

Disk.prototype.update_position_and_size = function() {
  this.width = this.tower.base.width - 20;
  this.height = 15;
  this.x = (this.tower.base.width - this.width)/2;
  this.y = this.tower.base.y - this.height;
}

Disk.prototype.draw = function() {
  this.tower.ctx.beginPath();
  this.tower.ctx.rect(this.x, this.y, this.width, this.height);
  this.tower.ctx.closePath();

  this.tower.ctx.save();
  this.tower.ctx.fillStyle = '#ffa500';
  this.tower.ctx.fill();
  this.tower.ctx.restore();
}

Disk.prototype.clicked_on = function(x, y) {
  return x >= this.x              &&
         x <  this.x + this.width &&
         y >= this.y              &&
         y <  this.y + this.height;
}
