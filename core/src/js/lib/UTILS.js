/* globals QUnit, test, asyncTest */
(function (global) {

    // APP namespace
    var APP = global._MonkeyTestJS = global._MonkeyTestJS || {};

    /**
     * Utility helpers.
     *
     *   * `__extends` Function - extending object and adding constructor reference
     *   * `log` Function - Wrapper on console.log to avoid undefined errors.
     *   * `registerTest` Function - wrapper to allow test suites to be created
     *
     * @api public
     */
    var UTILS = APP.Utils = {
        log: function (s) {
            if (global.console) {
                console.log(s);
            }
        },
        registerTest: function (name, test) {
            global.monkeytestjs.registerTest(name, test);
        },
        __extends: function (child, parent) {
            for (var key in parent) {
                if (Object.prototype.hasOwnProperty.call(parent, key)) {
                    child[key] = parent[key];
                }
            }

            function CTor() {
                this.constructor = child;
            }
            if (parent.prototype) {
                CTor.prototype = parent.prototype;
                child.prototype = new CTor();
                child.__super__ = parent.prototype;
            }
            return child;
        }
    },
        log = UTILS.log,
        registerTest = UTILS.registerTest,
        __extends = UTILS.__extends;

    // poluting namespace
    // TODO: maybe get rid of this and just add UTILS to
    global.log = log;
    global.registerTest = registerTest;

}(this));
