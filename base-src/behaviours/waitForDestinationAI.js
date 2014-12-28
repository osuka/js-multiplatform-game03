(function () {
  'use strict';
  
  var WaitForDestinationAI = function () {

    var TINTING = 0;
    var TINTED = 1;

    WaitForDestinationAI.prototype.name = 'WaitForDestinationAI';

    WaitForDestinationAI.prototype.init = function (sprite) {
      var _this = this;
      var callBack = cc.CallFunc.create(function () {
        _this.tinted = TINTED;
      }, this);
      var action = cc.TintTo.create(0.5, 0, 0, 240);
      this.tinted = TINTING;
      this.tintedAction = cc.Sequence.create(action, callBack);
      sprite.runAction(this.tintedAction);
    };

    WaitForDestinationAI.prototype.detach = function (sprite) {
      if (this.tinted === TINTING) {
        sprite.stopAction(this.tintedAction);
      }

      // undo any possible tinting
      var spriteAction = cc.TintTo.create(0.25, 255, 255, 255);
      sprite.runAction(spriteAction);
      this.tintedAction = spriteAction;

      this.tinted = undefined;
    };

    WaitForDestinationAI.prototype.update = function (dt, sprite, body) {
      // don't run other behaviours, keep still
      body.setAngle(0);
      body.setAngVel(0);
      body.resetForces();
      body.setVel(cp.v(0, 0));
      return false;
    };

  };
   
  module.exports = WaitForDestinationAI;
})();
