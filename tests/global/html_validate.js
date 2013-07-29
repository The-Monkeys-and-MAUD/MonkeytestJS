registerTest ('Has a Valid HTML According To W3C Validator', {
    setup:function () {
        this.proxyUrl = '/tests/core/proxy.php?url=';
        this.validatorUrl = 'validator.w3.org/check';
        this.imagesFolder = 'core/images/';
    },
    load : function () {
        this
        .asyncTest('Is HTML Valid?',function() {

            var self = this;

            $$.post(this.proxyUrl + this.validatorUrl,{fragment:this.page.source})
            .success(function(data) { // we got some validation results

                // images are not in the root so lets change them to the correct path
                var doc = $$(data.contents.replace(/images\//g, self.imagesFolder)),
                    errors = doc.find('li.msg_err'); // error messages

                if (errors.length) { // invalid page, use the validator messages for the errors.
                    
                    errors.each(function(){
                      var msg = $$(this).find('span.msg');

                      ok (false, msg.text());
                    });
                } else { // page is valid

                    ok( true, 'HTML is valid' );
                }

                // needs to be called upon assync tests
                self.asyncTestDone();
            })
            .error(function() { // validation couldnt be performed.

                ok( false, 'Unable to get validation results' );

                // needs to be called upon assync tests
                self.asyncTestDone();
            });

        })
        .start();
    }
});
