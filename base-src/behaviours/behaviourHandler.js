(function () {
  'use strict';    // can search in list / directly in object

  var BehaviourHandler = {
    findBehaviour: function (sprite, BehaviourClass) {
      if (!sprite.behaviours) {
        return;
      }
      for (var j = 0; j < sprite.behaviours.length; j++) {
        var behaviour = sprite.behaviours[j];
        if (behaviour.name === BehaviourClass.prototype.name) {
          return behaviour;
        }
      }
    },

    // remove behaviour from a sprite
    removeBehaviour: function (sprite, BehaviourClass) {
      if (!sprite.behaviours) {
        return;
      }
      for (var j = 0; j < sprite.behaviours.length; j++) {
        if (sprite.behaviours[j].name === BehaviourClass.prototype.name) {
          var behaviour = sprite.behaviours[j];
          sprite.behaviours.splice(j, 1); // delete element
          if (typeof behaviour.detach === 'function') {
            behaviour.detach(sprite);
            return;
          }
        }
      }
    },

    removeBehaviourInstance: function (sprite, behaviour) {
      if (!sprite.behaviours) {
        return;
      }
      for (var j = 0; j < sprite.behaviours.length; j++) {
        if (sprite.behaviours[j] === behaviour) {
          sprite.behaviours.splice(j, 1); // delete element
          if (typeof behaviour.detach === 'function') {
            behaviour.detach(sprite);
            return;
          }
        }
      }
    },

    // add behaviour to a sprite
    addBehaviour: function (sprite, BehaviourClass) {
      if (!sprite.behaviours) {
        sprite.behaviours = [];
      }
      var behaviour = new BehaviourClass();
      if (this.findBehaviour(sprite, BehaviourClass)) {
        console.log('Attempt to duplicate behaviour');
        return;
      }
      sprite.behaviours.push(behaviour);
      return behaviour;
    },

    // Runs sprite defined behaviours until one returns false or
    // there's no more
    runBehaviours: function (dt, sprite, body) {
      if (!sprite.behaviours) {
        return;
      }
      var toRemove = [];
      for (var i = sprite.behaviours.length - 1; i >= 0; i--) {
        var behaviour = sprite.behaviours[i];
        var ret = behaviour.update(dt, sprite, body);
        if (ret === 'detach') {
          toRemove.push(behaviour);
        }
        if (!ret) {
          break;
        }
      }
      for (var j = 0; j < toRemove.length; j++) {
        this.removeBehaviourInstance(sprite, toRemove[j]);
      }
    },

  };

  module.exports = BehaviourHandler;
})();