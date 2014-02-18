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
        this.config = runner.config;
    };

    /**
     * Load script
     *
     * @memberOf MonkeyTestJSTest
     * @api public
     */
    MonkeyTestJSTest.prototype.load = function () {

        var script, firstScript = document.getElementsByTagName('script')[0],
            src = this.src.charAt(0) === '/' ? this.src : (this.runner.testsUrl + this.src);
        script = document.createElement('script');
        script.src = src + (src.indexOf('?')>=0 ? '&' : '?') + '_=' + (Math.random()*10000000000000000);
        firstScript.parentNode.insertBefore(script, firstScript);

        return true;
    };

}(this));
