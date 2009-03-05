function init() {
  debug = new Debug(); // TODO: convert to singleton to eliminate global variable.
  new Game();
}
window.addEventListener('load', init, false);

//===========
// Miscellany
//===========
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


//=====
// Game
//=====
function Game() {
  this.start_new();
}

Game.prototype.start_new = function() {
  debug.msg('New game');

  var ctx = document.getElementById('canvas').getContext('2d');
  var tower_manager = new TowerManager(ctx);
  var input_handler = new InputHandler(ctx, tower_manager);
  var game_state = new GameState(tower_manager, input_handler);
  var victory_celebrator = new VictoryCelebrator(input_handler);
  game_state.on_victory = function() { victory_celebrator.on_victory(); }

  tower_manager.draw();
}


//======
// Debug
//======
function Debug() {
  this.output = document.getElementById('debug');
}

Debug.prototype.msg = function(message) {
  this.output.innerHTML += '<p>' + message + '</p>';
}

Debug.prototype.clear = function() {
  this.output.innerHTML = '';
}


//=============
// InputHandler
//=============
function InputHandler(ctx, tower_manager) {
  this.ctx = ctx;
  this.tower_manager = tower_manager;
  this.canvas = ctx.canvas;
  this.coordinate_finder = new ElementCoordinateFinder(this.canvas);
  this.add_event_handlers();
  this.enable_input();
}

InputHandler.prototype.add_event_handlers = function() {
  debug.msg('Adding event listeners');
  // Must use 'self', for when event handler is called, 'this' will refer not to the InputHandler instance I expect,
  // but to the element on which the event occurred -- in this case, the canvas element.
  var self = this;
  // TODO: make clicked-on disk always draw on top of other disks.
  this.canvas.addEventListener('mousedown', function(event) { self.on_canvas_mousedown(event); }, false);
  this.canvas.addEventListener('mousemove', function(event) { self.on_canvas_mousemove(event); }, false);
  this.canvas.addEventListener('mouseup',   function(event) { self.on_canvas_mouseup(event); },   false);
}

InputHandler.prototype.on_canvas_mousedown = function(event) {
  if(!this.allow_input) return;
  var coords = this.coordinate_finder.get_mouse_coordinates(event);
  this.disk = this.tower_manager.get_clicked_disk(coords.x, coords.y);
  if(!this.disk || !this.disk.is_top_disk()) return;

  this.dx = coords.x - this.disk.x;
  this.dy = coords.y - this.disk.y;
  this.dragging = true;
}

InputHandler.prototype.on_canvas_mousemove = function(event) {
  if(!this.dragging) return;
  var coords = this.coordinate_finder.get_mouse_coordinates(event);
  this.disk.move_to(coords.x - this.dx, coords.y - this.dy);
  this.tower_manager.draw();

  //debug.clear();
  //debug.msg('Distance to tower 1: ' + this.disk.centre.distance_to(this.tower_manager.towers[0].top));
  //debug.msg('Distance to tower 2: ' + this.disk.centre.distance_to(this.tower_manager.towers[1].top));
  //debug.msg('Distance to tower 3: ' + this.disk.centre.distance_to(this.tower_manager.towers[2].top));
}

InputHandler.prototype.on_canvas_mouseup = function(event) {
  if(!this.dragging) return;
  this.dragging = false;
  var closest_tower = this.tower_manager.find_closest_tower(this.disk.centre);
  this.disk.transfer_to_tower(closest_tower);
  this.tower_manager.draw();
}

InputHandler.prototype.disable_input = function() {
  debug.msg('Input disabled');
  this.allow_input = false;
}

InputHandler.prototype.enable_input = function() {
  debug.msg('Input enabled');
  this.allow_input = true;
}


//======
// Point
//======
function Point(x, y) {
  this.x = x;
  this.y = y;
}

Point.prototype.distance_to = function(other) {
  return Math.sqrt(Math.pow(other.x - this.x, 2) + Math.pow(other.y - this.y, 2));
}

//========================
// ElementCoordinateFinder
//========================
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


//=============
// TowerManager
//=============
function TowerManager(ctx) {
  this.ctx = ctx;
  this.towers_count = 3;
  this.disks_count = 2;
  this.create_towers();
  this.add_initial_disks();
}

TowerManager.prototype.add_initial_disks = function() {
  var width = this.towers[0].base.width;
  for(var i = 0; i < this.disks_count; i++) {
    width -= 20;
    new Disk(this.towers[0], width, generate_random_colour());
  }
}

TowerManager.prototype.draw = function() {
  this.clear_canvas();
  for(i in this.towers) {
    this.towers[i].draw();
  }
}

TowerManager.prototype.create_towers = function() {
  this.towers = [];
  var x = 0;
  for(var i = 0; i < this.towers_count; i++) {
    var tower = new Tower(x, 0, this.ctx);
    this.towers.push(tower);
    x += (11/10)*tower.base.width;
  }
}

TowerManager.prototype.get_clicked_disk = function(x, y) {
  var disks = this.get_all_disks();
  for(i in disks) {
    if(disks[i].is_clicked_on(x, y)) return disks[i];
  }
}

TowerManager.prototype.get_all_disks = function() {
  var disks = [];
  for(i in this.towers) disks = disks.concat(this.towers[i].disks);
  return disks;
}

TowerManager.prototype.find_closest_tower = function(point) {
  // TODO: refactor to eliminate duplication
  var closest_tower = this.towers[0];
  var closest_distance = this.towers[0].top.distance_to(point);

  for(var i = 1; i < this.towers.length; i++) {
    var distance = this.towers[i].top.distance_to(point);
    if(distance < closest_distance) {
      closest_tower = this.towers[i];
      closest_distance = distance;
    }
  }
  return closest_tower;
}

TowerManager.prototype.clear_canvas = function() {
  this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
}

TowerManager.prototype.toString = function() {
  return 'TowerManager( ' + this.towers + ' )';
}

//==========
// GameState
//==========
function GameState(tower_manager) {
  this.tower_manager = tower_manager;
  this.connect_to_disks();
  this.last_complete_tower = this.find_complete_tower();
}

GameState.prototype.on_disk_transferred = function() {
  var complete_tower = this.find_complete_tower();
  if(complete_tower && complete_tower != this.last_complete_tower) {
    this.last_complete_tower = complete_tower;
    this.on_victory();
  }
}

GameState.prototype.find_complete_tower = function() {
  var towers = this.tower_manager.towers;
  for(var i in towers) {
    if(towers[i].disks.length == this.count_total_disks()) return towers[i];
  }
}

GameState.prototype.count_total_disks = function() {
  return this.tower_manager.get_all_disks().length;
}

GameState.prototype.connect_to_disks = function() {
  var disks = this.tower_manager.get_all_disks();
  var self = this;
  for(var i in disks) {
    // Must use closure and 'self' -- only in so doing do we have access to GameState object.
    // 'this' refers to the object that calls the method -- in this case, the Disk object.
    disks[i].on_disk_transferred = function() { self.on_disk_transferred(); }
  }
}

// Called when player is victorious. External agents may override this property to implement victory behaviour.
GameState.prototype.on_victory = function() { }


//==================
// VictoryCelebrator
//==================
function VictoryCelebrator(input_handler) {
  this.input_handler = input_handler;
}

VictoryCelebrator.prototype.on_victory = function() {
  debug.msg('Victory!');
  this.input_handler.disable_input();
}


//=======
// Tower
//=======
// TODO: refactor to use Point class throughout.
// TODO: remove index parameter in constructor and from class
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

  this.top = new Point(this.stem.x + this.stem.width/2, this.stem.y);
  this.disks_top = this.base.y;
}

Tower.prototype.toString = function() {
  return 'Tower(x=' + this.x + ', y=' + this.y + ')';
}

Tower.prototype.add_disk = function(disk) {
  this.disks.push(disk);
  this.disks_top -= disk.height;
}

Tower.prototype.remove_disk = function(disk) {
  this.disks.splice(this.disks.indexOf(disk), 1);
  this.disks_top += disk.height;
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
  for(i in this.disks)
    this.disks[i].draw();
}

Tower.prototype.get_top_disk = function() {
  return this.disks[this.disks.length - 1];
}


//=====
// Disk
//=====
// TODO: refactor to use Point class throughout.
function Disk(tower, width, colour) {
  this.colour = colour;
  this.width = width;
  this.height = 15;
  this.transfer_to_tower(tower);
}

Disk.prototype.move_to = function(x, y) {
  this.x = x;
  this.y = y;
  this.centre = new Point(this.x + this.width/2, this.y + this.height/2);
}

Disk.prototype.transfer_to_tower = function(destination) {
  var top_disk = destination.get_top_disk();
  // Do not permit disks wider than tower's existing top disk to transfer to that
  // tower -- in such a case, move the disk back to its original tower.
  if(top_disk && top_disk.width < this.width) destination = this.tower;;

  if(this.tower) this.tower.remove_disk(this);
  this.move_to(destination.x + (destination.base.width - this.width)/2,
               destination.y + (destination.disks_top - this.height));
  destination.add_disk(this);
  this.tower = destination;

  this.on_disk_transferred();
}

Disk.prototype.draw = function() {
  this.tower.ctx.beginPath();
  this.tower.ctx.rect(this.x, this.y, this.width, this.height);
  this.tower.ctx.closePath();

  this.tower.ctx.save();
  this.tower.ctx.fillStyle = this.colour;
  this.tower.ctx.fill();
  this.tower.ctx.restore();
}

Disk.prototype.is_clicked_on = function(x, y) {
  return x >= this.x              &&
         x <  this.x + this.width &&
         y >= this.y              &&
         y <  this.y + this.height;
}

Disk.prototype.is_top_disk = function() {
  return this == this.tower.get_top_disk();
}

Disk.prototype.toString = function() {
  return 'Disk(width=' + this.width + ', colour=' + this.colour + ')'
}

// Called when disk is transferred to any tower (including directly back to same tower). External agents
// may override to implement custom behaviour.
Disk.prototype.on_disk_transferred = function() { }
