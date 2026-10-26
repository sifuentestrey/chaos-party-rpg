// node_modules/rot-js/lib/constants.js
var DIRS = {
  4: [[0, -1], [1, 0], [0, 1], [-1, 0]],
  8: [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]],
  6: [[-1, -1], [1, -1], [2, 0], [1, 1], [-1, 1], [-2, 0]]
};

// node_modules/rot-js/lib/path/path.js
var Path = class {
  constructor(toX, toY, passableCallback, options = {}) {
    this._toX = toX;
    this._toY = toY;
    this._passableCallback = passableCallback;
    this._options = Object.assign({
      topology: 8
    }, options);
    this._dirs = DIRS[this._options.topology];
    if (this._options.topology == 8) {
      this._dirs = [
        this._dirs[0],
        this._dirs[2],
        this._dirs[4],
        this._dirs[6],
        this._dirs[1],
        this._dirs[3],
        this._dirs[5],
        this._dirs[7]
      ];
    }
  }
  _getNeighbors(cx, cy) {
    let result = [];
    for (let i = 0; i < this._dirs.length; i++) {
      let dir = this._dirs[i];
      let x = cx + dir[0];
      let y = cy + dir[1];
      if (!this._passableCallback(x, y)) {
        continue;
      }
      result.push([x, y]);
    }
    return result;
  }
};

// node_modules/rot-js/lib/path/astar.js
var AStar = class extends Path {
  constructor(toX, toY, passableCallback, options = {}) {
    super(toX, toY, passableCallback, options);
    this._todo = [];
    this._done = {};
  }
  /**
   * Compute a path from a given point
   * @see ROT.Path#compute
   */
  compute(fromX, fromY, callback) {
    this._todo = [];
    this._done = {};
    this._fromX = fromX;
    this._fromY = fromY;
    this._add(this._toX, this._toY, null);
    while (this._todo.length) {
      let item2 = this._todo.shift();
      let id = item2.x + "," + item2.y;
      if (id in this._done) {
        continue;
      }
      this._done[id] = item2;
      if (item2.x == fromX && item2.y == fromY) {
        break;
      }
      let neighbors = this._getNeighbors(item2.x, item2.y);
      for (let i = 0; i < neighbors.length; i++) {
        let neighbor = neighbors[i];
        let x = neighbor[0];
        let y = neighbor[1];
        let id2 = x + "," + y;
        if (id2 in this._done) {
          continue;
        }
        this._add(x, y, item2);
      }
    }
    let item = this._done[fromX + "," + fromY];
    if (!item) {
      return;
    }
    while (item) {
      callback(item.x, item.y);
      item = item.prev;
    }
  }
  _add(x, y, prev) {
    let h = this._distance(x, y);
    let obj = {
      x,
      y,
      prev,
      g: prev ? prev.g + 1 : 0,
      h
    };
    let f = obj.g + obj.h;
    for (let i = 0; i < this._todo.length; i++) {
      let item = this._todo[i];
      let itemF = item.g + item.h;
      if (f < itemF || f == itemF && h < item.h) {
        this._todo.splice(i, 0, obj);
        return;
      }
    }
    this._todo.push(obj);
  }
  _distance(x, y) {
    switch (this._options.topology) {
      case 4:
        return Math.abs(x - this._fromX) + Math.abs(y - this._fromY);
        break;
      case 6:
        let dx = Math.abs(x - this._fromX);
        let dy = Math.abs(y - this._fromY);
        return dy + Math.max(0, (dx - dy) / 2);
        break;
      case 8:
        return Math.max(Math.abs(x - this._fromX), Math.abs(y - this._fromY));
        break;
    }
  }
};
export {
  AStar as default
};
