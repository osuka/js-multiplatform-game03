/* globals cc, cp */

(function () {
  'use strict';
    
  var PhysicsSpriteHelper = require('./physicsSprite');
  var BaseLayer = require('./baseLayer');
  var ScreenDimensions = require('./screenDimensions');
  var SlowWalkerAI = require('./slowWalkerAI');
  var WalkToGoalAI = require('./walkToGoalAI');

  var ChapterOne = BaseLayer.extend({

    TAG_TOUCHES : 39999980,

    init: function () {
      this._super();
      this.lastTime = 0;
      this.createTouchListener();

      var tilemap = this.createTilemap();

      // To put the top-left corner of the map on the top left
      // corner of the screen you would do:
      // tilemap.setPosition( cc.p(0, -mapheight + SD.viewportSize.height) );

      var gameArea = this._getGameArea();
      gameArea.setAnchorPoint(0, 0);
      gameArea.addChild(tilemap, 0, this.TAG_TILEMAP);

      this.createBoundaries();

      this.createSpriteBatch();

      this.createCharacterDefinitions();

      this.createSolids(tilemap);

      this.createGoal(tilemap);

      this.createGenerators(tilemap);

      this.createAttackers(tilemap);

      this.createDefendants(tilemap);

      this.autoMap('layer1', tilemap);

      var pos = cc.p(0, 0);
      this.ensureGameAreaPositionWithinBoundaries(pos);
      gameArea.setPosition(pos);

      return true;

    },

    // Creates physics objects for collisions following a very
    // basic algorithm that attemps to find vertical and horizontal
    // segments to minimize the number of objects need
    autoMap: function (layername, tilemap) {

      var layer = tilemap.getLayer(layername);
      var p = cc.p(0, 0);
      var size = layer.getLayerSize();

      var _this = this;

      var getVisitedArray = function () {
        if (typeof _this._visitedArrayCache === 'undefined') {
          _this._visitedArrayCache = new Array(size.height);
          for (p.y = 0; p.y < size.height; p.y++) {
            _this._visitedArrayCache[p.y] = new Array(size.width);
          }
        }
        for (var i = 0; i < size.height; i++) {
          for (var j = 0; j < size.width; j++) {
            _this._visitedArrayCache[i][j] = false;
          }
        }
        return _this._visitedArrayCache;
      };

      var visited = getVisitedArray();

      var scale = this._getTilemapScale();
      var space = this.space;

      var isBusy = function (x, y) {
        var tile = layer.getTileAt(cc.p(x, y));
        return tile !== null;
      };

      var addRectangle = function (x, y, w, h) {
        var vector = [
          0, 0,
          0, h * scale,
          w * scale, h * scale,
          w * scale, 0
        ];
        var shape = new cp.PolyShape(
          space.staticBody, vector,
          cp.v(scale * x, scale * y - h * scale)
        );
        space.addStaticShape(shape);
        shape.setElasticity(0);
        shape.setFriction(1);
      };

      var lookupHoriz = function (p) {
        for (var i = p.x + 1;
          i < size.width && !visited[p.y][i] && isBusy(i, p.y); i++) {
          visited[p.y][i] = true;
        }
        return i - p.x;
      };

      var lookupVert = function (p) {
        for (var i = p.y + 1;
          i < size.height && !visited[i][p.x] && isBusy(p.x, i); i++) {
          visited[i][p.x] = true;
        }
        return i - p.y;
      };

      var examineTile = function (p) {
        if (!visited[p.y][p.x] && isBusy(p.x, p.y)) {
          visited[p.y][p.x] = true;
          var height = 1;
          var width = 1;
          var count = lookupHoriz(p, visited);
          if (count < 2) {
            height = lookupVert(p, visited);
          } else {
            width = count;
          }
          addRectangle(
            p.x * tilemap.getTileSize().width,
            (size.height - p.y) * tilemap.getTileSize().height,
            width * tilemap.getTileSize().width,
            height * tilemap.getTileSize().height);
        }
      };

      for (p.y = 0; p.y < size.height; p.y++) {
        for (p.x = 0; p.x < size.width; p.x++) {
          examineTile(p);
        }
      }

    },

    createTilemap: function () {
      var tilemap = cc.TMXTiledMap.create('res/maps/scene00.tmx');
      if (ScreenDimensions.scale < 2) {
        tilemap.setScale(0.5);
      } else {
        tilemap.setScale(1);
      }
      this.worldSize = {
        width : tilemap.getBoundingBox().width,
        height : tilemap.getBoundingBox().height
      };
      return tilemap;
    },

    // (helper) move from (x,y) to array, plus fix string to integer
    // and reverse y because different coordinate system
    pointToArray: function (p) {
      return [parseInt(p.x, 10), -parseInt(p.y, 10)];
    },

    // Returns a Chipmunk shape object from a TileMap ObjectGroup's object
    shapeForObject: function (tmxObject, scale) {
      var cpShape;
      // BUG: in native, instead of polygonPoints we have 'points'
      var points = tmxObject.polygonPoints || tmxObject.points;
      if (points) {
        // turn from array of objects into array of arrays
        // TODO: Check clockwise, reverse accordingly
        var arrays = points.map(this.pointToArray);
        // chipmunk wants polygons as a flat list of numbers
        // plus we need to scale them accordingly
        var flatten = [].concat.apply([], arrays)
                      .map(function (n) {
          return n * scale;
        });
        cpShape = new cp.PolyShape(
          this.space.staticBody,
          flatten,
          cp.v(scale * parseInt(tmxObject.x, 10),
               scale * parseInt(tmxObject.y, 10))
        );
      } else {
        // convert rectangle to polygon
        var w = scale * parseInt(tmxObject.width, 10);
        var h = scale * parseInt(tmxObject.height, 10);
        cpShape = new cp.PolyShape(
          this.space.staticBody,
          [0, 0,
           0, h,
           w, h,
           w, 0
          ],
          cp.v(scale * parseInt(tmxObject.x, 10),
               scale * parseInt(tmxObject.y, 10))
        );
      }
      return cpShape;
    },

    // Returns a cocos Rect object from a TileMap ObjectGroup's object,
    // warning of objects that are actually polygons
    ccRectForObject: function (tmxObject, scale) {
      if (tmxObject.polygonPoints && tmxObject.polygonPoints.length) {
        return undefined;
      } else {
        return cc.rect(
          scale * parseInt(tmxObject.x, 10),
          scale * parseInt(tmxObject.y, 10),
          scale * parseInt(tmxObject.width, 10),
          scale * parseInt(tmxObject.height, 10)
        );
      }
    },

    // Returns a cocos position object from a TileMap ObjectGroup's object,
    // warning of objects that are actually polygons
    ccPosForObject: function (tmxObject, scale) {
      if (tmxObject.polygonPoints && tmxObject.polygonPoints.length) {
        return undefined;
      } else {
        return cc.p(
          scale * parseInt(tmxObject.x, 10),
          scale * parseInt(tmxObject.y, 10)
        );
      }
    },

    createGoal: function (tilemap) {
      var gameArea = this.getChildByTag(this.TAG_GAMEAREA_LAYER);
      var scale = this._getTilemapScale();

      var goals = tilemap.getObjectGroup('goal').getObjects();
      var goal = goals[0];

      var w = scale * parseInt(goal.width, 10);
      var h = scale * parseInt(goal.height, 10);
      var sprite = cc.Sprite.create('res/images/1x1-pixel.png');
      sprite.setPosition(cc.p(scale * parseInt(goal.x, 10),
             scale * parseInt(goal.y, 10)));
      if (scale === 0.5) {
        sprite.setScaleX(w * scale * 2); // because pixel is x0.5 in spritesheet
        sprite.setScaleY(h * scale * 2);
      } else {
        sprite.setScaleX(w * scale);
        sprite.setScaleY(h * scale);
      }
      sprite.setAnchorPoint(cp.v(0, 0));
      gameArea.addChild(sprite, 10000, this.TAG_GOAL);

      sprite.runAction(
        cc.RepeatForever.create(
          cc.Sequence.create(
              cc.FadeIn.create(0.5),
              cc.FadeOut.create(1.0)
      )));

    },

    createAttackers: function (tilemap) {
      var gameArea = this.getChildByTag(this.TAG_GAMEAREA_LAYER);
      var tilemapSprite =
      gameArea.getChildByTag(this.TAG_TILEMAP);
      var scale = tilemapSprite.getScale();

      var attackers = tilemap.getObjectGroup('attackers').getObjects();
      var tag = 11000;
      for (var i = 0; i < attackers.length; i++) {
        var pos = this.ccPosForObject(attackers[i], scale);
        var sprite = this.createSampleChar('persona',
          pos, tag + 1, 1 /* zoom */);
        this.attackers.push(sprite);
        sprite.ai = new SlowWalkerAI();
        sprite.ai.init();
      }
    },

    createDefendants: function (tilemap) {
      var gameArea = this.getChildByTag(this.TAG_GAMEAREA_LAYER);
      var tilemapSprite =
      gameArea.getChildByTag(this.TAG_TILEMAP);
      var scale = tilemapSprite.getScale();

      var attackers = tilemap.getObjectGroup('defendants').getObjects();
      var tag = 12000;
      for (var i = 0; i < attackers.length; i++) {
        var pos = this.ccPosForObject(attackers[i], scale);
        var sprite = this.createSampleChar('defendant',
          pos, tag + 1, 1 /* no zoom */);
        this.defendants.push(sprite);
        sprite.ai = new WalkToGoalAI();
        sprite.ai.init(this._getGameArea().getChildByTag(this.TAG_GOAL));
      }
    },

    createGenerators: function (tilemap) {
      var attackers = tilemap.getObjectGroup('generator-attacker')
        .getObjects();
      var defendants = tilemap.getObjectGroup('generator-defendant')
        .getObjects();

      var gameArea = this.getChildByTag(this.TAG_GAMEAREA_LAYER);
      var tilemapSprite =
      gameArea.getChildByTag(this.TAG_TILEMAP);
      var scale = tilemapSprite.getScale();
      var _this = this;
      this.attackGenerators = attackers.map(function (obj) {
        return _this.ccRectForObject(obj, scale);
      });
      this.defendantGenerators = defendants.map(function (obj) {
        return _this.ccRectForObject(obj, scale);
      });

    },

    // Transforms a click/touch into a square in world coordinates
    // that can be used with cc.rectIntersectsRect
    pointToWorldRect: function (point) {
      var gameArea = this.getChildByTag(this.TAG_GAMEAREA_LAYER);
      var worldPoint = {
        x : (point.x - gameArea.getPosition().x) / gameArea.scale,
        y : (point.y - gameArea.getPosition().y) / gameArea.scale
      };
      var margin = 4; // make it easier to click
      var worldRect = cc.rect(
        worldPoint.x - margin, worldPoint.y - margin,
        margin * 2, margin * 2);
      return worldRect;
    },

    // If a generator is clicked, returns it's center, undefined otherwise
    checkGeneratorClicked: function (point) {
      var tag = 10000; // TODO: need a different tag?
      var worldRect = this.pointToWorldRect(point);
      for (var i = 0; i < this.attackGenerators.length; i++) {
        var r = this.attackGenerators[i];
        if (cc.rectIntersectsRect(worldRect, r)) {
          var center = cc.p(
             worldRect.x + worldRect.width / 2,
             worldRect.y + worldRect.height / 2);
          this.createSampleChar('persona',
            center, tag, 1 /* zoom */);
          return center;
        }
      }
    },

    // if a character is clicked
    checkAttackerClicked: function (point) {
      var worldRect = this.pointToWorldRect(point);
      for (var i = 0; i < this.attackers.length; i++) {
        var sprite = this.attackers[i];
        var r = cc.rect(sprite.x - sprite.getContentSize().width / 2,
          sprite.y - sprite.getContentSize().height / 2,
          sprite.getContentSize().width,
          sprite.getContentSize().height);
        if (cc.rectIntersectsRect(worldRect, r)) {
          var spriteAction = cc.TintTo.create(2, 0, 0, 240);
          sprite.runAction(spriteAction);
          sprite.ai = new SlowWalkerAI();
          sprite.ai.init();
        }
      }
    },

    createSolids: function (tilemap) {
      var objectGroup = tilemap.getObjectGroup('solids');
      var objects = objectGroup.getObjects();

      var gameArea = this.getChildByTag(this.TAG_GAMEAREA_LAYER);
      var tilemapSprite =
      gameArea.getChildByTag(this.TAG_TILEMAP);
      var scale = tilemapSprite.getScale();
      for (var i = 0; i < objects.length; i++) {
        var shape = this.shapeForObject(objects[i], scale);
        this.space.addStaticShape(shape);
        shape.setElasticity(0);
        shape.setFriction(1);
      }
    },

    createSpriteBatch: function () {
      // load shared graphics
      // good reference: http://www.cocos2d-x.org/forums/19/topics/23698
      var spritesheetName = 'res/sprites/spritesheet1_';
      if (ScreenDimensions.scale >= 2) {
        spritesheetName += '2x';
      } else {
        spritesheetName += '1x';
      }
      var spriteBatch = cc.SpriteBatchNode.create(spritesheetName + '.png');
      cc.spriteFrameCache.addSpriteFrames(spritesheetName + '.plist');
      var gameArea = this.getChildByTag(this.TAG_GAMEAREA_LAYER);
      gameArea.addChild(spriteBatch, 100, this.TAG_SPRITEBATCH);
    },

    setSpriteStateBasedOnVelocity: function (sprite, body) {
      if (!body) {
        return; // this AI only works with physical bodies
      }
      var animations = cc.animationCache;

      var state;

      // Main idea:
      // Determine wheter it's going "more" vertically or horizontally
      // to choose the sprite
      var howMuchVert = Math.abs(body.getVel().y);
      var howMuchHoriz = Math.abs(body.getVel().x);
      var isVertical = howMuchVert > howMuchHoriz;

      if (isVertical && howMuchVert > 0.5) {
        state = (body.getVel().y > 0.5) ? '.up' : '.down';
      } else if (howMuchHoriz > 0.25) {
        state = (body.getVel().x > 0.25) ? '.right' : '.left';
      } else {
        state = '.standing';
      }

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
    },

    createSampleChar: function (character, pos, tag, zoom) {
      var gameArea = this.getChildByTag(this.TAG_GAMEAREA_LAYER);
      var spriteBatch = gameArea.getChildByTag(this.TAG_SPRITEBATCH);

      var orientations = ['.standing', '.right', '.left', '.up', '.down'];

      var person = PhysicsSpriteHelper.createSprite({
        spriteFrame : 'persona-standing-1.png',
        spriteBatch : spriteBatch,
        tag : tag,
        pos : pos,
        space : this.space
      });

      var orientation = orientations[Math.floor(Math.random() *
        orientations.length)];

      person.character = character;
      person.state = orientation;

      person.animAction = cc.RepeatForever.create(
        cc.Animate.create(
          cc.animationCache.getAnimation(character + orientation)
      ));
      person.runAction(person.animAction);
 
      person.setScale(zoom);

      return person;
    },

    characters : {},

    attackers: [],

    defendants: [],

    _createPeopleDefinitions: function () {
      this.characters.persona = {
        standing : [
          { file : 'persona-standing-1' },
          { file : 'persona-standing-2' }
        ],
        up : [
          { file : 'persona-up-1' },
          { file : 'persona-up-2' },
          { file : 'persona-up-3' },
          { file : 'persona-up-4' },
        ],
        down : [
          { file : 'persona-down-1' },
          { file : 'persona-down-2' },
          { file : 'persona-down-3' },
          { file : 'persona-down-4' },
        ],
        left : [
          { file : 'persona-left-1' },
          { file : 'persona-left-2' },
          { file : 'persona-left-3' },
          { file : 'persona-left-4' },
        ],
        right : [
          { file : 'persona-right-1' },
          { file : 'persona-right-2' },
          { file : 'persona-right-3' },
          { file : 'persona-right-4' },
        ]
      };
    },

    _createDefendantDefinitions: function () {
      this.characters.defendant = {
        standing : [
          { file : 'defendant-standing-1' },
          { file : 'defendant-standing-2' }
        ],
        up : [
          { file : 'defendant-up-1' },
          { file : 'defendant-up-2' },
          { file : 'defendant-up-3' },
          { file : 'defendant-up-4' },
        ],
        down : [
          { file : 'defendant-down-1' },
          { file : 'defendant-down-2' },
          { file : 'defendant-down-1' },
          { file : 'defendant-down-4' },
        ],
        left : [
          { file : 'defendant-left-1' },
          { file : 'defendant-left-2' },
          { file : 'defendant-left-3' },
          { file : 'defendant-left-4' },
        ],
        right : [
          { file : 'defendant-right-1' },
          { file : 'defendant-right-2' },
          { file : 'defendant-right-3' },
          { file : 'defendant-right-4' },
        ]
      };
    },

    createCharacterDefinitions : function () {

      // Character definitions

      this._createPeopleDefinitions();
      this._createDefendantDefinitions();

      /*jshint maxdepth:5 */
      var animations = cc.animationCache;
      var cache = cc.spriteFrameCache;
      for (var name in this.characters) {
        var states = this.characters[name]; // e.g. 'persona'
        for (var state in states) { // e.g. 'up'
          var animation = cc.Animation.create();
          var frames = states[state]; // array of file names
          for (var f in frames) {
            var fileName = frames[f].file + '.png';
            var frame = cache.getSpriteFrame(fileName);
            if (!frame) {
              continue;
            } else {
              animation.addSpriteFrame(frame);
            }
          }
          animation.setDelayPerUnit(0.150);
          animation.setLoops(true);
          // cache them like: <characterName> + '.' + <stateName>
          animations.addAnimation(animation, name + '.' + state);
        }
      }
    },

    // Add a title label
    //
    addTitle: function (text) {
      this.titleLabel = cc.LabelBMFont.create(
          text,
          'res/images/headers-100.fnt',
          ScreenDimensions.viewportSize.width * 0.85,
          cc.TEXT_ALIGNMENT_LEFT,
          cc.p(0, 0)
      );
      var posx = ScreenDimensions.viewportSize.width * 0.05;
      var posy = ScreenDimensions.viewportSize.height;
      this.titleLabel.setPosition(cc.p(posx, posy));
      this.titleLabel.setAnchorPoint(cc.p(0.0, 1.0));
      // this.titleLabel.color = cc.ccc(180, 0, 0);
      this.addChild(this.titleLabel);
    },

    fire1: function () {
      //this.toggleDebug();
      var gameArea = this.getChildByTag(this.TAG_GAMEAREA_LAYER);
      var newScale = Math.max(gameArea.getScale() / 2, 0.25);
      gameArea.runAction(
        cc.ScaleTo.create(0.5, newScale)
      );
    },

    fire2: function () {
      // this.toggleDebug();
      var gameArea = this.getChildByTag(this.TAG_GAMEAREA_LAYER);
      var newScale = Math.min(gameArea.getScale() * 2, 2);
      gameArea.runAction(
        cc.ScaleTo.create(0.5, newScale)
      );
    },

    findFingerObject: function (touch) {
      var id = touch.getID();
      var gameArea = this._getGameArea();
      var sprite = gameArea.getChildByTag(this.TAG_TOUCHES + id);
      if (!sprite) {
        sprite = cc.Sprite.create('res/images/1x1-pixel.png');
        var scale = this._getTilemapScale();
        scale *= 2;
        sprite.setScaleX(32 * scale);
        sprite.setScaleY(32 * scale);
        sprite.setAnchorPoint(cp.v(0.5, 0.5));
        sprite.setRotation(45);
        gameArea.addChild(sprite, 10000, this.TAG_TOUCHES + id);
      }
      return sprite;
    },

    feedbackFingerStart: function (touch) {
      var sprite = this.findFingerObject(touch);
      var gameArea = this._getGameArea();
      var point = gameArea.convertTouchToNodeSpace(touch);
      sprite.setPosition(point);

      sprite.runAction(
        cc.RepeatForever.create(
          cc.Sequence.create(
            cc.FadeIn.create(0.25),
            cc.FadeOut.create(0.25)
      )));
      sprite.runAction(
        cc.RepeatForever.create(
          cc.Sequence.create(
            cc.RotateTo.create(0.25, 180, 180),
            cc.RotateTo.create(0.25, 0, 0)
      )));

    },

    feedbackFingerMoved: function (touch) {
      var sprite = this.findFingerObject(touch);
      var gameArea = this._getGameArea();
      var point = gameArea.convertTouchToNodeSpace(touch);
      sprite.setPosition(point);
    },

    feedbackFingerStop: function (touch) {
      var sprite = this.findFingerObject(touch);
      var gameArea = this._getGameArea();
      var point = gameArea.convertTouchToNodeSpace(touch);
      sprite.setPosition(point);

      var suicide = function () {
        gameArea.removeChild(sprite);
      };

      sprite.runAction(
        cc.Sequence.create(
          cc.FadeOut.create(0.15),
          cc.CallFunc.create(suicide)
      ));
      sprite.runAction(
        cc.ScaleTo.create(0.15, 0.1)
      );

    },

    createTouchListener: function () {
      var listener1 = cc.EventListener.create({
        event: cc.EventListener.TOUCH_ONE_BY_ONE,
        swallowTouches: true,
        onTouchBegan: function (touch, event) {
          var target = event.getCurrentTarget();
          var locationInNode =
            target.convertToNodeSpace(touch.getLocation());
          var s = target.getContentSize();
          var rect = cc.rect(0, 0, s.width, s.height);
          if (cc.rectContainsPoint(rect, locationInNode)) {
            target.feedbackFingerStart(touch);
            return true;
          }
          return false;
        },

        onTouchMoved: function (touch, event) {
          var target = event.getCurrentTarget();
          target.feedbackFingerMoved(touch);
          return true;
        },

        onTouchEnded: function (touch, event) {
          var target = event.getCurrentTarget();
          var point = target.convertTouchToNodeSpace(touch);
          target.feedbackFingerStop(touch);
          target.checkGeneratorClicked(point);
          target.checkAttackerClicked(point);
          return true;
        }
      });
      cc.eventManager.addListener(listener1, this);
    },

    update: function (dt) {
      this.lastTime += dt; // in seconds
      if (this.lastTime > 1) {
        this.lastTime = 1; // cap time lapses to keep physics correct
      }
      var elapsed = this.lastTime;
      this.lastTime = 0;
      this._super(elapsed);

      this.updateGameAreaPosition(elapsed);
/*      if (elapsed < 0.05) {
        return; // don't update for tiny steps
      }
*/
      var _this = this;
      if (typeof this.space.eachBody !== 'undefined') {
        this.space.eachBody(function (body) {
          _this.applyAIToBody(elapsed, body);
        });
      } else { // not defined in native code
        var gameArea = this.getChildByTag(this.TAG_GAMEAREA_LAYER);
        var spriteBatchNode = gameArea.getChildByTag(this.TAG_SPRITEBATCH);
        spriteBatchNode.getChildren().forEach(function (child) {
          if (typeof child.ai === 'object') {
            child.ai.update(elapsed, child, child.getBody());
          }
        });
      }
    },

    applyAIToBody: function (dt, body) {
      if (body && body.userData) {
        var sprite = body.userData;
        if (typeof sprite.ai === 'object') {
          sprite.ai.update(dt, sprite, body);
        }
      }
    },

    _getPadPos: function () {
      var controls = this.getChildByTag(this.TAG_CONTROLS_LAYER);
      var pad = controls.getChildByTag(this.TAG_JOYSTICK);
      return pad.getPadPosition();
    },

    _getGameArea: function () {
      return this.getChildByTag(this.TAG_GAMEAREA_LAYER);
    },

    _getTilemap: function () {
      var gameArea = this._getGameArea();
      return gameArea.getChildByTag(this.TAG_TILEMAP);
    },

    _getTilemapScale: function () {
      return this._getTilemap().getScale();
    },

    ensureGameAreaPositionWithinBoundaries: function (newPos) {
      var gameArea = this._getGameArea();
      var totalWidth = this.worldSize.width * gameArea.getScale();
      var totalHeight = this.worldSize.height * gameArea.getScale();

      var topX = Math.min(-totalWidth + ScreenDimensions.viewportSize.width, 0);
      var topY = Math.min(ScreenDimensions.viewportSize.height - totalHeight,
        0);

      newPos.x = Math.min(newPos.x, 0);
      newPos.x = Math.max(newPos.x, topX);
      newPos.y = Math.min(newPos.y, 0);
      newPos.y = Math.max(newPos.y, topY);
      if (ScreenDimensions.viewportSize.width > totalWidth) {
        newPos.x = Math.floor((ScreenDimensions.viewportSize.width -
          totalWidth) / 2);
      }
      if (ScreenDimensions.viewportSize.height > totalHeight) {
        newPos.y = Math.floor((ScreenDimensions.viewportSize.height -
          totalHeight) / 2);
      }

      // newPos.x = Math.floor(newPos.x);
      // newPos.y = Math.floor(newPos.y);
    },

    updateGameAreaPosition: function (dt) {
      // function sign(x) { return x > 0 ? 1 : x < 0 ? -1 : 0; }
      var padPos = this._getPadPos();
      var gameArea = this._getGameArea();
      var newPos = cc.p(Math.floor(gameArea.getPositionX()),
        Math.floor(gameArea.getPositionY()));

      if (Math.abs(padPos.y) >= 1) {
        newPos.y -= 10 * dt * padPos.y;
      }
      if (Math.abs(padPos.x) >= 1) {
        newPos.x -= 10 * dt * padPos.x;
      }

      this.ensureGameAreaPositionWithinBoundaries(newPos);

      gameArea.setPosition(newPos);
    }

  });
   
  module.exports = ChapterOne;
})();
