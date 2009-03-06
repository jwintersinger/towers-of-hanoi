function init() {
  debug = new Debug(); // TODO: convert to singleton to eliminate global variable.
  new Game(2);
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
function Game(disks_count) {
  this.start_new(disks_count);
}

Game.prototype.start_new = function(disks_count) {
  debug.msg('New game');

  this.recreate_canvas();
  var ctx = this.canvas.getContext('2d');
  var tower_manager = new TowerManager(ctx, disks_count);
  var input_handler = new InputHandler(ctx, tower_manager);
  var game_state = new GameState(tower_manager, input_handler);
  var victory_celebrator = new VictoryCelebrator(input_handler);
  game_state.on_victory = function() { victory_celebrator.on_victory(); }

  tower_manager.draw();
}

// Necessary to quash bug in which redraw of old game state occurs after victory, redrawing old game state over new,
// rendering the new game invisible until player forces redraw by clicking on disk. For details, see comment beginning
// "All right, prepare for things to get downright wacky" in InputHandler.prototype.on_canvas_mouseup.
Game.prototype.recreate_canvas = function() {
  this.canvas = document.getElementById('canvas');
  var canvas_prime = this.canvas.cloneNode(false);
  this.canvas.parentNode.replaceChild(canvas_prime, this.canvas);
  this.canvas = canvas_prime;
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
  this.add_event_listeners();
  this.enable_input();
}

InputHandler.prototype.add_event_listeners = function() {
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
  this.disk = this.tower_manager.get_clicked_disk(coords);
  if(!this.disk || !this.disk.is_top_disk()) return;

  this.mouse_delta = coords.subtract(this.disk.position);
  this.dragging = true;
}

InputHandler.prototype.on_canvas_mousemove = function(event) {
  if(!this.dragging) return;
  var coords = this.coordinate_finder.get_mouse_coordinates(event);
  this.disk.move_to(coords.subtract(this.mouse_delta));
  this.tower_manager.draw();
  this.show_distance_to_each_tower();
}

InputHandler.prototype.show_distance_to_each_tower = function() {
  debug.clear();
  debug.msg('Distance to tower 1: ' + this.disk.centre.distance_to(this.tower_manager.towers[0].top));
  debug.msg('Distance to tower 2: ' + this.disk.centre.distance_to(this.tower_manager.towers[1].top));
  debug.msg('Distance to tower 3: ' + this.disk.centre.distance_to(this.tower_manager.towers[2].top));
}

InputHandler.prototype.on_canvas_mouseup = function(event) {
  if(!this.dragging) return;
  this.dragging = false;
  var closest_tower = this.tower_manager.find_closest_tower(this.disk.centre);
  this.disk.transfer_to_tower(closest_tower);
  // All right, prepare for things to get downright wacky. The line below is at the root of a difficult-to-find
  // bug in which, after the game is won and a new one is started, the canvas is redrawn with the old disks in the
  // position that won the game, rendering the new disks invisible. The flow of the application is as follows:
  //
  //   * The line above (this.disk.transfer_to_tower) causes GameState's on_disk_transferred callback to be called.
  //   * When the game is won, GameState's on_disk_transferred in turn calls VictoryCelebrator's on_victory callback.
  //   * VictoryCelebrator's on_victory creates a new game. Everything happens as one would expect -- new towers and
  //     associated disks are created, and the canvas is redrawn to show the new towers & disks.
  //   * When Game's constructor exits, having initialized the new game, the call stack unwinds. Execution returns to
  //     the end of VictoryCelebrator.on_victory, then the end of GameState.on_disk_transferred, then the end of
  //     Disk.transfer_to_tower, then the end of InputHandler.on_canvas_mouseup -- that's here! (Call stack also
  //     unwinds through anonymous closures wrapping calls to VictoryCelebrator.on_victory and
  //     GameState.on_disk_transferred, but we don't count those.) With the call above to Disk.transfer_to_tower having
  //     completed, the line below is executed.
  //
  // The problem below is that this.tower_manager refers to the *old* TowerManager, with the old towers and the old
  // disks, but the same canvas element as is used in the new game. Thus, the canvas is overwritten with the old towers
  // and disks. To see the proper game state, the player must then click on the invisible new disk located on the
  // first tower -- doing so will force a redraw, showing the proper game state.
  //
  // I see no obvious way to correct this at this location, for the call to this.tower_manager.draw must come after the
  // disk being dragged by the player has been moved to its new tower. Instead, in Game's initialization code, I shall
  // recreate the canvas element. The post-victory redraw responsible for the bug shall then draw to a canvas element no
  // longer within the document (but still valid, for it remains in memory -- garbage collection will destroy it in
  // time).
  //
  // Incidentally, Firebug's Javascript debugger was invaluable in tracking the source of this issue -- without Firebug,
  // I doubt I'd have figured it out. For whatever reason, with Firebug 1.3.3, the debugger wouldn't work when the
  // document was accessed locally (through file://..., not through a Web server). Accessing the document on a remote
  // server allowed Firebug's Javascript debugger to work, however.
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
function TowerManager(ctx, disks_count) {
  this.ctx = ctx;
  this.disks_count = parseInt(disks_count, 10);
  this.towers_count = 3;
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
    var tower = new Tower(new Point(x, 0), this.ctx);
    this.towers.push(tower);
    x += (11/10)*tower.base.width;
  }
}

TowerManager.prototype.get_clicked_disk = function(point) {
  var disks = this.get_all_disks();
  for(i in disks) {
    if(disks[i].is_clicked_on(point)) return disks[i];
  }
}

TowerManager.prototype.get_all_disks = function() {
  var disks = [];
  for(i in this.towers) disks = disks.concat(this.towers[i].disks);
  return disks;
}

TowerManager.prototype.find_closest_tower = function(point) {
  var distances = [];
  for(i in this.towers) {
    distances.push({'tower':    this.towers[i],
                    'distance': this.towers[i].top.distance_to(point)});
  }
  distances.sort(function(a, b) { return a.distance - b.distance; });
  return distances[0]['tower'];
}


// This method might be more comfortable in another class -- its purpose is somewhat orthogonal to TowerManager's.
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
  this.input_handler.disable_input();

  var victory_notification = document.getElementById('victory-notification');
  victory_notification.style.display = 'block';
  document.getElementById('play-again').addEventListener('click', function() {
      victory_notification.style.display = 'none';
      new Game(document.getElementById('disks-count').value);
  }, false);
}


//=======
// Tower
//=======
function Tower(position, ctx) {
  this.position = position;
  this.ctx = ctx;
  this.disks = [];

  this.base = {'width': 160, 'height': 20};
  this.stem = {'width': 20, 'height': 100};
  this.base.position = new Point(this.position.x, this.position.y + this.stem.height);
  this.stem.position = new Point(this.position.x + (this.base.width/2 - this.stem.width/2), this.position.y);

  this.top = new Point(this.stem.position.x + this.stem.width/2, this.stem.position.y);
  this.disks_top = this.base.position.y;
}

Tower.prototype.toString = function() {
  return 'Tower(x=' + this.position.x + ', y=' + this.position.y + ')';
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
  this.ctx.rect(this.base.position.x, this.base.position.y, this.base.width, this.base.height);
  this.ctx.rect(this.stem.position.x, this.stem.position.y, this.stem.width, this.stem.height);
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
function Disk(tower, width, colour) {
  this.colour = colour;
  this.width = width;
  this.height = 15;
  this.transfer_to_tower(tower);
}

Disk.prototype.move_to = function(point) {
  this.position = point;
  this.centre = new Point(this.position.x + this.width/2, this.position.y + this.height/2);
}

Disk.prototype.transfer_to_tower = function(destination) {
  var top_disk = destination.get_top_disk();
  // Do not permit disks wider than tower's existing top disk to transfer to that
  // tower -- in such a case, move the disk back to its original tower.
  if(top_disk && top_disk.width < this.width) destination = this.tower;;

  if(this.tower) this.tower.remove_disk(this);
  this.move_to(new Point(destination.position.x + (destination.base.width - this.width)/2,
                         destination.position.y + (destination.disks_top - this.height)));
  destination.add_disk(this);
  this.tower = destination;

  this.on_disk_transferred();
}

Disk.prototype.draw = function() {
  this.tower.ctx.beginPath();
  this.tower.ctx.rect(this.position.x, this.position.y, this.width, this.height);
  this.tower.ctx.closePath();

  this.tower.ctx.save();
  this.tower.ctx.fillStyle = this.colour;
  this.tower.ctx.fill();
  this.tower.ctx.restore();
}

Disk.prototype.is_clicked_on = function(point) {
  return point.x >= this.position.x              &&
         point.x <  this.position.x + this.width &&
         point.y >= this.position.y              &&
         point.y <  this.position.y + this.height;
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
