var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var oak;
(function (oak) {
    var ProjectViewModel = (function (_super) {
        __extends(ProjectViewModel, _super);
        function ProjectViewModel(main) {
            _super.call(this, main);
            this.name("projects");
            this.subName("oakideas");
            this.action = this.doAction;
            this.image("Content/oakideasnew.png");
            this.imageDesiredHeightRatio(.4);
            this.calculateHeight();
        }
        ProjectViewModel.prototype.doAction = function () {
            this.main.show(this);
        };
        return ProjectViewModel;
    }(oak.AreaViewModel));
    oak.ProjectViewModel = ProjectViewModel;
})(oak || (oak = {}));
//# sourceMappingURL=ProjectViewModel.js.map