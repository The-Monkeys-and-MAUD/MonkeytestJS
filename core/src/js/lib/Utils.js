/* globals QUnit, test, asyncTest */
(function (global) {

    /**
     * Utility helpers.
     *
     *   * `log` Function - wrapper to allow logs to be output without causing browser error
     *   * `__hasProp` Function - checking for properties that are not part of prototype
     *   * `__extends` Function - extending object and adding constructor reference
     *
     * @api public
     */
    var UTILS = global.Utils = {
        log: function (s) {
            if (global.console) {
                console.log(s);
            }
        },
        registerTest: function (name, test) {
            global.QUnitRunner.registerTest(name, test);
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
