registerTest('Brilliant Businesses', {
    setup: function() {
    },
    load: function() {
        this 

        .test ("Do we have at least ONE business on the landing page?", function(assert, $){
            var item = $('.item');
            assert.ok(item.length > 0, 'There is at least one business on the page');
        })
    }
});