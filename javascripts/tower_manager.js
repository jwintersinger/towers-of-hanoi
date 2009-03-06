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
