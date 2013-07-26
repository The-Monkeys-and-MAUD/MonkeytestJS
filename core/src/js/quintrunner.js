/* globals QUnit, test, asyncTest */
(function (global) {

    // APP namespace
    var APP = global._QUnitRunner = global._QUnitRunner || {};

    // block QUnit to try autostart without being ready
    global.QUnit.config.autostart = false;

    // jquery no conflict 
    var $$ = global.$$ = global.jQuery.noConflict(true);

    // create our singleton / factory
    var qunitrunner = global.qunitrunner = new APP.QUnitRunner();

    // TODO: create a nicer method to wrap this startup
    // start runner with json config file
    $$(function () {

        // read configuration from a file called 'config.json'
        $$.getJSON('config.json', function (data) {

            qunitrunner.start($$.extend({}, {
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
