/* globals cc, cp */

(function () {
  'use strict';
    
  var PhysicsSpriteHelper = require('./physicsSprite');
  var BaseLayer = require('./baseLayer');
  var ScreenDimensions = require('./screenDimensions');
  var behaviourHandler = require('./behaviours/behaviourHandler');
  var MovementActuator = require('./behaviours/movementActuator');
  // var SlowWalkerAI = require('./behaviours/slowWalkerAI');
  var WalkToGoalAI = require('./behaviours/walkToGoalAI');
  var WaitForDestinationAI = require('./behaviours/waitForDestinationAI');
  var WalkToDestinationAI = require('./behaviours/walkToDestinationAI');
  var AStarModule = require('./external/astar.js');
  // var astar = AStarModule.astar;
  var Graph = AStarModule.Graph;

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

      this.updateMapGraph();

      this.toggleDebug();

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
      var gameArea = this._getGameArea();
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
      var scale = this._getTilemapScale();
      var attackerObjects = tilemap.getObjectGroup('attackers').getObjects();
      var tag = 11000;
      var _this = this;
      attackerObjects.forEach(function (attackerObject) {
        var pos = _this.ccPosForObject(attackerObject, scale);
        var sprite = _this.createSampleChar('persona',
          pos, tag + 1, 1 /* zoom */);
        _this.attackers.push(sprite);
        var behaviour = behaviourHandler.addBehaviour(sprite,
          MovementActuator);
        behaviour.init();
      });
    },

    createDefendants: function (tilemap) {
      var scale = this._getTilemapScale();
      var attackerObjects = tilemap.getObjectGroup('defendants').getObjects();
      var tag = 12000;
      var _this = this;
      attackerObjects.forEach(function (attackerObject) {
        var pos = _this.ccPosForObject(attackerObject, scale);
        var sprite = _this.createSampleChar('defendant',
          pos, tag + 1, 1 /* no zoom */);
        _this.defendants.push(sprite);
        var behaviour = behaviourHandler.addBehaviour(sprite, WalkToGoalAI);
        behaviour.init(_this._getGameArea().getChildByTag(_this.TAG_GOAL));
      });
    },

    createGenerators: function (tilemap) {
      var attackers = tilemap.getObjectGroup('generator-attacker')
        .getObjects();
      var defendants = tilemap.getObjectGroup('generator-defendant')
        .getObjects();

      var scale = this._getTilemapScale();
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
      var gameArea = this._getGameArea();
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
      var _this = this;
      this.attackGenerators.forEach(function (r) {
        if (cc.rectIntersectsRect(worldRect, r)) {
          var center = cc.p(
             worldRect.x + worldRect.width / 2,
             worldRect.y + worldRect.height / 2);
          _this.createSampleChar('persona',
            center, tag, 1 /* zoom */);
          return center;
        }
      });
    },

    // if a character is clicked
    checkAttackerClicked: function (point) {
      var worldRect = this.pointToWorldRect(point);
      var behaviour;

      for (var i = 0; i < this.attackers.length; i++) {
        var sprite = this.attackers[i];
        var r = cc.rect(sprite.x - sprite.getContentSize().width / 2,
          sprite.y - sprite.getContentSize().height / 2,
          sprite.getContentSize().width,
          sprite.getContentSize().height);

        var intersects = cc.rectIntersectsRect(worldRect, r);
        if (intersects && this.selectedAttacker !== sprite) {
          if (this.selectedAttacker) {
            // remove from previous selection
            behaviourHandler.removeBehaviour(this.selectedAttacker,
              WaitForDestinationAI);
          }
          if (behaviourHandler.findBehaviour(sprite, WalkToDestinationAI)) {
            // cancel walk
            behaviourHandler.removeBehaviour(sprite, WalkToDestinationAI);
          } else {
            behaviour = behaviourHandler.addBehaviour(sprite,
              WaitForDestinationAI);
            behaviour.init(sprite);
            this.selectedAttacker = sprite;
          }
          return; // only one click allowed
        }
      }
      
      // if we get here, we clicked but not in a player so it can be
      // choosing destination
      if (this.selectedAttacker) {
        var destination = cc.p(worldRect.x + worldRect.width / 2,
                               worldRect.y + worldRect.height / 2);
        behaviourHandler.removeBehaviour(this.selectedAttacker,
          WaitForDestinationAI);
        behaviour = behaviourHandler.addBehaviour(this.selectedAttacker,
          WalkToDestinationAI);
        behaviour.init(this.selectedAttacker, destination, this._mapGraph);
        this.selectedAttacker = undefined;
      }

    },


    createSolids: function (tilemap) {
      var objectGroup = tilemap.getObjectGroup('solids');
      var objects = objectGroup.getObjects();

      var scale = this._getTilemapScale();
      var _this = this;
      objects.forEach(function (obj) {
        var shape = _this.shapeForObject(obj, scale);
        _this.space.addStaticShape(shape);
        shape.setElasticity(0);
        shape.setFriction(1);
      });
    },

    // updates/creates a Graph for pathfinding in this physics world
    updateMapGraph: function () {
      // jshint maxstatements:100
      var tilemap = this._getTilemap();
      var mult = ScreenDimensions.scale / 2;
      this._mapGraph = this._mapGraph || {};
      this._mapGraph.granularity = this._mapGraph.granularity || {
        x: tilemap.getTileSize().width * mult,
        y: tilemap.getTileSize().height * mult
      };

      // checks if a shape blocks part of the pathfinding grid
      var granularity = this._mapGraph.granularity;
      var checkShape = function (shape, data) {
        var bb = shape.getBB();
        for (var x = bb.l; x < bb.r; x += granularity.x) {
          for (var y = bb.b; y < bb.t; y += granularity.y) {
            var iPos = Math.floor(x / granularity.x);
            var jPos = Math.floor(y / granularity.y);
            if (iPos >= 0 && iPos < data.length &&
                jPos >= 0 && jPos < data[iPos].length) {
              data[iPos][jPos] = 0;
            }
          }
        }
      };

      // cache static objects grid
      var createEmptyGrid = function (width, height) {
        var grid = [];
        for (var i = 0; i < width; i++) {
          var row = [];
          for (var j = 0; j < height; j++) {
            row.push(1);
          }
          grid.push(row);
        }
        return grid;
      };

      if (!this._mapGraph.tileCache) {
        this._mapGraph.tileCache = createEmptyGrid(
          Math.floor(this.worldSize.width / granularity.x),
          Math.floor(this.worldSize.height / granularity.y));
        // check only shapes that are from static bodies
        var cache = this._mapGraph.tileCache;
        this.space.eachShape(function (shape) {
          if (shape.body.isStatic()) {
            checkShape(shape, cache);
          }
        });
      }

      if (!this._mapGraph.cache) {
        this._mapGraph.cache = createEmptyGrid(
          Math.floor(this.worldSize.width / granularity.x),
          Math.floor(this.worldSize.height / granularity.y));
      }

      // init to cache
      for (var i = 0; i < this.worldSize.width / granularity.x; i++) {
        for (var j = 0; j < this.worldSize.height / granularity.y; j++) {
          this._mapGraph.cache[i][j] = this._mapGraph.tileCache[i][j];
        }
      }

      // check only shapes that are not static shape
      var data = this._mapGraph.cache;
      this.space.eachShape(function (shape) {
        if (!shape.body.isStatic()) {
          checkShape(shape, data);
        }
      });

      this._mapGraph.graph = new Graph(this._mapGraph.cache/*,
        { diagonal: true }*/);
      // this.drawMapGraphOverlay();
    },

    drawMapGraphOverlay: function () {
      var overlay = this._getOverlayArea();
      overlay.removeAllChildren(true);
      var data = this._mapGraph.graph.grid;
      var granularity = this._mapGraph.granularity;
      for (var i = 0; i < data.length; i++) {
        for (var j = 0; j < data[i].length; j++) {
          if (data[i][j].weight) {
            var sprite = new cc.Sprite();
            sprite.initWithFile('res/images/1x1-pixel.png',
              cc.rect(0, 0, 1, 1));
            sprite.setScale(granularity.x);
            sprite.setAnchorPoint(cc.p(0, 0));
            sprite.setPosition(cc.p(i * granularity.x, j * granularity.y));
            // sprite.opacity = 80;
            overlay.addChild(sprite);
          }
        }
      }
    },

    drawShapesOverlay: function () {
      var overlay = this._getOverlayArea();
      overlay.removeAllChildren(true);
      this.space.eachShape(function (shape) {
        var sprite = new cc.Sprite();
        sprite.initWithFile('res/images/1x1-pixel.png',
          cc.rect(0, 0, 1, 1));
        var bb = shape.getBB();
        sprite.setScaleX(Math.abs(bb.r - bb.l));
        sprite.setScaleY(Math.abs(bb.t - bb.b));
        sprite.setAnchorPoint(cc.p(0.5, 0.5));
        sprite.setPosition(shape.getBody().getPos());
        overlay.addChild(sprite);
      });
      this.space.eachBody(function (body) {
        var sprite = new cc.Sprite();
        sprite.initWithFile('res/images/joystick-button.png',
          cc.rect(0, 0, 75, 75));
        sprite.setScale(4.0 / 75);
        sprite.setAnchorPoint(cc.p(0.5, 0.5));
        sprite.setPosition(body.getPos());
        overlay.addChild(sprite);
      });
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
      var gameArea = this._getGameArea();
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
      var gameArea = this._getGameArea();
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

      var animation;
      var addFrameToAnimation = function (frame) {
        var fileName = frame.file + '.png';
        var spriteFrame = cache.getSpriteFrame(fileName);
        if (spriteFrame) {
          animation.addSpriteFrame(spriteFrame);
        }
      };

      // iterate over all characters
      for (var character in this.characters) {

        // iterate over all possible states
        for (var state in this.characters[character]) {

          animation = cc.Animation.create();
          animation.setDelayPerUnit(0.150);
          animation.setLoops(true);

          // iterate over animation frames for that state
          this.characters[character][state].forEach(addFrameToAnimation);

          // cache animation objects with: <characterName> + '.' + <stateName>
          // e.g. 'defendant.standing'
          animations.addAnimation(animation, character + '.' + state);

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

    zoomTo: function (newScale) {
      var gameArea = this._getGameArea();
      var time = 0.5;
      gameArea.runAction(
        cc.ScaleTo.create(time, newScale)
      );
      // var center = gameArea.getPosition();
      // var dest = cc.p(
      //   center.x - (this.worldSize.width * newScale) / 2 -
      //              (this.worldSize.width * newScale) / 2,  // anchor (0, 0)
      //   center.y - (this.worldSize.width * newScale) / 2 -
      //              (this.worldSize.height * newScale) / 2);
      // this.ensureGameAreaPositionWithinBoundaries(dest);
      // gameArea.runAction(
      //   cc.MoveTo.create(time, dest)
      // );
      // cc.log('Origin: ' + center.x + ',' + center.y + ' • ' +
      //        'Dest: ' + dest.x + ',' + dest.y + ' • ' +
      //        'Scale: ' + newScale + ' • ' +
      //        'Anchor: ' + gameArea.getAnchorPoint().x + ',' +
      //                     gameArea.getAnchorPoint().y);
    },

    fire1: function () {
      this.zoomTo(Math.max(this._getGameArea().getScale() / 2, 0.25));
    },

    fire2: function () {
      this.zoomTo(Math.max(this._getGameArea().getScale() * 2, 2));
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
      // this.drawShapesOverlay();

      this.lastTime += dt; // in seconds
      if (this.lastTime > 1) {
        this.lastTime = 1; // cap time lapses to keep physics correct
      }
      var elapsed = this.lastTime;
      this.lastTime = 0;
      this._super(elapsed);

      // todo: move this somewhere saner
      if (typeof this.lastMapUpdate === 'undefined') {
        this.lastMapUpdate = 0;
      }
      this.lastMapUpdate += elapsed;
      if (this.lastMapUpdate > 1.0) {
        this.lastMapUpdate = 0;
        this.updateMapGraph(); // for pathfinding
      }

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
        var gameArea = this._getGameArea();
        var spriteBatchNode = gameArea.getChildByTag(this.TAG_SPRITEBATCH);
        spriteBatchNode.getChildren().forEach(function (child) {
          behaviourHandler.runBehaviours(elapsed, child, child.getBody());
        });
      }
    },

    applyAIToBody: function (dt, body) {
      if (body && body.userData) {
        behaviourHandler.runBehaviours(dt, body.userData, body);
      }
    },

    _getPadPos: function () {
      var controls = this.getChildByTag(this.TAG_CONTROLS_LAYER);
      var pad = controls.getChildByTag(this.TAG_JOYSTICK);
      return pad.getPadPosition();
    },

    _getOverlayArea: function () {
      var overlay = this._getGameArea().getChildByTag(this.TAG_OVERLAY_LAYER);
      if (!overlay) {
        overlay = new cc.Layer();
        this._getGameArea().addChild(overlay, this.GAMEAREA_LAYER_ZORDER + 1,
          this.TAG_OVERLAY_LAYER);
      }
      return overlay;
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
