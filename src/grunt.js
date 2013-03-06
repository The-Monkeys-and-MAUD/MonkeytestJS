module.exports = function(grunt) {


  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',
    meta: {
      banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */',
      modernizrbanner: '/* Modernizr 2.6.2 (Custom Build) | MIT & BSD\n' +
        ' * Build: http://modernizr.com/download/#-fontface-backgroundsize-borderimage-borderradius-boxshadow-flexbox-hsla-multiplebgs-opacity-rgba-textshadow-cssanimations-csscolumns-generatedcontent-cssgradients-cssreflections-csstransforms-csstransforms3d-csstransitions-applicationcache-canvas-canvastext-draganddrop-hashchange-history-audio-video-indexeddb-input-inputtypes-localstorage-postmessage-sessionstorage-websockets-websqldatabase-webworkers-geolocation-inlinesvg-smil-svg-svgclippaths-touch-webgl-shiv-mq-cssclasses-addtest-prefixed-teststyles-testprop-testallprops-hasevent-prefixes-domprefixes-load\n' +
        ' */'
    },
    concat: {
      dist: {
        src: ['<banner:meta.banner>', 'js/*.js'],
        dest: '../js/<%= pkg.name %>.min.js',
        separator: ';'
      },
      dev: {
        src: ['<config:concat.dist.src>'],
        dest: '../js/<%= pkg.name %>.js',
        separator: ';'
      },
      jstest: {
        src: ['<config:concat.dist.src>'],
        dest: 'test/<%= pkg.name %>.js',
        separator: ';'
      },
      test: {
        src: ['<banner:meta.banner>', 'test/spec/**/*.js'],
        dest: 'test/test.js',
        separator: ';'
      }
    },
    min: {
      dist: {
        src: ['<banner:meta.banner>', '<config:concat.dev.dest>'],
        dest: '<config:concat.dist.dest>',
        separator: ';'
      }
    },
    test: {
      files: ['test/**/*.js']
    },
    lint: {
      files: ['grunt.js', 'js/**/*.js' ]
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        browser:true
      },
      globals: {
        exports: true,
        module: false,
        jQuery: false,
        '$': false,
        console: false,
        Modernizr:false
      }
    },
    watch: {
      all: {
          files: ['<config:lint.files>'],
          tasks: 'lint concat:dev'
      },
      js: {
          files: ['<config:lint.files>'],
          tasks: 'lint concat:dev'
      }
    },
    uglify: {}
  });

  grunt.registerTask('preparetest', 'lint concat:jstest concat:test');

  grunt.registerTask('dev', 'watch:all');
  grunt.registerTask('dev:js', 'watch:js');

  // prod task, run on the deployment server
  grunt.registerTask('default', 'lint concat:dev concat:dist test min');
};
