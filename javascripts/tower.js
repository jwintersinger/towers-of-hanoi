function Tower(position, stem_height, ctx) {
  this.position = position;
  this.ctx = ctx;
  this.disks = [];

  this.base = {'width': 160, 'height': 20};
  this.stem = {'width': 20, 'height': stem_height};
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
