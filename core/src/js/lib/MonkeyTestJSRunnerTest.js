/* globals QUnit, test, asyncTest */
(function (global) {

    // APP namespace
    var APP = global._MonkeyTestJS = global._MonkeyTestJS || {};

    /**
     * Constructor
     *
     * @param {Object} config configuration  to be injected
     * @param {Object} runner runner reference to be injected
     * @return {Object} MonkeyTestJSPage instance.
     * @api public
     */
    var MonkeyTestJSTest = APP.MonkeyTestJSTest = function (config, runner) {
        config = config || {};

        APP.Utils.__extends(this, config);
        this.runner = runner;
    };

    /**
     * Load script
     *
     * @memberOf MonkeyTestJSTest
     * @api public
     */
    MonkeyTestJSTest.prototype.load = function () {

        var self = this,
            time = new Date();

        global.$$.ajax({
            url: self.runner.testsUrl + self.src,
            success: function (data, textStatus) {
                //global.log("Test ready on ", new Date(), " - loading on (ms): ", new Date() - time);
            },
            error: function (error) {
                //global.log("Request to load " + src + " failed. ", error);
            },
            dataType: 'script',
            async: false
        });

        return true;
    };

}(this));
