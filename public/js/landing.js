
$(function () {
    var counter = 0;
    function changeBG(){
        var imgs = [
            "url(/images/landing1.jpg)",
            "url(/images/landing2.jpg)",
            "url(/images/landing3.jpg)",
            "url(/images/landing4.jpg)",
            "url(/images/landing6.jpg)",
            "url(/images/landing5.jpg)",
            "url(/images/landing7.jpg)"
        ]

        if(counter === imgs.length) counter = 0;
        $("body").css("background-image", imgs[counter]);

        counter++;
    }

    setInterval(changeBG, 2000);
});
