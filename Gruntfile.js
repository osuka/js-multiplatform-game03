'use strict';

// Use:
// 
// grunt build      to package javascript code
// 
// grunt clean      to clean intermediate files
// grunt clean:all  to clean all intermediate files
//                  including android / ios binaries
// 
// 

module.exports = function (grunt) {
  // load all grunt tasks
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  grunt.initConfig({
    paths: {
      res: 'res',
      src: 'base-src',
      runtimesrc: 'frameworks/runtime-src',
      dist: 'src',
      webhome: '.',
      test: 'test'
    },

    properties: grunt.file.isFile('grunt.local.json') ?
                  grunt.file.readJSON('grunt.local.json') : {},

    clean: {
      dist: [
        '<%= paths.dist %>/bundle-scripts.js',
      ],
      all: [
        // cocos has an ugly habit of copying everything to the Android project
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
        '<%= paths.test %>/spec/{,*/}*.js',
        '!<%= paths.src %>/external/{,*/}*.js'
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
      options: {
        livereload: true
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

    compress: {
      main: {
        options: {
          archive: 'archived-web-version.zip'
        },
        files: [
          {
            expand: true,
            cwd: '.',
            src: [
              '<%= paths.dist %>/**',
              '<%= paths.res %>/**',
              'frameworks/cocos2d-html5/**',
              'index.html',
              'main.js',
              'project.json',
            ]
          }
        ]
      }
    },

    shell: {
    },

    connect: {
      options: {
        port: 9000,
        open: true,
        livereload: true
      },
      server: {
        base: [
          '<%= paths.dist %>',
          '<%= paths.webhome %>'
        ]
      }
    }

  });

  grunt.registerTask('build', [
    'jshint',
    'clean:dist',
    'browserify'
  ]);
 
  grunt.registerTask('test', [
    'jshint',
    'clean:dist',
    'mocha'
  ]);

  grunt.registerTask('server', [
    'build',
    'connect:server',
    'watch'
  ]);

};
