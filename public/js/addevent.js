$(function () {
    var today = new Date();
    var mm = today.getMonth()+1;
    var yyyy = today.getFullYear();
    var dd = today.getDate();
    if(mm<10){
        mm="0"+mm;
    }
    min = yyyy+'-'+mm+'-'+dd;
    console.log(min);
    $("#date").attr("min", min);
});