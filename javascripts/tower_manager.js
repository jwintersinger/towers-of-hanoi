function TowerManager(canvas, disks_count) {
  this.canvas = canvas;
  this.disks_count = parseInt(disks_count, 10);
  this.towers_count = 3;
  this.create_towers();
  this.add_initial_disks();
}

TowerManager.prototype.add_initial_disks = function() {
  var disk_widths = this.calculate_disk_widths();
  while(width = disk_widths.pop()) new Disk(this.towers[0], width, Colour.random().toString());
}

TowerManager.prototype.draw = function() {
  this.canvas.clear();
  for(i in this.towers) {
    this.towers[i].draw();
  }
}

TowerManager.prototype.create_towers = function() {
  this.towers = [];
  var base_width = this.calculate_disk_widths().pop() + 30;
  var stem_height = this.disks_count*Disk.height + 40;
  var base_horizontal_separation = biggest(16, base_width/10);
  var horizontal_padding = 42;
  var vertical_padding = 80;

  var towers_width = base_width*this.towers_count + base_horizontal_separation*(this.towers_count - 1);
  // Calls to this.canvas.set_width and this.canvas.set_height are not combined into a single call to
  // this.canvas.set_size, as canvas width must be known *before* tower is created (so that proper x-offset for tower
  // can be calculated), but canvas height can only be known *after* tower is created (since height of canvas depends
  // on height of tallest tower).
  this.canvas.set_width(towers_width + 2*horizontal_padding);
  var x = (this.canvas.width - towers_width)/2;

  for(var i = 0; i < this.towers_count; i++) {
    // Ideally, towers should be able to resize themselves based on the number of disks they hold, freeing TowerManager
    // from needing to know what size to create them. Rather than take such an approach, though, I have TowerManager
    // calculate the size of the towers for two reasons:
    //
    //   * All towers must be the same size, or otherwise visual consistency is ruined. This means that a tower would
    //     need to know how to resize its brethren, or TowerManager would need to query for the largest tower, then set
    //     the rest of the towers to that size. The first approach violates separation of concerns, since a tower
    //     should only know about itself; the second approach requires TowerManager to deal with resizing towers,
    //     which means I might as well have it calculate the size, too.
    //
    //   * Disks added to towers during game initialization are added in the same manner as when a disk is moved from
    //     tower to tower as a result of user input. As such, if towers were responsible for resizing themselves based
    //     on number of disks, I'd have to create two disk-adding routines: one during game initialization that causes
    //     the towers to dynamically resize, and one used during gameplay that does not cause such resizes to occur.
    //
    // Given these concerns, I determined that including tower size-calculation logic in TowerManager is acceptable.
    var tower = new Tower(new Point(x, vertical_padding), base_width, stem_height, this.canvas.ctx);
    this.towers.push(tower);
    x += base_width + base_horizontal_separation;
  }
  this.canvas.set_height(this.towers[0].height + 2*vertical_padding);
}

TowerManager.prototype.calculate_disk_widths = function() {
  var disk_widths = [];
  var width = 40;
  for(var i = 0; i < this.disks_count; i++) {
    disk_widths.push(width += 20);
  }
  return disk_widths;
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


TowerManager.prototype.toString = function() {
  return 'TowerManager( ' + this.towers + ' )';
}
