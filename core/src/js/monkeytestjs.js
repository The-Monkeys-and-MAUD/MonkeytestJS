/* globals QUnit, test, asyncTest */
(function (global) {

    'use strict';

    // block QUnit to try autostart without being ready
    global.QUnit.config.autostart = false;

    var APP = global._MonkeyTestJS = global._MonkeyTestJS || {}, // APP namespace
        $$ = global.$$ = global.jQuery.noConflict(true); // jquery no conflict

    $$(function() {
        // MonkeyTestJS can be configured by assigning the configuration object to a global variable monkeytestjs
        // before this script loads. If no such variable has been defined, this script will attempt to load config.json
        // (via ajax) from the server.
        function configured(config) {
            var monkeytestjs = global.monkeytestjs = new APP.MonkeyTestJS(); // create our singleton
            monkeytestjs.start($$.extend({}, {
                workspace: window.frames[0],
                jQuery: $$
            }, config));
        }
        if (typeof global.monkeytestjs === 'object') {
            var config = global.monkeytestjs;
            configured(config);
        } else {
            $$.getJSON('config.json', function (data) {
                configured(data);
            })
                .fail(function () {
                    global.alert(
                        'Failed to load config.json. Please make sure this file exists and it is correctly formatted.\n\n' +
                        'Alternatively, configure MonkeyTestJS by defining a global variable before including the monkeytestjs script:\n\n' +
                        '    var monkeytestjs = <contents of config.json>;'
                    );
                });
        }

    });

}(this));
