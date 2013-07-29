registerTest ('Facebook ID', {
        setup:function () {

        },
        load : function () {
            this
            .loadPageSource ()
            .test("Do we have a Facebook ID?", function() {

                // Searches for:
                //   FB.init({
                //       appId      : '399677190122262'
                var pattern = /FB.init\(\{([\s\n])*appId([\s\n])*:([\s\n])*([\'\"])*([0-9])*([\'\"])*/g;
                var patternId= /([0-9])+/g;
                var facebookTag = this.page.source.match(pattern);

                if (facebookTag.length<1) {
                    ok(false,"Facebook ID not found on page");
                } else {
                    var id = facebookTag[0].match(patternId);
                    notEqual(id[0],"","Has Facebook ID");
                    var env = this.env();
                    var envFacebookId = this.config().facebook.ids[env];
                    equal(id[0],envFacebookId,"Facebook ID is "+envFacebookId);
                }
            })
            .start();
        }
    }
);
