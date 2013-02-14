registerTest ('Form Validation test',
    {
        setup:function () {

            // tried everything - cookies not clearing!
            var expire = new Date (1970,0,1);
            setCookie('laravel_session','', expire,'/');
            setCookie('yellowglenauthdriver_remember','', expire,'/');
            setCookie('session_payload','', expire,'/');
            log ("cookies cleared")
        }
        ,load : function () {
            this
            .loadPage('/logout')  // tried everything - can't clear cookies in JS
            .loadPage()
            .test('page loaded',function($){
                equal($('form').length,1,"Has a form");
            })
            .run(function($){
                // submit empty form to get error messages
                $('form').submit();
            })
            .waitForPageLoad()
            .test ("test we have error messages",function($){
                equal($('input[name="firstname"]').hasClass('error'),1,"Firstname has error class");
                equal($('input[name="lastname"]').hasClass('error'),1,"lastname has error class");
                equal($('input[name="email"]').hasClass('error'),1,"email has error class");
                equal($('input[name="email_confirmation"]').hasClass('error'),1,"email_confirmation has error class");
                equal($('input[name="postcode"]').hasClass('error'),1,"postcode has error class");
                equal($('input[name="terms"]').hasClass('error'),1,"terms has error class");
            })
            .test ("test we can submit the form",function($){
                var email = 'email'+Math.random()+'@domain.com';
                $('input[name="firstname"]').val('Firstname');
                $('input[name="lastname"]').val('Lastname');
                $('input[name="email"]').val(email);
                $('input[name="email_confirmation"]').val(email);
                $('input[name="postcode"]').val('2026');
                $('input[name="dob"]').val('1980-12-12');
                $('input[name="terms"]').attr('checked','checked');
                ok($('form').submit(),'Form submits');
            })
            .waitForPageLoad()
            .test ("test we have no errors",function($){
                equal($('input.error').length,0,'We have no errors');
            })
            .start ();
        }
    }
);




function setCookie (name, value, expires, path, domain, secure) {
    var curCookie = name + "=" + encodeURIComponent(value) + (expires ? "; expires=" + expires.toGMTString() : "") + (path ? "; path=" + path : "") + (domain ? "; domain=" + domain : "") + (secure ? "secure" : "");
    document.cookie = curCookie;
}