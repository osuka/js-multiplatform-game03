/*
A simple on-screen joystick with two buttons for cocos2d-x/cocos2d-js.

To use, import this module, create an object and add it
to a layer. It is recommended to use a layer on top
of the others.

    var Joystick = require('./joystick.js')
    var joystick = new Joystick();
    layer.addChild(joystick);
    joystick.init();
    joystick.fire1 = function () {
      // do something
    };
    joystick.fire2 = function () {
      // do something
    };

Then, in your game loop, invoke:

    var pos = joystick.getPadPosition();

Use pos.x, pos.y to scroll/move your character accordingly.

The joystick is created with a tag JOYSTICK_PAD_TAG,
and it sits on a base JOYSTICK_BASE_TAG, while the buttons
are added as JOYSTICK_BUTTON1_TAG, JOYSTICK_BUTTON1_TAG. Use
this to find the objects in your node hierarchy using findChildByTag.

Mainly for debugging, this class also responds to ARROW KEYS,
moving the pad with key presses.

The images for the joystick are defined as constants and must be
available ('res/images/joystick-*.png').

(c) 2014 Oscar Amat
*/
(function () {
  'use strict';

  var ScreenDimensions = require('./screenDimensions');

  var Joystick = cc.Layer.extend({
    JOYSTICK_BASE_TAG: 99999991,
    JOYSTICK_PAD_TAG: 99999992,
    JOYSTICK_BUTTON1_TAG: 99999993,
    JOYSTICK_BUTTON2_TAG: 99999994,
    IMAGE_BASE: 'res/images/joystick-base.png',
    IMAGE_PAD: 'res/images/joystick-pad.png',
    IMAGE_BUTTON: 'res/images/joystick-button.png',
  
    ctor: function () {
      this._super();
      cc.associateWithNative(this, cc.Layer);
    },
  
    createTouchListeners: function () {

      var passbackTouchBegan = function (touch, event) {
        var target = event.getCurrentTarget();
        if (!target.touchStart) {
          return;
        }
        var locationInNode = target.convertToNodeSpace(touch.getLocation());
        var s = target.getContentSize();
        var rect = cc.rect(0, 0, s.width, s.height);
        if (cc.rectContainsPoint(rect, locationInNode)) {
          target.touchStart(locationInNode);
          return true;
        }
        return false;
      };

      var passbackTouchMove = function (touch, event) {
        var target = event.getCurrentTarget();
        if (!target.touchMoved) {
          return;
        }
        var locationInNode = target.convertToNodeSpace(touch.getLocation());
        target.touchMoved(locationInNode);
      };

      var passbackTouchEnd = function (touch, event) {
        var target = event.getCurrentTarget();
        if (!target.touchEnded) {
          return;
        }
        target.touchEnded();
      };

      // note: AFAIK you can't share listeners between sprites
      var listenerBase = cc.EventListener.create({
        event: cc.EventListener.TOUCH_ONE_BY_ONE,
        swallowTouches: true,
        onTouchBegan: passbackTouchBegan,
        onTouchMoved: passbackTouchMove,
        onTouchEnded: passbackTouchEnd
      });
      var joystick = this.getChildByTag(this.JOYSTICK_BASE_TAG);
      cc.eventManager.addListener(listenerBase, joystick);

      var fire1Listener = cc.EventListener.create({
        event: cc.EventListener.TOUCH_ONE_BY_ONE,
        swallowTouches: true,
        onTouchBegan: passbackTouchBegan,
        onTouchMoved: passbackTouchMove,
        onTouchEnded: passbackTouchEnd
      });
      var fire1 = this.getChildByTag(this.JOYSTICK_BUTTON1_TAG);
      cc.eventManager.addListener(fire1Listener, fire1);

      var fire2Listener = cc.EventListener.create({
        event: cc.EventListener.TOUCH_ONE_BY_ONE,
        swallowTouches: true,
        onTouchBegan: passbackTouchBegan,
        onTouchMoved: passbackTouchMove,
        onTouchEnded: passbackTouchEnd
      });
      var fire2 = this.getChildByTag(this.JOYSTICK_BUTTON2_TAG);
      cc.eventManager.addListener(fire2Listener, fire2);
    },
  
    init: function () {
      this._super();

      var size = cc.p(75, 75);
      var pos = cc.p(size.x + size.x * 0.5, size.y + size.y * 0.5);
      this.createBase(pos);
      this.createPad(pos);
      this.createButtons(pos);
  
      this.createTouchListeners();

      // If we are on a browser with a keyboard, use it
      if (typeof document !== 'undefined') {
        var canvas = document.getElementById('gameCanvas');
        canvas.addEventListener('keydown',
          this.keyboardKeyDown.bind(this), false);
        canvas.addEventListener('keyup',
          this.keyboardKeyUp.bind(this), false);
      }
  
    },
  
    getBase: function () {
      return this.getChildByTag(this.JOYSTICK_BASE_TAG);
    },
  
    getJoystick: function () {
      return this.getChildByTag(this.JOYSTICK_PAD_TAG);
    },
  
    keyboardKeyDown: function (key) {
      var base = this.getBase();
      var joystick = this.getJoystick();
      var center = base.getPosition();
      var width = base.getContentSize().width / 4;
      var pos = joystick.getPosition();
      if (key.keyCode === 37) { /* LEFT ARROW */
        joystick.stopAllActions();
        joystick.setPosition(cc.p(center.x - width, pos.y));
        return true;
      }
      if (key.keyCode === 38) { /* UP ARROW */
        joystick.stopAllActions();
        joystick.setPosition(cc.p(pos.x, center.y + width));
      }
      if (key.keyCode === 39) { /* RIGHT RROW */
        joystick.stopAllActions();
        joystick.setPosition(cc.p(center.x + width, pos.y));
      }
      if (key.keyCode === 40) { /* DOWN ARROW */
        joystick.stopAllActions();
        joystick.setPosition(cc.p(pos.x, center.y - width));
      }
      if (key.keyCode === 'Z') {
 
      }
      if (key.keyCode === 'X') {
  
      }
    },
  
    keyboardKeyUp: function (key) {
      var base = this.getBase();
      var joystick = this.getJoystick();
      var center = base.getPosition();
      var pos = joystick.getPosition();
      if (key.keyCode === 37) { /* LEFT ARROW */
        joystick.stopAllActions();
        joystick.setPosition(cc.p(center.x, pos.y));
        return true;
      }
      if (key.keyCode === 38) { /* UP ARROW */
        joystick.stopAllActions();
        joystick.setPosition(cc.p(pos.x, center.y));
      }
      if (key.keyCode === 39) { /* RIGHT RROW */
        joystick.stopAllActions();
        joystick.setPosition(cc.p(center.x, pos.y));
      }
      if (key.keyCode === 40) { /* DOWN ARROW */
        joystick.stopAllActions();
        joystick.setPosition(cc.p(pos.x, center.y));
      }
      if (key.keyCode === 'Z') {

      }
      if (key.keyCode === 'X') {
  
      }
    },
  
    createBase: function (pos) {
      var _this = this;
      var joystickBase = cc.Sprite.create(this.IMAGE_BASE);
      joystickBase.setPosition(pos);
      joystickBase.touchStart =
      joystickBase.touchMoved = function (touchPoint) {
        var joystick = _this.getChildByTag(_this.JOYSTICK_PAD_TAG);
        if (joystick) {
          joystick.stopAllActions();
          touchPoint.x += joystick.getContentSize().width / 2;
          touchPoint.y += joystick.getContentSize().height / 2;
          joystick.setPosition(touchPoint);
          return true; // consume event
        }
        return false;
      };
  
      joystickBase.touchEnded = function () {
        var joystickBase = _this.getChildByTag(_this.JOYSTICK_BASE_TAG);
        var joystick = _this.getChildByTag(_this.JOYSTICK_PAD_TAG);
        if (!joystickBase || !joystick) {
          return false;
        }
        joystick.stopAllActions();
        var center = joystickBase.getPosition();
        joystick.runAction(cc.MoveTo.create(0.10, center));
        return true; // consume event
      };
      this.addChild(joystickBase, 100 /* zorder */, this.JOYSTICK_BASE_TAG);
    },
  
    createPad: function (pos) {
      var joystick = cc.Sprite.create(this.IMAGE_PAD);
      joystick.setPosition(pos);
      this.addChild(joystick, 110 /* zorder */, this.JOYSTICK_PAD_TAG);
    },
  
    createButtons: function (pos) {
  
      var _this = this;
  
      var joystickButton1 = cc.Sprite.create(this.IMAGE_BUTTON);
      joystickButton1.setPosition(cc.p(
        ScreenDimensions.viewportSize.width - pos.x * 1.6, pos.y));
      joystickButton1.touchStart = function (touchPoint) {
        joystickButton1.runAction(
          cc.ScaleTo.create(0.15, 0.8, 0.8));
        _this.fire1(touchPoint);
        return true; // consume event
      };
      joystickButton1.touchEnded = function () {
        joystickButton1.runAction(
          cc.ScaleTo.create(0.15, 1, 1));
      };
  
      var joystickButton2 = cc.Sprite.create(this.IMAGE_BUTTON);
      joystickButton2.setPosition(
        cc.p(ScreenDimensions.viewportSize.width - pos.x / 2, pos.y));
      joystickButton2.touchStart = function (touchPoint) {
        joystickButton2.runAction(
          cc.ScaleTo.create(0.15, 0.8, 0.8));
        _this.fire2(touchPoint);
        return true; // consume event
      };
      joystickButton2.touchEnded = function () {
        joystickButton2.runAction(
          cc.ScaleTo.create(0.15, 1, 1));
      };
  
      this.addChild(joystickButton1, 110 /* zorder */,
        this.JOYSTICK_BUTTON1_TAG);
      this.addChild(joystickButton2, 110 /* zorder */,
          this.JOYSTICK_BUTTON2_TAG);
  
      return true;
    },
  
    getPadPosition: function () {
      var joystick = this.getChildByTag(this.JOYSTICK_PAD_TAG);
      var base = this.getChildByTag(this.JOYSTICK_BASE_TAG);
      var jp = joystick.getPosition();
      var bp = base.getPosition();
      return cc.p(jp.x - bp.x, jp.y - bp.y);
    },
  
    fire1: function () {
      // override this
    },
  
    fire2: function () {
      // override this
    }
  });

  module.exports = Joystick;
})();
