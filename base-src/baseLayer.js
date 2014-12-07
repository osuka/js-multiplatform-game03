/* globals cc, cp */

(function () {
  'use strict';
  
  var Joystick = require('./joystick');

  var BaseLayer = cc.Layer.extend({

    DEBUG_OBJECT_TAG: 99999990,
    TAG_SPRITEBATCH: 99999995,
    TAG_CONTROLS_LAYER: 99999996,
    TAG_GAMEAREA_LAYER: 99999997,
    TAG_JOYSTICK: 99999998,
    TAG_TILEMAP: 99999999,

    CONTROLS_LAYER_ZORDER: 10000000,
    GAMEAREA_LAYER_ZORDER: 0,

    ctor: function () {
      this._super();
      cc.associateWithNative(this, cc.Layer);
    },

    init: function () {

      this._super();

      // this.setTouchEnabled(true);

      // load shared graphics
      // good reference: http://www.cocos2d-x.org/forums/19/topics/23698
      // var spriteBatch = cc.SpriteBatchNode.create("res/sheet1_default.png");
      // var cache = cc.SpriteFrameCache.getInstance();
      // cache.addSpriteFrames("res/sheet1_default.plist");
      // this.addChild(spriteBatch, 0, this.TAG_SPRITEBATCH);

      // create physics world
      //
      this.space = new cp.Space();
      this.space.iterations = 5;
      this.space.gravity = cp.v(0, 0); // top view

      // this.setScale(game.scale);
      var layer = cc.Layer.create();
      this.addChild(layer, this.CONTROLS_LAYER_ZORDER, this.TAG_CONTROLS_LAYER);
      layer = cc.Layer.create();
      this.addChild(layer, this.GAMEAREA_LAYER_ZORDER, this.TAG_GAMEAREA_LAYER);
      // this.createBoundaries();

      this.addJoystick();

      this.scheduleUpdate();
      return true;
    },

    // Enable or disable debug
    //
    toggleDebug: function () {
      // display FPS
      var director = cc.director;

      // display physics objects
      var tag = this.DEBUG_OBJECT_TAG;
      var gameArea = this.getChildByTag(this.TAG_GAMEAREA_LAYER);

      var d = gameArea.getChildByTag(tag);
      if (!d) {
        this.debugDraw = cc.PhysicsDebugNode.create(this.space);
        gameArea.addChild(this.debugDraw, this.CONTROLS_LAYER_ZORDER, tag);
        director.setDisplayStats(true);
      } else {
        gameArea.removeChild(d);
        this.debugDraw = undefined;
        director.setDisplayStats(false);
      }
    },

    // Create physics objects to enclose the screen
    //
    createBoundaries: function () {

      var thickness = 30;

      var floor = this.space.addShape(new cp.SegmentShape(
          this.space.staticBody,
          cp.v(0, -thickness),
          cp.v(this.worldSize.width, -thickness),
          thickness
      ));
      floor.setElasticity(1);
      floor.setFriction(1);

      var lwall = this.space.addStaticShape(new cp.SegmentShape(
          this.space.staticBody,
          cp.v(-thickness, this.worldSize.height),
          cp.v(-thickness, 0),
          thickness
      ));
      lwall.setElasticity(1);
      lwall.setFriction(1);

      var rwall = this.space.addStaticShape(new cp.SegmentShape(
          this.space.staticBody,
          cp.v(this.worldSize.width + thickness, this.worldSize.height),
          cp.v(this.worldSize.width + thickness, 0),
          thickness
      ));
      rwall.setElasticity(1);
      rwall.setFriction(1);

      var ceiling = this.space.addStaticShape(new cp.SegmentShape(
          this.space.staticBody,
          cp.v(0, this.worldSize.height + thickness),
          cp.v(this.worldSize.width, this.worldSize.height + thickness),
          thickness
      ));
      ceiling.setElasticity(1);
      ceiling.setFriction(1);
    },

    addJoystick: function () {
      var joystick = new Joystick();
      var controls = this.getChildByTag(this.TAG_CONTROLS_LAYER);
      controls.addChild(joystick, 0, this.TAG_JOYSTICK);
      joystick.init();
      var _this = this;
      // subclasses will declare their own fire1, fire2
      joystick.fire1 = function () {
        if (typeof _this.fire1 !== 'undefined') {
          _this.fire1();
        }
      };
      joystick.fire2 = function () {
        if (typeof _this.fire2 !== 'undefined') {
          _this.fire2();
        }
      };
    },

    update : function (dt) {
      this.space.step(dt);
    }

  });
    
  module.exports = BaseLayer;
})();
