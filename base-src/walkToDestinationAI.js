(function () {
  'use strict';

  var AStarModule = require('./external/astar.js');
  var astar = AStarModule.astar;
  
  var WalkToDestinationAI = function () {

    var TINTING = 0;
    var TINTED = 1;
    var self = this;

    var posToGrid = function (pos) {
      return cc.p(
        pos.x / self.mapGraph.granularity.x,
        pos.y / self.mapGraph.granularity.y
      );
    };

    var bodyPosToGrid = function (body) {
      return posToGrid(body.getPos());
    };

    var updateConstraintToGridXY = function (sprite, pos) {
      var space = sprite.getBody().space;
      self.targetPos = cp.v(
        pos.x * self.mapGraph.granularity.x + self.mapGraph.granularity.x / 2,
        pos.y * self.mapGraph.granularity.y + self.mapGraph.granularity.y / 2
      );
      var fun = function () {
        if (self.targetConstraint) {
          space.removeConstraint(self.targetConstraint);
        }
        // http://chipmunk-physics.net/forum/viewtopic.php?f=1&t=1705
        self.targetConstraint = new cp.PivotJoint(
          sprite.getBody(),
          space.staticBody,
          cp.v(0, 0),
          self.targetPos
        );
        self.targetConstraint.maxForce = 10000;
        space.addConstraint(self.targetConstraint);
      };
      if (space.isLocked()) {
        space.addPostStepCallback(fun);
      } else {
        fun();
      }
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
      var xy0 = bodyPosToGrid(sprite.getBody());
      var xy1 = posToGrid(destination);
      this.path = astar.search(
        this.mapGraph.graph,
        this.mapGraph.graph.grid[Math.floor(xy0.x)][Math.floor(xy0.y)],
        this.mapGraph.graph.grid[Math.floor(xy1.x)][Math.floor(xy1.y)] /*end*/,
        { heuristic: astar.heuristics.diagonal }
      );
      cc.log(this.path);
      this.pathPos = 0;

      // create a 'target constraint'
      if (this.path.length) {
        updateConstraintToGridXY(sprite, this.path[this.pathPos]);
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

    WalkToDestinationAI.prototype.update = function (dt, sprite, body) {

      body.setAngVel(0);
      body.setAngle(0);

      if (!this.path.length || this.pathPos >= this.path.length) {
        // end this AI
        return 'detach';
      }

      var dist = cp.v.dist(sprite.getBody().getPos(), this.targetPos);
      if (dist < 2) {
        this.pathPos += 1;
        if (this.pathPos < this.path.length) {
          updateConstraintToGridXY(sprite, this.path[this.pathPos]);
        }
      }

      return false;

    };

  };
   
  module.exports = WalkToDestinationAI;
})();
