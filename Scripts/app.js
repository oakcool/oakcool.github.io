define(["require", "exports", 'knockout', 'MainViewModel', 'jquery'], function (require, exports, ko, vm, $) {
    "use strict";
    window.onload = function () {
        var mainViewModel = new vm.MainViewModel();
        ko.applyBindings(mainViewModel);
    };
    //for each element that is classed as 'pull-down', set its margin-top to the difference between its own height and the height of its parent
    $('.pull-down3_5ths').each(function () {
        var $this = $(this);
        var bodyHeight = $("body").innerHeight();
        //alert(totalHeight);
        $this.css('margin-top', (bodyHeight * 3) / 5);
    });
    $('.pull-down').each(function () {
        var $this = $(this);
        var columnHeight = $this.height();
        var bodyHeight = $("body").innerHeight();
        var imageHeight = $this.height();
        var totalHeight = bodyHeight - (bodyHeight * .7);
        //alert(totalHeight);
        $this.css('margin-top', totalHeight);
    });
});
//# sourceMappingURL=app.js.map