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
