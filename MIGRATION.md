# Notes on project migration from js-3.1/x-3.3 to 3.6

* Download cocos2d-js and cocos2d-x from [cocos-2d-x main site](http://www.cocos2d-x.org/)
* Run `setup.py` for both.
* Created a skeleton game to copy from, using
```
cd ~/code
cocos new -e ~/Documents/cocos/cocos2d-js-v3.6/ -p com.gatillos.js03 -l js -d . js-multiplatform-game03
```
* Replace the folders `frameworks` and `tools` in the git project with the ones with this newly generated project. Then remove the new project.

# Notes on project migration from 2.x to js-3.1/x-3.3

The following was used to create a new base project with cocos2d-js-v3.1 and cocos2d-x-3.3rc0 and migrate
the old code to it

* Download cocos2d-js and cocos2d-x from [cocos-2d-x main site](http://www.cocos2d-x.org/)
* Run `setup.py` for both.

* Created a skeleton game using
```
cd ~/code
cocos new -e ~/Documents/cocos/cocos2d-js-v3.2/ -p com.gatillos.js03 -l js -d . js-multiplatform-game03
```

After this, the structure will look something like:
```
- frameworks
  |- cocos2d-html5
  |- js-bindings
     |- bindings
     |- cocos2d-x
     \- external
        \- spidermonkey
  |- runtime-src
     |- Classes
        |- AppDelegate.cpp
        |- AppDelegate.h
     |- proj.android
        |- AndroidManifest.xml
        |- build.xml
        \- (...)
     |- proj.ios_mac
        - ios
          |- AppController.h
          |- AppController.mm
          |- Icons*.png
          |- Info.plist
          |- RootViewController.h
          |- RootViewController.mm
          |- main.m
          \- Prefix.pch
        - mac
          |- main.cpp
          |- Icon.icsn
          |- Info.plist
          \- Prefix.pch
        - js-multiplatform-game02.xcodeproj
          \- project.pbxproj
     |- runtime-src/proj.win32
- res
  |- (...)
- src
  |- app.js
  \- resource.js
- tools
  |- bindings-generator
  \- tojs
- index.html
- main.js
- project.json
```

After running for the first time (e.g. `cocos run -p android`), this is also created:

```
- runtime
  |- android
  \- ios
```

I did the following modifications:
* Edited `project.json` to include module `chipmunk` and to load all my scripts.

