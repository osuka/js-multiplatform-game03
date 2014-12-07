/* globals cc, cp */

(function () {
  'use strict';
  
  // A helper function to create sprites with physics
  //
  // There is functionality that can be run only once we
  // have loaded the image (because we need its size)
  // - if running in a browser we need to wait for loading to finish
  //
  var PhysicsSpriteHelper = {
  
    // Create a new sprite with an associated physics body
    // file: file name
    // spriteFrame: frame (if defined, batch defined too)
    // spriteBatch: batch (if defined, frame defined too)
    // tag: tag for sprite (optional)
    // pos: position on screen
    // space: space (world) to create the body in
    // mass: for the physical body
    // elasticity: for the physical body
    // friction: for the physical body
    // angle: for the physical body
    // callback: called after creation finishes (may need to asynchronously
    //           load assets before finishing creation)
    //
    createSprite: function (params) {
  
      var sprite;
      if (params.file) {
        sprite = cc.PhysicsSprite.create(params.file);
      } else if (params.spriteFrame) {
        var sprFrame = cc.spriteFrameCache.getSpriteFrame(params.spriteFrame);
        sprite = cc.PhysicsSprite.create(sprFrame);
        params.spriteBatch.addChild(sprite, 0, params.tag);
      }
  
      var postLoadAction = function () {
  
        // Image size
        var spriteWidth = sprite.getContentSize().width;
        var spriteHeight = sprite.getContentSize().height;
  
        // Physical body
        var mass = params.mass || 5;
        var moment = cp.momentForBox(mass, spriteWidth, spriteHeight);
        var body = new cp.Body(mass, moment);
        body.setPos(params.pos);
        body.setAngle(params.angle || 0);
        params.space.addBody(body);
        sprite.setBody(body);
  
        // Contact shape for the body
        var shape = new cp.BoxShape(body, spriteWidth, spriteHeight);
        params.space.addShape(shape);
        shape.setElasticity(params.elasticity || 0.2);
        shape.setFriction(params.friction || 0.8);
  
        // Link sprite with body and shape
        sprite.body = body;
        sprite.shape = shape;
        sprite.body.userData = sprite; // allows reverse-lookup
  
        // finished
        if (typeof params.callback === 'function') {
          params.callback(sprite);
        }
      };
  
      // Dynamic loading is required when running in a browser
      // see http://www.cocos2d-x.org/forums/19/topics/15685
      if (typeof document !== 'undefined' && params.file) {
        this.loadAsynchronously(params, postLoadAction);
      } else { // native applications
        postLoadAction();
      }
  
      return sprite;
    },
  
    // on web, we need to wait until
    loadAsynchronously: function (params, postLoadAction) {
      var textureCache = cc.TextureCache.getInstance();
      var texture = textureCache.textureForKey(params.file);
      if (texture.isLoaded()) {
        postLoadAction();
      } else {
        texture.addLoadedEventListener(postLoadAction); // async
      }
    }
  
  };
  
  module.exports = PhysicsSpriteHelper;
  
})();
