registerTest ('Has Valid HTML',
    {
        setup:function () {

        },
        load : function () {
            this
            .loadPageSource ()
            .asyncTest("Is HTML Valid?",function($) {
                var _this = this;
                $$.post('/tests/core/proxy.php?url=validator.w3.org/check',{fragment:this.page.source})
                .success(function(data) {

                    var doc = $$(data.contents.replace(/images\//g, "core/images/"));
                        
                    var errors = doc.find('li.msg_err');
                    if (errors.length>0)
                    {
                        errors.each(function(){
                          var msg = $$(this).find('span.msg');
                          ok (false, msg.text());
                        });
                    } else {
                        ok( true, "HTML is valid" );
                    }
                    _this.asyncTestDone();
                })
                .error(function() {
                    ok( false, "Unable to get validation results" );
                    _this.asyncTestDone();
                });
            })
            .start();
        }
    }
);
