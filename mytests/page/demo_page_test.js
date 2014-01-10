registerTest ('Demo page test', {
    setup: function() {
        this.containerElement = this.workspace.document.getElementById("container");
        this.startBackground = this.containerElement.style.background; 
        this.otherColor = "red";
    },
    load:function() {
        var self = this;
    
        self 
        .test ("Do we have an element with the id 'container'?",function(){
            ok(this.containerElement,'An element with the id "container" exists.');
        })

        .test ("Does container have a background color of "+ self.otherColor +" ?",function(){
            this.containerElement.style.background = this.otherColor;
            equal(this.containerElement.style.background, this.otherColor, 'Container background should now be ' + self.otherColor );
        })
        .wait(function() {
            var that = this;

            setTimeout(function(){
                // this will cause the wait to exit on 100 milliseconds because it makes expression true before the timeout
                that.expressionGettingValid = true;
            },100);

            return this.expressionGettingValid; 

        }, 1500) // wait 1.5 seconds ( Pause execution of tests per duration )

        .test ("Have container background being restored to its previosu value?",function(){
            this.containerElement.style.background = this.startBackground;
            equal(this.containerElement.style.background, this.startBackground, 'Container background should now be set as its start value');
        })

        .loadPage(location.href.substr(0, location.href.lastIndexOf('/') + 1) + "core/demo/other.html") // load a different page into the frame
        .asyncTest ("Can we load some content into the page from openweathermap.org?",function($){

            this.workspace.document.getElementsByTagName("body")[0].style.background = self.otherColor;


            //console.log(this.page.source);

            // lets setup a global function to receive a jsonp request
            var url = "api.openweathermap.org/data/2.5/weather?q=Sydney,au",
                body = $("iframe").contents().find("body");

            this.get(url)
            .success(function(data) { // we got some validation results

                ok( typeof data === 'object', 'We got a JSON response' );

                if (typeof data === 'object') {
                    var cityName = data.name,
                        weather = data.weather[0].description;

                    ok( true, 'We got a response from wheather website using an assyncTest.' );

                    // update the page just for the sake of displaying some visual info
                    body
                    .css({"background": "white"})
                    .find("h1")
                    .html(cityName + " weather now: " + weather);
                }

                self.asyncTestDone();
            })
            .error(function() { // validation couldnt be performed.

                ok( false, 'Unable to load content from the weather station.' );

                // needs to be called upon assync tests
                self.asyncTestDone();
            });
        });
    }
});
