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
