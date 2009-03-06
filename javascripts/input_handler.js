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
