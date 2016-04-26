var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var AreaViewModel = (function () {
    function AreaViewModel() {
    }
    return AreaViewModel;
}());
var OakcoolViewModel = (function (_super) {
    __extends(OakcoolViewModel, _super);
    function OakcoolViewModel() {
        _super.call(this);
        this.name = ko.observable("oakcool");
        this.image = ko.observable("Content/mateusthoughtful.png");
    }
    OakcoolViewModel.prototype.show = function () {
    };
    return OakcoolViewModel;
}(AreaViewModel));
var MainViewModel = (function () {
    function MainViewModel() {
        this.current = ko.observable();
        this.areas = ko.observableArray();
        this.areas.push(new OakcoolViewModel());
    }
    MainViewModel.prototype.show = function (index) {
        this.current(this.areas[index]);
    };
    return MainViewModel;
}());
window.onload = function () {
    var mainViewModel = new MainViewModel();
    mainViewModel.show(0);
    ko.applyBindings(mainViewModel);
};
//# sourceMappingURL=app.js.map