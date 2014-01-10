module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
            '<%= grunt.template.today("yyyy-mm-dd") %> */ \n',
        concat:{
            dist:{
                src:['js/**/*.js', 'js/*.js'],
                dest:'../../core/js/<%= pkg.name %>.js',
                separator:';'
            }
        },
        nodeunit: {
            all:['test/**/*.js']
        },
        jshint:{
            options:{
                curly:true,
                eqeqeq:true,
                immed:true,
                latedef:true,
                newcap:true,
                noarg:true,
                sub:true,
                undef:true,
                boss:true,
                eqnull:true,
                browser:true,
                globals:{
                    exports:true,
                    module:false, jQuery:false,
                    '$':false,
                    console:false,
                    Modernizr:false
                }
            },
            gruntfile: {
                src: 'Gruntfile.js'
            },
            lib_test: {
                src:['Gruntfile.js', 'js/**/*.js', '!js/lib/templates.js' ]
            }
        },
        watch:{
            dist:{
                files : ['<%= concat.dist.src %>'],
                tasks: ['lint', 'concat', 'min']
            }
        },
        reload: {
            port: 35729, // LR default
            liveReload: {}, 
            proxy: {
                host: 'pauls.dev'
                //port: '8888'
            }   
        },
        dox: {
          libdocs : {
              src: ['<%= concat.dist.src %>'],
              dest: 'doc/'
          }
        },
        jsbeautifier : { 
            files : ['<%= concat.dist.src %>'],
            options : { 
                indent_size: 4,
                indent_char: " ",
                indent_level: 0,
                indent_with_tabs: false,
                preserve_newlines: true,
                max_preserve_newlines: 2, 
                jslint_happy: true,
                brace_style: "collapse",
                keep_array_indentation: false,
                keep_function_indentation: false,
                break_chained_methods: true,
                space_before_conditional: true,
                eval_code: false,
                indent_case: false,
                wrap_line_length: 80, 
                unescape_strings: false
            }   
        },  
        bowerful: {
            dist: {
                store: 'components',
                dest: '../js/vendor',
                destfile: 'vendor',
                packages: {
                    jquery: "",
                    qunit: ""
                },
                customtarget: {
                    jquery: '../js/vendor/jquery',
                    qunit: '../js/vendor/qunit'
                }
            }
        }, 
        clean: {
            install: {
                src: '<%= bowerful.dist.store %>'
            }
        },
        uglify: {
            options: {
                banner: '<%= banner %>',
                separtor: ';'
            },
            dist: {
                src: '<%= concat.dist.dest %>',
                dest:'../../core/js/<%= pkg.name %>.min.js'
            }
        }
    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-nodeunit');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-bowerful');

    // reload
    grunt.loadNpmTasks('grunt-reload');

    // beautifier
    grunt.loadNpmTasks('grunt-jsbeautifier');

    // documentation generation
    grunt.loadNpmTasks('grunt-dox');

    // install 
    grunt.registerTask('install', 'Install javascript components defined on Gruntfile',  ['bowerful', 'clean:install']);

    // Better naming conventions
    grunt.registerTask('lint', 'Lint javascript files with default validator', 'jshint');
    grunt.registerTask('min',  'Minify files with default minifier', 'uglify');
    grunt.registerTask('test', 'Unit testing on the command line with default testing framework', 'nodeunit');

    // watch tasks
    grunt.registerTask('dev',     ['reload', 'watch']);

    // prod task, run on the deployment server
    grunt.registerTask('default', ['lint', 'jsbeautifier', 'concat','min', 'dox']);
};
