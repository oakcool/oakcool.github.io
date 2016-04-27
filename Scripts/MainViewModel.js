var oak;
(function (oak) {
    var MainViewModel = (function () {
        function MainViewModel() {
            this.areas = ko.observableArray();
            this.areas.push(new oak.ProjectViewModel(this));
            var meVm = new oak.OakcoolViewModel(this);
            this.areas.push(meVm);
            this.current = ko.observable(meVm);
        }
        MainViewModel.prototype.show = function (viewModel) {
            this.current(viewModel);
        };
        return MainViewModel;
    }());
    oak.MainViewModel = MainViewModel;
})(oak || (oak = {}));
//# sourceMappingURL=MainViewModel.js.map