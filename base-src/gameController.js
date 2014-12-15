/*
Simple game controller. In charge of changing the different
screens (scenes).
*/
(function () {
  'use strict';

  var Scene = require('./scene');
  var MenuLayer = require('./menuLayer');
  var ChapterOne = require('./chapterOne');

  var GameController = {

    currentChapter: 0,

    boot: function () {
      // The director controles the game
      cc.director.setDisplayStats(false);

      // // set FPS. the default value is 1.0/60 if you don't call this
      // // Note: this doesn't seem to work for Mac or Android
      // director.setAnimationInterval(1.0 / 60);

      this.showMenu();
    },

    showMenu: function () {
      this.currentChapter = -1;
      var newScene = new Scene(MenuLayer);
      cc.director.runScene(newScene);
    },

    showChapter: function (n) {
      this.currentChapter = n;
      var newScene = new Scene(ChapterOne);
      cc.director.runScene(newScene);
    },

  };

  module.exports = GameController;
})();
