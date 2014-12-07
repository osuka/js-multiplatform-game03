'use strict';

// Use:
// 
// grunt build      to package javascript code
// 
// grunt clean      to clean intermediate files
// 
// 

module.exports = function (grunt) {
  // load all grunt tasks
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  grunt.initConfig({
    paths: {
      res: 'Resources',
      src: 'base-src',
      runtimesrc: 'frameworks/runtime-src',
      dist: 'src',
      webhome: '.',
      test: 'test'
    },

    properties: grunt.file.isFile('grunt.local.json') ?
                  grunt.file.readJSON('grunt.local.json') : {},

    open: {
      server: {
        path: 'http://localhost:<%= connect.options.port %>'
      },
      test: {
        path: 'http://localhost:<%= connect.test.options.port %>'
      }
    },

    clean: {
      dist: [
        '<%= paths.dist %>/bundle-scripts.js',
        // cocos has a very ugly habit of copying everything into the Android project
        '<%= paths.runtimesrc %>/proj.android/assets/**',
        '<%= paths.runtimesrc %>/proj.android/bin/**',
        '<%= paths.runtimesrc %>/proj.android/libs/**',
        '<%= paths.runtimesrc %>/proj.android/obj/**',
        '<%= paths.runtimesrc %>/proj.android/gen/**'
      ]
    },

    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: './jshint-reporter.js'
      },
      all: [
        'Gruntfile.js',
        '<%= paths.src %>/{,*/}*.js',
        '<%= paths.res %>/{,*/}*.js',
        '<%= paths.webhome %>/*.js',
        '<%= paths.test %>/spec/{,*/}*.js'
      ]
    },

    mocha: {
      all: {
        options: {
          reporter: 'Spec',
          run: false,
          urls: ['http://localhost:<%= connect.test.options.port %>/index.html']
        }
      }
    },

    watch: {
      compass: {
        files: ['<%= paths.res %>/styles/{,*/}*.{scss,sass}'],
        tasks: ['compass']
      },
      js: {
        files: '<%= jshint.all %>',
        tasks: ['jshint', 'browserify']
      },
      jstest: {
        files: '<%= paths.test %>/spec/{,*/}*.js',
        tasks: ['test:watch']
      }
    },

    browserify: {
      dist: {
        files: {
          '<%= paths.dist %>/bundled-scripts.js': [
            '<%= paths.src %>/boot.js'
          ]
        },
      },
      options: {
        browserifyOptions: {
          debug: true
        },
        external: [
          'jsb.js'
        ]
      }
    },

    shell: {
    }

  });

  grunt.registerTask('build', [
    'jshint',
    'clean:dist',
    'browserify'
  ]);
 
  grunt.registerTask('test', [
    'jshint',
    'clean:server',
    'connect:test',
    'mocha'
  ]);

};
