/* globals QUnit, test, asyncTest */
(function (global) {
    /**
     * Constructor
     *
     * @param {Object} config configuration  to be injected
     * @param {Object} runner runner reference to be injected
     * @return {Object} QUnitRunnerPage instance.
     * @api public
     */
    var QUnitRunnerTest = global.QUnitRunnerTest = function (config, runner) {
        config = config || {};

        global.Utils.__extends(this, config);
        this.runner = runner;
    };

    /**
     * Load script
     *
     * @memberOf QUnitRunnerTest
     * @api public
     */
    QUnitRunnerTest.prototype.load = function () {
        this.addTestScript("", this.src);
    };

    /**
     * create a script and add it do the dom if there is not one already with same id.
     *
     * @param {Obect} id script id
     * @param {String} src path to the script be loaded.
     * @memberOf QUnitRunnerTest
     * @api public
     */
    QUnitRunnerTest.prototype.addTestScript = function (id, src) {
        src = this.runner.testsUrl + src;
        var d = document;
        var js, ref = d.getElementsByTagName('script')[0];
        //if (d.getElementById(id)) {return;}
        js = d.createElement('script');
        //js.id = id;
        js.async = true;
        js.src = src;
        ref.parentNode.insertBefore(js, ref);
    };

}(this));
