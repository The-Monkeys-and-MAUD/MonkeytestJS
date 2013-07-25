/* globals QUnit, test, asyncTest */
(function (global) {

    // block QUnit to try autostart without being ready
    global.QUnit.config.autostart = false;

    // jquery no conflict 
    var $$ = global.$$ = global.jQuery.noConflict(true);

    // create our singleton / factory
    global.QUnitRunner = new global.QUnitRunnerClass();

    // TODO: create a nicer method to wrap this startup
    // start runner with json config file
    $$(function () {

        // read configuration from a file called 'config.json'
        $$.getJSON('config.json', function (data) {

            global.QUnitRunner.start($$.extend({}, {
                workspace: window.frames[0],
                jQuery: $$
            }, data));
        })
            .fail(function () {
                global.alert(
                    "Failed to load config.json, please make sure this file exist and it is correctly formatted."
                );
            });

    });

}(this));
