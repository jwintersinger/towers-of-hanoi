function init() {
  new Towers(document.getElementById('canvas').getContext('2d'));
  configure_event_handlers();
}
window.addEventListener('load', init, false);


//===========
// Miscellany
//===========
function debug(message) {
  document.getElementById('debug').innerHTML += '<p>' + message + '</p>';
}

function clear_canvas(ctx) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}


//===============
// Event handling
//===============
function configure_event_handlers() {
  document.getElementById('canvas').addEventListener('click', on_canvas_click, false);
}

function on_canvas_click(evt) {
  var canvas = document.getElementById('canvas');
  var canvas_x = evt.pageX - get_offset_x(canvas);
  var canvas_y = evt.pageY - get_offset_y(canvas);

  canvas.getContext('2d').fillRect(canvas_x, canvas_y, 1, 1);

  var disk = blah[0].disks[0];
  if(canvas_x >= disk.x &&
     canvas_x < disk.x + disk.width &&
     canvas_y >= disk.y &&
     canvas_y < disk.y + disk.height) {
    debug('Disk clicked');
  } else {
    debug('Disk not clicked');
  }
}

function get_offset(node, type) {
  var offset_property = (type == 'x' ? 'offsetLeft' : 'offsetTop');
  var result = node[offset_property];
  for(var parent = node; parent = parent.offSetParent; parent != null) {
    result += parent[offset_property];
  }
  return result;
}

function get_offset_x(node) {
  return get_offset(node, 'x');
}

function get_offset_y(node) {
  return get_offset(node, 'y');
}


//=======
// Towers
//=======
function Towers(ctx) {
  this.count = 3;
  this.ctx = ctx;
  this.towers = [];
  blah = this.towers; // TODO: eliminate use of global variable

  this.create();
  this.towers[0].add_disk(new Disk());
  this.draw();
}

Towers.prototype.draw = function() {
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
  this.ctx.beginPath();
  this.ctx.rect(this.base.x, this.base.y, this.base.width, this.base.height);
  this.ctx.rect(this.stem.x, this.stem.y, this.stem.width, this.stem.height);
  this.ctx.closePath();
  this.ctx.fill();
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
