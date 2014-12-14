/*
This class is invoked just after loading the cocos2d boot
code. It's main task is to define a dpi for devices that
don't support that operation, and launch the initial
menu screen.
*/
(function () {
  'use strict';
  var GameController = require('./gameController');
  var Resources = require('./resource');
  if (typeof document !== 'undefined') {
    // Bootstrap a project when inside a browser
    cc.Device = cc.Device || {};
    cc.Device.getDPI = function () {
      var dpi = 96; // standard monitor
      return dpi;
    };
  }

  cc.game.onStart = function () {
    // design resolution while loading logo
    cc.view.setDesignResolutionSize(640, 480, cc.ResolutionPolicy.SHOW_ALL);
    cc.view.resizeWithBrowserSize(false);

    cc.LoaderScene.preload(Resources, function () {
      GameController.boot();
    }, this);
  };
})();
