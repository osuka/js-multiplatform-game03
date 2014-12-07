/* globals cc */
(function () {
  'use strict';

  var ScreenDimensions = require('./screenDimensions');

  var InitialScene = cc.Scene.extend({
    ctor: function (mainLayerClass) {
      this._super();
  
      // save layer for later use
      this.mainLayerClass = mainLayerClass;
      cc.associateWithNative(this, cc.Scene);
  
      var winSize = cc.view.getFrameSize();
      ScreenDimensions.dpi = cc.Device.getDPI();
      ScreenDimensions.scale = 1.0;
      cc.log('Window size: ' + winSize.width + 'x' + winSize.height);
      cc.log('FPS: ' + cc.director.getAnimationInterval());
      cc.log('Scale set to: ' + ScreenDimensions.scale);
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
  
  module.exports = InitialScene;
})();
