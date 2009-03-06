function Game(disks_count) {
  this.start_new(disks_count);
}

Game.prototype.start_new = function(disks_count) {
  debug.msg('New game');

  var canvas = new Canvas('canvas');
  var tower_manager = new TowerManager(canvas, disks_count);
  var input_handler = new InputHandler(canvas.ctx, tower_manager);
  var game_state = new GameState(tower_manager, input_handler);
  var victory_celebrator = new VictoryCelebrator(input_handler);
  game_state.on_victory = function() { victory_celebrator.on_victory(); }

  tower_manager.draw();
}
