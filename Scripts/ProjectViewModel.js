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
            this.areaContent("<p><h2><strong>oak</strong>ideas</h2></p><p>Here are some of the public brain dumps.</p><p> I have much more that has not been aproved for public consumption yet.</p><p>Each and every project goes through an extensive process of re-evaluation, re-iteration, and pondering (<small><abbr class='initialism' title='Also Known As'>AKA</abbr> procrastination</small>) before it makes out into public eye.</p><p>Please feel free to tap in where you feel like.</p><p> <a href='https://github.com/oakcool?tab=repositories'><strong>see more... expect more</strong></a></p>");
            this.calculateHeight();
        }
        ProjectViewModel.prototype.doAction = function () {
            this.main.show(this);
            this.showContent(true);
        };
        return ProjectViewModel;
    }(oak.AreaViewModel));
    oak.ProjectViewModel = ProjectViewModel;
})(oak || (oak = {}));
//# sourceMappingURL=ProjectViewModel.js.map