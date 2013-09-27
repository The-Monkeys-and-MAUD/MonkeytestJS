/* globals QUnit, test, asyncTest */
(function (global) {

    'use strict';

    // block QUnit to try autostart without being ready
    global.QUnit.config.autostart = false;

    var APP = global._MonkeyTestJS = global._MonkeyTestJS || {}, // APP namespace
        $$ = global.$$ = global.jQuery.noConflict(true), // jquery no conflict 
        monkeytestjs = global.monkeytestjs = new APP.MonkeyTestJS(), // create our singleton
        START = function () {
            // read configuration from a file called 'config.json'
            $$.getJSON('config.json', function (data) {

                monkeytestjs.start($$.extend({}, {
                    workspace: window.frames[0],
                    jQuery: $$
                }, data));
            })
                .fail(function () {
                    global.alert(
                        'Failed to load config.json, please make sure this file exist and it is correctly formatted.'
                    );
                });

        };

    // When dom is ready read 'config.json' file and kickstart application.
    $$(START);

}(this));
