define(["require", "exports", 'knockout', 'jquery'], function (require, exports, ko, $) {
    "use strict";
    var AreaViewModel = (function () {
        function AreaViewModel(vm) {
            this.main = vm;
            this.isMe = ko.observable(false);
            this.name = ko.observable("");
            this.subName = ko.observable("");
            this.action = {};
            this.image = ko.observable("");
            this.imageDesiredHeightRatio = ko.observable(.7);
            this.imageHeight = ko.observable();
            this.imageWidth = ko.observable();
            this.imageMarginTop = ko.observable();
        }
        AreaViewModel.prototype.calculateHeight = function () {
            var innerHeight = $("body").innerHeight();
            var imageHeight = (innerHeight * this.imageDesiredHeightRatio());
            this.imageHeight(imageHeight);
            this.imageMarginTop((innerHeight - imageHeight));
        };
        return AreaViewModel;
    }());
    exports.AreaViewModel = AreaViewModel;
});
//# sourceMappingURL=AreaViewModel.js.map