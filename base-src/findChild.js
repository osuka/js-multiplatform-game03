(function () {
  'use strict';

  var FindChild = {};

  // Helper function to lookup an object by TAG in a hierarchy
  //
  FindChild.findChildByTagRecursive = function (base, tag) {
    var obj = base.getChildByTag(tag);
    if (!obj) {
      var children = base.getChildren();
      for (var i = children.length - 1; i >= 0 && !obj; i--) {
        obj = FindChild.findChildByTagRecursive(children[i], tag);
      }
    }
    return obj;
  };

  module.exports = FindChild;
})();