
Object.prototype.toString = function toString() {
  let values = Object.keys(this).map(key => {
    if(key == 'created_on') {
      this[key] = this[key].toDateString();
    }
    return `${this[key]}`.padStart(12);
  });
  return values.join(' | ');
}

function logAndExist(error) {
  console.log(error);
  process.exit();
}

module.exports = {
  logAndExist
}