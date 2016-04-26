define(["require", "exports", 'knockout', 'OakcoolViewModel', 'ProjectViewModel'], function (require, exports, ko, ovm, pvm) {
    "use strict";
    var MainViewModel = (function () {
        function MainViewModel() {
            this.areas = ko.observableArray();
            this.areas.push(new pvm.ProjectViewModel(this));
            var meVm = new ovm.OakcoolViewModel(this);
            this.areas.push(meVm);
            this.current = ko.observable(meVm);
        }
        MainViewModel.prototype.show = function (viewModel) {
            this.current(viewModel);
        };
        return MainViewModel;
    }());
    exports.MainViewModel = MainViewModel;
});
//# sourceMappingURL=MainViewModel.js.map