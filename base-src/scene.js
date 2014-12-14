/*
Scene object, created by supplying a layer object. The
layer object must implemented an init() method that
will be invoked just after creation.
*/
(function () {
  'use strict';

  var ScreenDimensions = require('./screenDimensions');

  var scene = cc.Scene.extend({
    ctor: function (mainLayerClass) {
      this._super();
  
      // save layer for later use
      this.mainLayerClass = mainLayerClass;
      cc.associateWithNative(this, cc.Scene);
  
      var winSize = cc.view.getFrameSize();
      ScreenDimensions.dpi = cc.Device.getDPI();
      if (ScreenDimensions.dpi > 100) {
        ScreenDimensions.scale = 2.0; // retina et alter
      } else {
        ScreenDimensions.scale = 1.0;
      }
      cc.director.setDisplayStats(true);

      ScreenDimensions.viewportSize = {
        height : winSize.height,
        width : winSize.width
      };

      ScreenDimensions.designSize = {
        height : winSize.height,
        width : winSize.width
      };

      cc.view.setDesignResolutionSize(ScreenDimensions.designSize.width,
      ScreenDimensions.designSize.height, cc.ResolutionPolicy.SHOW_ALL);
    },
  
    onEnter: function () {
      this._super();
      var layer = new this.mainLayerClass();
      this.addChild(layer);
      layer.init();
    }
  });
  
  module.exports = scene;
})();
