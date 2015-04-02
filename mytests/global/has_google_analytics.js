registerTest ('Has Google Analytics', {
    setup: function() {

    },
    load : function() {
        this
            .test('Do we have a valid GA ID (not UA-XXXXX-X)?',function(assert, $) {
                var script = $('script[src*="/analytics.js"]'), universal = false, self = this, w = this.window;

                //Make it asynchronus!
                var done = assert.async();

                if (script.length) {
                    assert.ok(true, "Google Analytics script analytics.js present in page");
                    assert.ok(!!w.ga, "ga object is present");
                    universal = true;
                } else {
                    script = $('script[src*="/ga.js"]');
                    assert.equal(1, script.length, "Google Analytics script ga.js present in page");
                    assert.ok(!!w._gaq, "_gaq object is present");
                }

                function doTests(id) {
                    assert.equal('UA-', id.substr(0, 3), 'Google Analytics account ID should start with UA-');
                    assert.notEqual('UA-XXXXX-X', id, 'Google Analytics account ID should not be UA-XXXXX-X.');
                    // self.asyncTestDone();
                    done();
                }

                if (universal && w.ga) {
                    w.ga(function(tracker) {
                        doTests(tracker.get('trackingId'));
                    });
                } else if (w._gaq) {
                    w._gaq.push(function() {
                        var pageTracker = w._gat._getTrackerByName();
                        doTests(pageTracker._getAccount());
                    });
                } else {
                    //self.asyncTestDone();

                    done();
                }
            });
    }
});
