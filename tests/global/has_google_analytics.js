registerTest ('Has Google Analytics', {
    setup: function() {
        this.sourceCode = this.page.source;
        this.analyticsMatchString = "ga.js";
        this.analyticsMatchDummyString = "UA-XXXXX-X";
    },
    load : function() {
        this
        .test('test we have a GA script tag',function($) {
            notEqual(this.sourceCode.indexOf(this.analyticsMatchString),-1,'We have a google analytics script tag');

        })
        .test( 'test we have a valid GA ID (not UA-XXXXX-X)', function() {
            equal(this.sourceCode.indexOf(this.analyticsMatchDummyString),-1,'We have a google id that is different from dummy "UA-XXXXX-X"');
        })
        .start();
    }
});
