registerTest ('Has a Valid HTML According To W3C Validator', {
    setup:function () {

        'use strict';

        this.validatorUrl = 'validator.w3.org/check';
        this.imagesFolder = 'core/images/';

    },
    load : function () {

        'use strict';

        if (this.runner.baseUrl.substr(0, 4) !== 'file') {
            this
            .test('Is HTML Valid?', function(assert) {

                var self = this;

                //Make it asynchronus!
                var done = assert.async();

                this.post(this.validatorUrl, {fragment:this.page.source})
                .success(function(data) { // we got some validation results
                    if (typeof data === 'object' && data.contents) {
                        data = data.contents;
                    }
                    // images are not in the root so lets change them to the correct path
                    var doc = $$(data.replace(/images\//g, self.imagesFolder)),
                        errors = doc.find('li.msg_err'); // error messages

                    if (errors.length) { // invalid page, use the validator messages for the errors.

                        errors.each(function(){
                          var msg = $$(this).find('em').text() + ' \n '  + $$(this).find('span.msg');

                          assert.ok (false, msg.text());
                        });
                    } else { // page is valid

                        assert.ok( true, 'HTML is valid' );
                    }

                    // needs to be called upon assync tests
                    //self.asyncTestDone();

                    done();
                    
                })
                .error(function() { // validation couldnt be performed.

                    assert.ok( false, 'Unable to get validation results' );
                    // needs to be called upon assync tests
                    //self.asyncTestDone();
                });
            }); //Final argument "true" denotes that this test should run asynchronously


        } else {
            console.warn('Cannot use AJAX to validate the page source because tests are running from the filesystem.');
        }
    }
});
