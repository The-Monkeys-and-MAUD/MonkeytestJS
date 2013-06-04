module.exports = function (grunt) {


    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
            '<%= grunt.template.today("yyyy-mm-dd") %> */ \n',
        concat:{
            dist:{
                src:['js/*.js'],
                dest:'../js/<%= pkg.name %>.js',
                separator:';'
            }
        },
        test:{
            files:['test/**/*.js']
        },
        lint:{
            files:['grunt.js', 'js/**/*.js' ]
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
                browser:true
            },
            globals:{
                exports:true,
                module:false,
                jQuery:false,
                '$':false,
                console:false,
                Modernizr:false
            }
        },
        watch:{
            all:{
                files:['<config:lint.files>'],
                tasks:'lint concat:dev'
            },
            js:{
                files:['<config:lint.files>'],
                tasks:'lint concat:dev'
            }
        },
        uglify: {
            options: {
                banner: '<%= banner %>',
                separtor: ';'
            },
            dist: {
                src: '<%= concat.dist.dest %>',
                dest:'../js/<%= pkg.name %>.min.js'
            }
        }
    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');

    // Better naming conventions
    grunt.registerTask('lint', 'Lint javascript files with default validator', 'jshint');
    grunt.registerTask('min',  'Minify files with default minifier', 'uglify');
    grunt.registerTask('test', 'Unit testing on the command line with default testing framework', 'nodeunit');

    grunt.registerTask('dev', 'watch:all');
    grunt.registerTask('dev:js', 'watch:js');

    // prod task, run on the deployment server
    grunt.registerTask('default', ['lint', 'concat','min']);
};
