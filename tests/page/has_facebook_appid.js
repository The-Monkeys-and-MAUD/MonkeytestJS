registerTest ('Has a Facebook appID', {
        setup:function () {
            // Searches for:
            //   FB.init({
            //       appId      : '399677190122262'

            'use strict';

            this.facebookMatchPattern = /FB.init\(\{([\s\n])*appId([\s\n])*:([\s\n])*([\'\"])*([0-9])*([\'\"])*/g;
            this.facebookMatchId =/([0-9])+/g;
            this.sourceCode = this.page.source;
        },
        load : function () {

            'use strict';

            this
            .test('Do we have a Facebook ID?', function() {

                // Searches for:
                //   FB.init({
                //       appId      : '399677190122262'
                var facebookTag = this.sourceCode.match(this.facebookMatchPattern);

                if(facebookTag && facebookTag.length) { // we have a facebook tag

                    var id = facebookTag[0].match(this.facebookMatchId);
                    //var facebookId = this.config().facebookId;
                    var facebookId = this.config.facebookId;

                    // Have we got a facebook id
                    notEqual(id[0],'','Has A Facebook ID');

                    // Is the facebook id that we have the correct for this environment
                    equal(facebookId,id[0],'Facebook ID is ' + facebookId);


                } else { // no facebook tag found
                    ok(false,'Facebook Tag not found on page');
                }
            });
        }
    }
);
