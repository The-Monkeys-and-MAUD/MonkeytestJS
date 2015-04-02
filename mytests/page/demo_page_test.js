registerTest ('Demo page test', {
    setup: function() {
        this.containerElement = this.workspace.document.getElementById("container");
        this.startBackground = this.containerElement.style.background; 
        this.otherColor = "red";
    },
    load:function() {
        var self = this;
    
        self 
        .test ("Do we have an element with the id 'container'?",function(assert){
            assert.ok(this.containerElement,'An element with the id "container" exists.');
        })

         .test ("JQUery?",function(assert, $){
            var p = $("p");
            assert.ok(p.length > 0,'An element exists and JQuery knows about it');
        })

        .test ("Does container have a background color of "+ self.otherColor +" ?",function(assert){
            this.containerElement.style.background = this.otherColor;
            assert.equal(this.containerElement.style.background, this.otherColor, 'Container background should now be ' + self.otherColor );
        })
        .wait(function() {
            var that = this;

            setTimeout(function(){
                // this will cause the wait to exit on 100 milliseconds because it makes expression true before the timeout
                that.expressionGettingValid = true;
            },100);

            return this.expressionGettingValid; 

        }, 1500) // wait 1.5 seconds ( Pause execution of tests per duration )

        .test ("Have container background being restored to its previosu value?",function(assert){
            this.containerElement.style.background = this.startBackground;
            assert.equal(this.containerElement.style.background, this.startBackground, 'Container background should now be set as its start value');
        });
    }
});
