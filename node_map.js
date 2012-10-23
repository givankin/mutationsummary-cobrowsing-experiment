/*jshint forin: false */
(function(global) {

  function NodeMap() {
    this.map_ = {};
  }

  var ID_PROP = '__mutation_summary_node_map_id__';
  var nextId_ = 1;

  function ensureId(node) {
    if (!node[ID_PROP]) {
      node[ID_PROP] = nextId_++;
      return true;
    }

    return false;
  }

  NodeMap.prototype = {
    set: function(node, value) {
      ensureId(node);
      this.map_[node[ID_PROP]] = {k: node, v: value};
    },
    get: function(node) {
      if (ensureId(node)) {
        return;
      }
      var byId = this.map_[node[ID_PROP]];
      if (byId) {
        return byId.v;
      }
    },
    has: function(node) {
      return !ensureId(node) && node[ID_PROP] in this.map_;
    },
    'delete': function(node) {
      if (ensureId(node)) {
        return;
      }
      delete this.map_[node[ID_PROP]];
    },
    keys: function() {
      var nodes = [];
      for (var id in this.map_) {
        nodes.push(this.map_[id].k);
      }
      return nodes;
    }
  };

  global.NodeMap = NodeMap;

})(this);
