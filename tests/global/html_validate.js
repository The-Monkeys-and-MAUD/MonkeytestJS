monkeyTest ('Has Valid HTML',
    {
        setup:function () {

        }

        ,load : function () {
            this
            .loadPageSource ()
            .asyncTest("Is HTML Valid?",function($) {
                log ("html valid 1");
                var _this = this;
                $$.post('/tests/proxy.php?url=validator.w3.org/check',{fragment:this.page.source})
                .success(function(data) {
                    log ("html valid 2");
                    ok( true, "Got validation results" );
                    var doc = $$(data.contents);
                    var errors = doc.find('li.msg_err');
                    if (errors.length>0)
                    {
//                        ok( false, "HTML is NOT valid");
                        errors.each(function(){
                          var msg = $$(this).find('span.msg');
                          ok (false, msg.text());
                        })
                    } else {
                        ok( true, "HTML is valid" );
                    }
                    _this.asyncTestDone();
                })
                .error(function() {
                    log ("html valid 3");
                    ok( false, "Unable to get validation results" );
                    _this.asyncTestDone();
                });
            })
            .start();
        }
    }
);