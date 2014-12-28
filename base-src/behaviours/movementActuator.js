/**

Basic actuator

- Attach it to a sprite as Behaviour module.
- Invoke setTargetPosition() with the position you want it to go to.
- Invoke isAtTargetPosition() to know if it's there
- Set the sprite animation according to the direction the sprite is going

This uses a PivotJoint constraint to move. The constraint is removed and
updated whenever a call to setTargetPosition is made.


*/
(function () {
  'use strict';
  
  var MovementActuator = function () {

    MovementActuator.prototype.name = 'MovementActuator';

    MovementActuator.prototype.init = function () {
    };

    MovementActuator.prototype._animations = {
      '0,0' : '.standing',
      '0,1' : '.up',
      '0,-1': '.down',

      '1,1' : '.up',
      '1,0' : '.right',
      '1,-1': '.down',

      '-1,-1': '.down',
      '-1,0': '.left',
      '-1,1': '.up'
    };

    MovementActuator.prototype.setAnimation = function (sprite) {
      var animations = cc.animationCache;
      
      var distX = this.targetPos.x - sprite.getBody().getPos().x;
      var dirX = 0;
      if (distX < -0.2) { dirX = -1; }
      else if (distX > 0.2) { dirX = 1; }

      var distY = this.targetPos.y - sprite.getBody().getPos().y;
      var dirY = 0;
      if (distY < -0.2) { dirY = -1; }
      else if (distY > 0.2) { dirY = 1; }

      var dirName = dirX + ',' + dirY;
      var state = this._animations[dirName];
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

    MovementActuator.prototype.removeConstraint = function (sprite) {
      var space = sprite.getBody().space;
      var self = this;
      var fun = function () {
        if (self.targetConstraint) {
          space.removeConstraint(self.targetConstraint);
        }
        self.targetConstraint = undefined;
      };
      if (space.isLocked()) {
        space.addPostStepCallback(fun);
      } else {
        fun();
      }
    };

    MovementActuator.prototype.detach = function (sprite) {
      this.removeConstraint(sprite);
    };

    MovementActuator.prototype.setTargetPosition = function (sprite, pos) {
      this.targetPos = cp.v(pos.x, pos.y);
      var space = sprite.getBody().space;
      var self = this;
      var fun = function () {
        if (!self.targetConstraint) {
          // space.removeConstraint(self.targetConstraint);
          // http://chipmunk-physics.net/forum/viewtopic.php?f=1&t=1705
          self.targetConstraint = new cp.PivotJoint(
            sprite.getBody(),
            space.staticBody,
            cp.v(0, 0),
            self.targetPos
          );
          self.targetConstraint.maxForce = 10000;
          space.addConstraint(self.targetConstraint);
        }
        self.targetConstraint.anchr2 = self.targetPos;
      };
      if (space.isLocked()) {
        space.addPostStepCallback(fun);
      } else {
        fun();
      }
    };
    
    MovementActuator.prototype.isAtTargetPosition = function (sprite) {
      var body = sprite.getBody();
      if (!body || !this.targetPos) {
        return;
      }
      var dist = cp.v.dist(body.getPos(), this.targetPos);
      if (dist < 5) {
        return true;
      }
    };

    MovementActuator.prototype.update = function (dt, sprite, body) {

      body.setAngle(0);
      body.setAngVel(0);

      if (!this.targetPos || !this.targetConstraint) {
        return;
      }

      if (this.isAtTargetPosition(sprite)) {
        if (this.targetConstraint) {
          this.removeConstraint(sprite);
          body.setVel(cp.v(0, 0));
        }
        return true;
      }

      this.setAnimation(sprite);
     
      return true;
    };

  };
   
  module.exports = MovementActuator;
})();
