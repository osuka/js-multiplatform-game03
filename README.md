# A Javascript-based base game for iOS, Android and HTML5 devices

# Summary

A maze-driven game that uses Cocos2d-x and Cocos2d-js, and hence
can run in Web, iOS and Android (potentially others). It is
intended as a playground/demonstration and currently doesn't
do much.

I'm using:

* npm, browserify for dependency management
* grunt for building
* cocos2d-x (3.3) and cocos2d-js (3.2) as the game engine
* chipmunk as the physics engine
* Inkscape for graphics

Requirements:
* node 0.10.24 to trigger everything else
* Cocos2d-x, Cocos2d-js and all their requirements:
  * Python
  * Android NDK r9d
  * Android SDK 2.3 or higher (Level 9+)

[Click here to see the web version in action](http://gatillos.com/js-multiplatform-game03/index.html)

# Why use Grunt?

I'm playing around with Cocos2d-x/Cocos2d-js and one of the most
annoying things is just how alien it is to a javascript developer.

The inclusion of Javascript as a scripting language
for game logic was clearly and afterthought and it seems
to have been driven by people from outside of the Javascript community.

On the other hand, performance in Cocos is really great, in particular
due to the inclusion of C versions of the physics engines and I
really like it as way to deliver native applications that are
developed mostly in reusable Javascript.

What I'm trying to fix:
* I need jshint in my workflow
* I need requirejs or similar modular includes
* I need to be able to test the code

Cocos2d-js doesn't allow any of that, which will necessarily mean
messy code. Just take a look at the Javascript examples and
shiver.

So here's a project attempting to fix it. Please feel free to borrow
from it all you want, and contact me if you face any trouble applying
a similar pattern it to your own projects.

The best approach I've found, and this is my third attempt, is to use
grunt to run jshint and any other pre-processing I may need, then
use browserify to create a 'bundle' with all the javascript (but including
source maps for debugging), and then to use the `cocos console` command line for
everything else (building native, running).

Concessions!
* `cocos console` wants to use the folder `src` they way I would use a `dist` folder.
    To try to not mess to much with the cocos structure, I keep the actual source
    files in `base-src`, and in `src` the generated browserified bundle.


# Installation

* Make sure you have `node` installed. If not, get it from [the nodejs website](http://nodejs.org/).

* Install `grunt`. To do so, `npm install -g grunt-cli`.

* Get a copy of the repository using [`git`](http://git-scm.com/).

```
git clone https://github.com/osuka/js-multiplatform-game03
```

* Use the node package manager to download all the external libraries.

```
npm install -g grunt-cli
npm install
```

You may need to add `sudo` to the first command (but not the second) depending on your system.

* Make sure you have google's Android NDK 9 (cocos doesn't work with 10 so far) and Android SDK
    15 or higher.
* Download `cocos2d-x` and `cocos2d-js`. Unpack them somewhere and run `setup.py` in them.

You are almost done!

# Launching the HTML5 version

You can run the HTML5 version in your computer executing the following:

```
grunt server
```

This opens a browser to [http://localhost:8000](http://localhost:9000).

Alternatively, you can use `grunt build` and then `cocos run -p web` to run it via cocos. I prefer to use Grunt because of the livereload feature.


# Launching the XCode (iOS) version

```
grunt build
cocos run -p ios
```

* The game project itself is in `frameworks/runtime-src/proj.ios_mac/js-multiplatform-game03.xcodeproj`.

# Launching the Android version

```
grunt build
cocos run -p android
```

* The game project itself is in `frameworks/runtime-src/proj.android/js-multiplatform-game03.xcodeproj`.


# Advanced

## Syntax and error checker (Linter, jshint)

This project uses (and enforces) a strict Javascript syntax and policy. It's using the common `jshint` tool to do it.

The exact policy is defined in the file `.jshintrc`. It may seem annoying at the beginning but it helps a lot in keeping code tidy and identifies a lot of common errors like use of undefined variables, unintended redefinition variables and so on.

## Automatic syntax/error checking using Sublime text editor

If you use Sublime text editor you can have it automatically invoke `jshint` and highlight on screen any possible errors. I highly recommend you give it a try.

To enable it, just make sure the linter is globally available by running:

```
npm install -g jshint
```

And then in Sublime:

* Install [Package Control](https://sublime.wbond.net/installation)
* Use it to install `SublimeLinter` and `SublimeLinter-jshint` packages
* Restart the editor

To make life even easier, you can define the following User Settings:

* "tab_size": 2
* "translate_tabs_to_spaces": true
* "rulers": [80],

