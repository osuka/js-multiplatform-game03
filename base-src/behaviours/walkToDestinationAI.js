(function () {
  'use strict';

  var AStarModule = require('../external/astar');
  var MovementActuator = require('./movementActuator');
  var behaviourHandler = require('./behaviourHandler');
  var astar = AStarModule.astar;
  
  var WalkToDestinationAI = function () {

    var TINTING = 0;
    var TINTED = 1;

    WalkToDestinationAI.prototype.posToGrid = function (pos) {
      return cc.p(
        pos.x / this.mapGraph.granularity.x,
        pos.y / this.mapGraph.granularity.y
      );
    };

    WalkToDestinationAI.prototype.bodyPosToGrid = function (body) {
      return this.posToGrid(body.getPos());
    };

    WalkToDestinationAI.prototype.getMovementActuator = function (sprite) {
      var m = behaviourHandler.findBehaviour(sprite, MovementActuator);
      if (!m) {
        m = behaviourHandler.addBehaviour(sprite, MovementActuator);
        m.init();
      }
      return m;
    };

    WalkToDestinationAI.prototype.setTargetGridPosition =
    function (sprite, gridPos) {
      var pos = cp.v(
        gridPos.x * this.mapGraph.granularity.x +
          this.mapGraph.granularity.x / 2,
        gridPos.y * this.mapGraph.granularity.y +
          this.mapGraph.granularity.y / 2
      );
      this.getMovementActuator(sprite).setTargetPosition(sprite, pos);
    };

    WalkToDestinationAI.prototype.name = 'WalkToDestinationAI';

    WalkToDestinationAI.prototype.init = function (sprite, destination,
      mapGraph) {
      this.destination = destination;
      this.mapGraph = mapGraph;

      var _this = this;

      var callBack = cc.CallFunc.create(function () {
        _this.tinted = TINTED;
      }, this);
      var action = cc.TintTo.create(0.5, 0, 240, 0);
      this.tinted = TINTING;
      this.tintedAction = cc.Sequence.create(action, callBack);
      sprite.runAction(this.tintedAction);

      // calculate path
      var xy0 = this.bodyPosToGrid(sprite.getBody());
      var xy1 = this.posToGrid(destination);
      this.path = astar.search(
        this.mapGraph.graph,
        this.mapGraph.graph.grid[Math.floor(xy0.x)][Math.floor(xy0.y)],
        this.mapGraph.graph.grid[Math.floor(xy1.x)][Math.floor(xy1.y)] /*end*/
        //,{ heuristic: astar.heuristics.diagonal }
      );
      cc.log(this.path);
      this.pathPos = 0;

      // create a 'target constraint'
      if (this.path.length) {
        this.setTargetGridPosition(sprite, this.path[this.pathPos]);
      }
    };

    WalkToDestinationAI.prototype.detach = function (sprite) {
      if (this.tinted === TINTING) {
        sprite.stopAction(this.tintedAction);
      }

      // undo any possible tinting
      var spriteAction = cc.TintTo.create(0.25, 255, 255, 255);
      sprite.runAction(spriteAction);
      this.tintedAction = spriteAction;

      this.tinted = undefined;

    };

    WalkToDestinationAI.prototype.update = function (dt, sprite) {

      if (!this.path.length || this.pathPos >= this.path.length) {
        // end this AI
        return 'detach';
      }

      if (this.getMovementActuator(sprite).isAtTargetPosition(sprite)) {
        this.pathPos += 1;
        if (this.pathPos < this.path.length) {
          this.setTargetGridPosition(sprite, this.path[this.pathPos]);
        }
      }

      return true;

    };

  };
   
  module.exports = WalkToDestinationAI;
})();
