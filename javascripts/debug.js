function Debug() {
  this.output = document.getElementById('debug');
}

Debug.prototype.msg = function(message) {
  this.output.innerHTML += '<p>' + message + '</p>';
}

Debug.prototype.clear = function() {
  this.output.innerHTML = '';
}
