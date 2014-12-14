// This file declares resources that need to be preloaded
// before the application is ran.
//
// If an image is not declared here, you'll check the texture
// and listen for file loading events. This makes things easier.
//

'use strict';
(function () {

  var resources = [
    // image
    'res/images/headers-100.png',
    'res/maps/tilesheet-1_2x-fixed.png',
    'res/sprites/spritesheet1_1x.png',
    'res/sprites/spritesheet1_2x.png',
    'res/images/1x1-pixel.png',

    // joystick images
    'res/images/joystick-base.png',
    'res/images/joystick-pad.png',
    'res/images/joystick-button.png',

    // plist
    'res/sprites/spritesheet1_1x.plist',
    'res/sprites/spritesheet1_2x.plist',

    // fnt
    'res/images/headers-100.fnt',

    // tmx
    'res/maps/scene00.tmx'

    // bgm

    // effect
  ];
  module.exports = resources;
})();
