(function () {
  'use strict';
  
  var WalkToGoalAI = function () {

    WalkToGoalAI.prototype.name = 'WalkToGoalAI';

    WalkToGoalAI.prototype.init = function (goal) {
      this.direction = cp.v(0, 0);
      this.timeFromLastDirectionChangeMs = 0;
      this.speed = 100 + Math.floor(Math.random() * 400);
      this.goal = goal;
    };

    // Table mapping current direction and next possible ones
    WalkToGoalAI.prototype._directionChanges = {
      //state : [ [weight_distribution, dir] ]
      '0,0' : [ [0.15, cp.v(1, 0)],
                [0.3, cp.v(0, 1)],
                [0.45, cp.v(-1, 0)],
                [0.60, cp.v(1, 0)],
                [1.0, cp.v(0, -1)] // bias to go down
              ],
      '0,1' : [ [0.2, cp.v(1, 0)],
                [0.4, cp.v(-1, 0)],
                [0.6, cp.v(0, 0) ],
                [1.0, cp.v(0, -1) ]
              ],
      '0,-1': [ [0.3, cp.v(1, 0)],
                [0.6, cp.v(-1, 0)],
                [1.0, cp.v(0, 0)]
              ],
      '1,0' : [ [0.3, cp.v(0, 1)],
                [0.6, cp.v(0, 0)],
                [1.0, cp.v(0, -1)]
              ],
      '-1,0': [ [0.3, cp.v(0, 1)],
                [0.6, cp.v(0, 0)],
                [1.0, cp.v(0, -1)]
              ]
    };

    WalkToGoalAI.prototype._animations = {
      '0,0' : '.standing',
      '0,1' : '.up',
      '0,-1': '.down',
      '1,0' : '.right',
      '-1,0': '.left'
    };

    WalkToGoalAI.prototype.setAnimation = function (sprite) {
      var animations = cc.animationCache;
      var dir = this.direction.x + ',' + this.direction.y;
      var state = this._animations[dir];
      if (sprite.state !== state) {
        sprite.state = state;
        if (sprite.animAction) {
          sprite.stopAction(sprite.animAction);
        }
        sprite.animAction = cc.RepeatForever.create(
            cc.Animate.create(
              animations.getAnimation(sprite.character + sprite.state)
        ));
        sprite.runAction(sprite.animAction);
      }
    };

    WalkToGoalAI.prototype.changeDirection = function (sprite) {
      var state = this.direction.x + ',' + this.direction.y;
      var possible = this._directionChanges[state];
      
      // THIS WHOLE SECTION to be replaced by A*
      // currently: rough check to see which direction gets us closer + random
      var p = cc.p(
        this.goal.getPosition().x + this.goal.getBoundingBox().width / 2,
        this.goal.getPosition().y + this.goal.getBoundingBox().height / 2
      );
      var currentPos = sprite.getPosition();
      var incX = currentPos.x < p.x ? 1 : (currentPos.x > p.x ? -1 : 0);
      var incY = currentPos.y < p.y ? 1 : (currentPos.y > p.y ? -1 : 0);
      for (var i = 0; i < possible.length; i++) {
        var dir = possible[i][1];
        if (Math.random() < 0.1 || dir.x === incX || dir.y === incY) {
          this.direction = dir;
          break;
        }
      }

    };
    
    WalkToGoalAI.prototype.update = function (dt, sprite, body) {

      if (!this.goal) {
        return true;
      }

      this.timeFromLastDirectionChangeMs += dt;

      // every 3s, reconsider direction
      if (this.timeFromLastDirectionChangeMs > 3 + 3 * Math.random()) {
        if (Math.random() < 0.5) {
          body.resetForces();
          body.setVel(cp.v(0, 0));
          this.changeDirection(sprite);
        }
        this.timeFromLastDirectionChangeMs = 0;
      }

      body.setAngle(0);
      body.setAngVel(0);
      if (this.direction.x === 0 && this.direction.y === 0) {
        body.resetForces();
        body.setVel(cp.v(0, 0));
      } else {
        body.applyForce(cp.v(this.direction.x * dt * this.speed,
                         this.direction.y * dt * this.speed), cp.v(0.5, 0.5));
      }
      this.setAnimation(sprite);
      
      return true;
    };

  };
   
  module.exports = WalkToGoalAI;
})();
